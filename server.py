#!/usr/bin/env python3
"""Local web server and search gateway for Scraaaper.

The browser cannot query most catalogue sites directly because they do not
allow cross-origin requests.  This server keeps every request on the local
machine, exposes a small same-origin JSON API, and serves the existing app.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import ssl
import sys
import threading
import time
import webbrowser
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, unquote, urlencode, urljoin, urlparse
from urllib.request import Request, urlopen


ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
if getattr(sys, "frozen", False):
    ROOT = ROOT / "web"
RESULT_LIMIT = 24
MAX_RESPONSE_BYTES = 8_000_000
REQUEST_TIMEOUT = 22
CACHE_TTL_SECONDS = 300
INDEX_REQUEST_GAP_SECONDS = 0.35

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 "
    "Scraaaper/1.0"
)

try:
    import certifi

    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CONTEXT = ssl.create_default_context()

_index_request_lock = threading.Lock()
_last_index_request = 0.0


SOURCE_LABELS = {
    "annasarchive": "Anna's Archive",
    "archive": "Internet Archive",
    "bdebooks": "BDE Books",
    "bookracy": "Bookracy",
    "booksee": "Booksee",
    "ebookoz": "Ebookoz",
    "freebannedbooks": "FreeBannedBooks",
    "gutenberg": "Project Gutenberg",
    "inventaire": "Inventaire",
    "jstor": "JSTOR",
    "liber3": "Liber3",
    "libgen": "LibGen",
    "mobilism": "Mobilism Forum",
    "monoskop": "Monoskop",
    "myanonamouse": "MyAnonamouse",
    "openlibrary": "Open Library",
    "scribd": "Scribd",
    "standardebooks": "Standard Ebooks",
    "vkbookstagram": "VK Bookstagram",
    "wikisource": "Wikisource",
    "zlib": "Z-Library",
}


# These sources either require authentication, render results in JavaScript,
# or actively block automated catalogue requests.  For them we return real
# pages from a public web index restricted to the source's own domain.
INDEX_SCOPES = {
    "annasarchive": ["annas-archive.gl/md5"],
    "bdebooks": ["bdebooks.com/en/books"],
    "booksee": ["en.booksee.org/book"],
    "ebookoz": ["ebookoz.net"],
    "jstor": ["jstor.org/stable"],
    "liber3": ["liber3.eth.limo"],
    "libgen": ["libgen.gl"],
    "mobilism": ["forum.mobilism.org"],
    "myanonamouse": ["myanonamouse.net"],
    "scribd": ["scribd.com/document"],
    "vkbookstagram": ["vk.com/bookstagram_eng"],
    "zlib": ["z-lib.gd", "z-library.sk"],
}


class SearchError(RuntimeError):
    pass


@dataclass
class Anchor:
    href: str
    text: str
    attrs: dict[str, str]
    image: str = ""


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.anchors: list[Anchor] = []
        self._attrs: dict[str, str] | None = None
        self._text: list[str] = []
        self._image = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag == "a":
            if self._attrs is not None:
                self._finish_anchor()
            self._attrs = values
            self._text = []
            self._image = ""
        elif tag == "img" and self._attrs is not None:
            self._image = (
                values.get("src")
                or values.get("data-src")
                or values.get("data-lazy-src")
                or ""
            )
            alt = values.get("alt", "").strip()
            if alt:
                self._text.append(alt)

    def handle_data(self, data: str) -> None:
        if self._attrs is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._attrs is not None:
            self._finish_anchor()

    def close(self) -> None:
        if self._attrs is not None:
            self._finish_anchor()
        super().close()

    def _finish_anchor(self) -> None:
        assert self._attrs is not None
        self.anchors.append(
            Anchor(
                href=self._attrs.get("href", ""),
                text=clean_text(" ".join(self._text), 300),
                attrs=self._attrs,
                image=self._image,
            )
        )
        self._attrs = None
        self._text = []
        self._image = ""


def clean_text(value: Any, limit: int = 180) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]*>", " ", text)
    return re.sub(r"\s+", " ", text).strip()[:limit]


def item(
    source: str,
    title: Any,
    link: str,
    *,
    author: Any = "",
    year: Any = "",
    cover: str | None = None,
    file_type: str | None = None,
    search_mode: str = "native",
) -> dict[str, Any]:
    return {
        "source": source,
        "title": clean_text(title, 240),
        "author": clean_text(author, 180),
        "year": clean_text(year, 12),
        "cover": cover or None,
        "link": link,
        "fileType": clean_text(file_type, 20).lower() or None,
        "searchMode": search_mode,
    }


def dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for entry in items:
        if not entry.get("title") or not entry.get("link"):
            continue
        key = (
            re.sub(r"\W+", "", str(entry["title"]).casefold()),
            str(entry["link"]).split("#", 1)[0],
        )
        if key in seen:
            continue
        seen.add(key)
        result.append(entry)
        if len(result) >= RESULT_LIMIT:
            break
    return result


def fetch_bytes(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    method: str = "GET",
    body: bytes | None = None,
) -> tuple[bytes, str]:
    request_headers = {
        "User-Agent": USER_AGENT,
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        "Accept": "application/json, application/xml, text/html;q=0.9, */*;q=0.8",
    }
    request_headers.update(headers or {})
    request = Request(url, headers=request_headers, data=body, method=method)
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT, context=SSL_CONTEXT) as response:
            data = response.read(MAX_RESPONSE_BYTES + 1)
            if len(data) > MAX_RESPONSE_BYTES:
                raise SearchError("risposta remota troppo grande")
            return data, response.headers.get_content_charset() or "utf-8"
    except HTTPError as exc:
        raise SearchError(f"HTTP {exc.code} da {urlparse(url).netloc}") from exc
    except (URLError, TimeoutError, OSError) as exc:
        reason = getattr(exc, "reason", exc)
        raise SearchError(f"{urlparse(url).netloc}: {reason}") from exc


def fetch_text(url: str, **kwargs: Any) -> str:
    data, charset = fetch_bytes(url, **kwargs)
    return data.decode(charset, "replace")


def fetch_json(url: str, **kwargs: Any) -> Any:
    data, charset = fetch_bytes(url, **kwargs)
    try:
        return json.loads(data.decode(charset, "replace"))
    except json.JSONDecodeError as exc:
        raise SearchError(f"risposta non JSON da {urlparse(url).netloc}") from exc


def parse_anchors(page: str) -> list[Anchor]:
    parser = AnchorParser()
    parser.feed(page)
    parser.close()
    return parser.anchors


def native_anchor_search(
    source: str,
    url: str,
    href_pattern: str,
    *,
    title_filter: Callable[[str], bool] | None = None,
) -> list[dict[str, Any]]:
    page = fetch_text(url)
    anchors = parse_anchors(page)
    records: dict[str, dict[str, str]] = {}
    for anchor in anchors:
        full_link = urljoin(url, anchor.href)
        if not re.search(href_pattern, full_link, re.I):
            continue
        record = records.setdefault(full_link, {"title": "", "cover": ""})
        candidate = clean_text(anchor.text or anchor.attrs.get("title", ""), 240)
        if candidate and (title_filter is None or title_filter(candidate)):
            if len(candidate) > len(record["title"]):
                record["title"] = candidate
        if anchor.image:
            record["cover"] = urljoin(url, anchor.image)

    results = []
    for link, record in records.items():
        title = record["title"]
        if not title:
            continue
        author = ""
        if source == "bdebooks":
            slug = urlparse(link).path.rstrip("/").split("/")[-1]
            if "-by-" in slug:
                author = slug.rsplit("-by-", 1)[-1].replace("-", " ").title()
        results.append(item(source, title, link, author=author, cover=record["cover"] or None))
    return dedupe(results)


def search_openlibrary(query: str, lang: str) -> list[dict[str, Any]]:
    params = urlencode({"q": query, "limit": RESULT_LIMIT})
    data = fetch_json(f"https://openlibrary.org/search.json?{params}")
    results = []
    for doc in data.get("docs", []):
        author = doc.get("author_name") or []
        if isinstance(author, list):
            author = ", ".join(str(value) for value in author)
        cover_id = doc.get("cover_i")
        results.append(
            item(
                "openlibrary",
                doc.get("title"),
                f"https://openlibrary.org{doc.get('key', '')}",
                author=author,
                year=doc.get("first_publish_year", ""),
                cover=f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None,
            )
        )
    return dedupe(results)


def search_gutenberg(query: str, lang: str) -> list[dict[str, Any]]:
    data = fetch_json(f"https://gutendex.com/books?{urlencode({'search': query})}")
    results = []
    for book in data.get("results", [])[:RESULT_LIMIT]:
        authors = ", ".join(
            clean_text(author.get("name")) for author in book.get("authors", []) if author.get("name")
        )
        formats = book.get("formats") or {}
        results.append(
            item(
                "gutenberg",
                book.get("title"),
                f"https://www.gutenberg.org/ebooks/{book.get('id')}",
                author=authors,
                cover=formats.get("image/jpeg"),
                file_type="html",
            )
        )
    return dedupe(results)


def search_archive(query: str, lang: str) -> list[dict[str, Any]]:
    params = urlencode(
        {
            "q": f"{query} AND mediatype:texts",
            "fl[]": ["identifier", "title", "creator", "year", "format"],
            "rows": RESULT_LIMIT,
            "output": "json",
        },
        doseq=True,
    )
    data = fetch_json(f"https://archive.org/advancedsearch.php?{params}")
    results = []
    for doc in data.get("response", {}).get("docs", []):
        creator = doc.get("creator", "")
        if isinstance(creator, list):
            creator = ", ".join(str(value) for value in creator)
        formats = doc.get("format") or []
        if isinstance(formats, str):
            formats = [formats]
        detected = next(
            (fmt for fmt in ("PDF", "EPUB", "MOBI", "DJVU", "TXT") if any(fmt in str(v).upper() for v in formats)),
            None,
        )
        identifier = doc.get("identifier", "")
        results.append(
            item(
                "archive",
                doc.get("title"),
                f"https://archive.org/details/{quote(str(identifier))}",
                author=creator,
                year=doc.get("year", ""),
                cover=f"https://archive.org/services/img/{quote(str(identifier))}",
                file_type=detected,
            )
        )
    return dedupe(results)


def search_inventaire(query: str, lang: str) -> list[dict[str, Any]]:
    params = urlencode({"types": "works", "search": query, "limit": RESULT_LIMIT})
    data = fetch_json(f"https://inventaire.io/api/search?{params}")
    results = []
    for result in data.get("results", []):
        image_path = result.get("image")
        cover = urljoin("https://inventaire.io", image_path) if isinstance(image_path, str) else None
        results.append(
            item(
                "inventaire",
                result.get("label"),
                f"https://inventaire.io/entity/{quote(str(result.get('uri', '')), safe=':')}",
                author=result.get("description", ""),
                cover=cover,
            )
        )
    return dedupe(results)


def search_mediawiki(source: str, query: str, lang: str) -> list[dict[str, Any]]:
    if source == "wikisource":
        host = "it.wikisource.org" if lang == "it" else "en.wikisource.org"
        endpoint = f"https://{host}/w/api.php"
    else:
        endpoint = "https://monoskop.org/api.php"
    params = urlencode(
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": RESULT_LIMIT,
            "prop": "pageimages|info",
            "piprop": "thumbnail",
            "pithumbsize": 300,
            "inprop": "url",
            "format": "json",
            "origin": "*",
        }
    )
    data = fetch_json(f"{endpoint}?{params}")
    pages = list(data.get("query", {}).get("pages", {}).values())
    pages.sort(key=lambda value: value.get("index", 999999))
    results = []
    for page in pages:
        results.append(
            item(
                source,
                page.get("title"),
                page.get("fullurl") or endpoint,
                cover=(page.get("thumbnail") or {}).get("source"),
                file_type="html",
            )
        )
    return dedupe(results)


def search_standardebooks(query: str, lang: str) -> list[dict[str, Any]]:
    data, _ = fetch_bytes(
        f"https://standardebooks.org/feeds/opds/all?{urlencode({'query': query})}",
        headers={"Accept": "application/atom+xml;profile=opds-catalog"},
    )
    try:
        root = ET.fromstring(data)
    except ET.ParseError as exc:
        raise SearchError("feed OPDS non valido da Standard Ebooks") from exc
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    results = []
    for entry in root.findall("atom:entry", ns):
        title = entry.findtext("atom:title", default="", namespaces=ns)
        authors = ", ".join(
            name
            for name in (
                author.findtext("atom:name", default="", namespaces=ns)
                for author in entry.findall("atom:author", ns)
            )
            if name
        )
        link = ""
        cover = None
        for link_node in entry.findall("atom:link", ns):
            rel = link_node.attrib.get("rel", "")
            if rel == "alternate":
                link = link_node.attrib.get("href", "")
            elif rel.endswith("image/thumbnail"):
                cover = link_node.attrib.get("href")
        published = entry.findtext("atom:published", default="", namespaces=ns)
        results.append(
            item(
                "standardebooks",
                title,
                link,
                author=authors,
                year=published[:4],
                cover=cover,
                file_type="epub",
            )
        )
    return dedupe(results)


def search_bookracy(query: str, lang: str) -> list[dict[str, Any]]:
    params = urlencode({"query": query, "lang": "all", "limit": RESULT_LIMIT})
    data = fetch_json(f"https://api.bookracy.com/api/books?{params}")
    results = []
    for book in data.get("results", []):
        md5 = clean_text(book.get("md5"), 40)
        # Bookracy has no stable public detail route; its own search page opens
        # the matching item and avoids exposing a direct-download URL here.
        link = f"https://bookracy.com/?{urlencode({'q': book.get('title') or query})}"
        results.append(
            item(
                "bookracy",
                book.get("title"),
                link,
                author=book.get("author", ""),
                year=book.get("year", ""),
                cover=book.get("book_image") or (f"https://api.bookracy.com/cover/{md5}/thumbnail.jpg" if md5 else None),
                file_type=book.get("book_filetype"),
            )
        )
    return dedupe(results)


def search_scribd(query: str, lang: str) -> list[dict[str, Any]]:
    locale = "www" if lang == "en" else "it"
    params = urlencode({"query": query})
    endpoint = f"https://{locale}.scribd.com/search/query?{params}"
    data = fetch_json(
        endpoint,
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"https://{locale}.scribd.com/search?{params}",
        },
    )
    documents = data.get("results", {}).get("documents", {}).get("content", {}).get("documents", [])
    results = []
    for document in documents[:RESULT_LIMIT]:
        author = document.get("author") or {}
        released_at = clean_text(document.get("releasedAt"), 20)
        results.append(
            item(
                "scribd",
                document.get("title"),
                document.get("reader_url")
                or f"https://{locale}.scribd.com/document/{document.get('id', '')}",
                author=author.get("name", "") if isinstance(author, dict) else author,
                year=released_at[:4],
                cover=document.get("image_url") or document.get("retina_image_url"),
            )
        )
    return dedupe(results)


def search_annasarchive(query: str, lang: str) -> list[dict[str, Any]]:
    url = f"https://annas-archive.gl/search?{urlencode({'q': query})}"
    return native_anchor_search(
        "annasarchive",
        url,
        r"annas-archive\.gl/md5/[a-f0-9]{32}",
        title_filter=lambda title: title.casefold() not in {"download", "slow downloads", "fast downloads"},
    )


def search_bdebooks(query: str, lang: str) -> list[dict[str, Any]]:
    url = f"https://bdebooks.com/en/?{urlencode({'s': query})}"
    return native_anchor_search("bdebooks", url, r"bdebooks\.com/en/books/[^/?#]+$")


def search_booksee(query: str, lang: str) -> list[dict[str, Any]]:
    url = f"https://en.booksee.org/?{urlencode({'q': query})}"
    return native_anchor_search(
        "booksee",
        url,
        r"en\.booksee\.org/book/\d+$",
        title_filter=lambda title: title.casefold() not in {"download", "read online"},
    )


def search_freebannedbooks(query: str, lang: str) -> list[dict[str, Any]]:
    url = "https://freebannedbooks.org/"
    page = fetch_text(url)
    terms = [term.casefold() for term in re.findall(r"[\w']+", query) if len(term) > 1]
    results = []
    for anchor in parse_anchors(page):
        title = clean_text(anchor.text, 240)
        if not title or not anchor.href:
            continue
        haystack = title.casefold()
        if terms and not all(term in haystack for term in terms):
            continue
        author = ""
        if " by " in title.casefold():
            parts = re.split(r"\s+by\s+", title, maxsplit=1, flags=re.I)
            title, author = parts[0], parts[1]
        results.append(
            item(
                "freebannedbooks",
                title,
                urljoin(url, anchor.href),
                author=author,
                cover=urljoin(url, anchor.image) if anchor.image else None,
                file_type="pdf",
            )
        )
    return dedupe(results)


def search_libgen(query: str, lang: str) -> list[dict[str, Any]]:
    url = f"https://libgen.gl/index.php?{urlencode({'req': query})}"
    anchors = parse_anchors(fetch_text(url))
    pending: dict[str, str] | None = None
    results = []
    for anchor in anchors:
        href = anchor.href
        if re.search(r"(?:^|/)edition\.php\?id=\d+", href):
            title = clean_text(anchor.text, 240)
            if not title or title.startswith("#"):
                continue
            raw_description = anchor.attrs.get("title", "")
            description = clean_text(re.split(r"<br\s*/?>", raw_description, flags=re.I)[-1], 400)
            author = ""
            if " - " in description:
                candidate = description.split(" - ", 1)[0]
                if not re.match(r"^(?:Add/Edit|\d{4})", candidate, re.I):
                    author = candidate
            extension_match = re.search(r"\b(pdf|epub|mobi|azw3|djvu|fb2|txt)\b", description, re.I)
            pending = {
                "title": title,
                "author": author,
                "file_type": extension_match.group(1).lower() if extension_match else "",
                "edition_link": urljoin(url, href),
            }
        elif pending and re.search(r"(?:^|/)file\.php\?id=\d+", href):
            results.append(
                item(
                    "libgen",
                    pending["title"],
                    urljoin(url, href),
                    author=pending["author"],
                    file_type=pending["file_type"],
                )
            )
            pending = None
            if len(results) >= RESULT_LIMIT:
                break
    return dedupe(results)


def decode_yahoo_link(href: str) -> str:
    full = urljoin("https://search.yahoo.com", href)
    parsed = urlparse(full)
    if parsed.netloc.casefold().endswith("r.search.yahoo.com"):
        match = re.search(r"/RU=([^/]+)/RK=", parsed.path)
        if match:
            return unquote(match.group(1))
    return full


def indexed_search(source: str, query: str) -> list[dict[str, Any]]:
    global _last_index_request

    scopes = INDEX_SCOPES[source]
    site_expression = " OR ".join(f"site:{scope}" for scope in scopes)
    search_query = f"({site_expression}) {query}" if len(scopes) > 1 else f"{site_expression} {query}"
    url = f"https://search.yahoo.com/search?{urlencode({'p': search_query})}"
    with _index_request_lock:
        delay = INDEX_REQUEST_GAP_SECONDS - (time.monotonic() - _last_index_request)
        if delay > 0:
            time.sleep(delay)
        _last_index_request = time.monotonic()
    try:
        page = fetch_text(url, headers={"Accept": "text/html"})
    except SearchError as exc:
        if not re.search(r"HTTP (?:429|500|503)\b", str(exc)):
            raise
        time.sleep(INDEX_REQUEST_GAP_SECONDS)
        page = fetch_text(url, headers={"Accept": "text/html"})
    anchors = parse_anchors(page)
    results: list[dict[str, Any]] = []
    allowed_hosts = [scope.split("/", 1)[0].casefold() for scope in scopes]
    for anchor in anchors:
        if anchor.attrs.get("data-matarget") != "algo":
            continue
        link = decode_yahoo_link(anchor.href)
        hostname = (urlparse(link).hostname or "").casefold()
        if not any(hostname == host or hostname.endswith(f".{host}") for host in allowed_hosts):
            continue
        title = re.sub(
            r"^.*?\bhttps?://\S+(?:\s+›\s+\S+)*\s+",
            "",
            clean_text(anchor.text, 400),
        )
        results.append(item(source, title, link, search_mode="indexed"))
    terms = [term.casefold() for term in re.findall(r"[\w']+", query) if len(term) > 2]
    relevant = [
        result
        for result in results
        if not terms
        or all(term in f"{result.get('title', '')} {result.get('author', '')}".casefold() for term in terms)
    ]
    return dedupe(relevant)


NativeSearch = Callable[[str, str], list[dict[str, Any]]]

NATIVE_SEARCHERS: dict[str, NativeSearch] = {
    "annasarchive": search_annasarchive,
    "archive": search_archive,
    "bdebooks": search_bdebooks,
    "bookracy": search_bookracy,
    "booksee": search_booksee,
    "freebannedbooks": search_freebannedbooks,
    "gutenberg": search_gutenberg,
    "inventaire": search_inventaire,
    "libgen": search_libgen,
    "monoskop": lambda query, lang: search_mediawiki("monoskop", query, lang),
    "openlibrary": search_openlibrary,
    "scribd": search_scribd,
    "standardebooks": search_standardebooks,
    "wikisource": lambda query, lang: search_mediawiki("wikisource", query, lang),
}


_cache: dict[tuple[str, str, str], tuple[float, dict[str, Any]]] = {}
_cache_lock = threading.Lock()


def search_source(source: str, query: str, lang: str) -> dict[str, Any]:
    cache_key = (source, query.casefold(), lang)
    with _cache_lock:
        cached = _cache.get(cache_key)
        if cached and time.monotonic() - cached[0] < CACHE_TTL_SECONDS:
            return cached[1]

    native_error: Exception | None = None
    results: list[dict[str, Any]] = []
    mode = "native"
    searcher = NATIVE_SEARCHERS.get(source)
    if searcher is not None:
        try:
            results = searcher(query, lang)
        except Exception as exc:  # keep index fallback available
            native_error = exc

    index_error: Exception | None = None
    if not results and source in INDEX_SCOPES:
        try:
            results = indexed_search(source, query)
            mode = "indexed"
        except Exception as exc:
            index_error = exc

    if not results and searcher is None and source not in INDEX_SCOPES:
        raise SearchError(f"sorgente non configurata: {source}")
    if native_error and index_error:
        raise SearchError(f"ricerca nativa: {native_error}; indice web: {index_error}")
    if searcher is None and index_error:
        raise SearchError(str(index_error))

    payload = {
        "source": source,
        "label": SOURCE_LABELS[source],
        "mode": mode,
        "results": dedupe(results),
    }
    with _cache_lock:
        _cache[cache_key] = (time.monotonic(), payload)
    return payload


class AppHandler(SimpleHTTPRequestHandler):
    server_version = "Scraaaper/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_json({"ok": True, "sources": list(SOURCE_LABELS)})
            return
        if parsed.path == "/api/search":
            self.handle_search(parsed.query)
            return
        super().do_GET()

    def handle_search(self, raw_query: str) -> None:
        params = parse_qs(raw_query)
        source = clean_text(params.get("source", [""])[0], 40)
        query = clean_text(params.get("q", [""])[0], 200)
        lang = "en" if params.get("lang", ["it"])[0] == "en" else "it"
        if source not in SOURCE_LABELS:
            self.send_json({"error": "sorgente non valida"}, status=400)
            return
        if not query:
            self.send_json({"source": source, "mode": "native", "results": []})
            return
        try:
            self.send_json(search_source(source, query, lang))
        except Exception as exc:
            self.send_json({"source": source, "error": clean_text(exc, 500)}, status=502)

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def log_message(self, format: str, *args: Any) -> None:
        if self.path.startswith("/api/") and args and str(args[1]).startswith("2"):
            return
        super().log_message(format, *args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Avvia Scraaaper in locale")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8934)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    address = (args.host, args.port)
    server = ThreadingHTTPServer(address, AppHandler)
    actual_port = server.server_address[1]
    url = f"http://{args.host}:{actual_port}/"
    print(f"SCRAAAPER_READY={url}", flush=True)
    print(f"Scraaaper è attivo su {url}", flush=True)
    print("Per chiuderlo premi Ctrl+C in questa finestra.", flush=True)
    if not args.no_browser:
        threading.Timer(0.7, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nScraaaper arrestato.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
