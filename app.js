const RESULTS_PER_SOURCE = 24;
const SOURCE_TIMEOUT_MS = 30_000;

const UI_TEXT = {
  it: {
    placeholder: "Cerca un titolo, un autore…",
    searching: "Ricerca in corso…",
    empty: "Nessun risultato.",
    backendOffline: "Il motore di ricerca non risponde. Chiudi e riapri Scraaaper.",
    indexed: "indice web",
    footer: "/ scraaaper è un motore di ricerca gratuito e open source per la ricerca di libri da fonti pubbliche, archivi e librerie online",
    results: (count, failedSources, hasRealResults) => {
      const base = `${count} risultati`;
      if (failedSources.length) {
        return `${base} · non raggiungibili: ${failedSources.join(", ")}`;
      }
      if (!hasRealResults) {
        return `${base} · non trovato`;
      }
      return base;
    },
    sort: {
      relevance: "Rilevanza",
      date: "Data",
      author: "Autore",
      title: "Titolo",
    },
    formats: {
      all: "Tutti",
      pdf: "PDF",
      epub: "EPUB",
      mobi: "MOBI",
      azw3: "AZW3",
      djvu: "DJVU",
      txt: "TXT",
      html: "HTML",
    },
  },
  en: {
    placeholder: "Search a title, an author…",
    searching: "Searching…",
    empty: "No results.",
    backendOffline: "The search engine is not responding. Quit and reopen Scraaaper.",
    indexed: "web index",
    footer: "/ scraaaper is a free and open-source search engine for finding books from public sources, archives, and online libraries",
    results: (count, failedSources, hasRealResults) => {
      const base = `${count} results`;
      if (failedSources.length) {
        return `${base} · unreachable: ${failedSources.join(", ")}`;
      }
      if (!hasRealResults) {
        return `${base} · not found`;
      }
      return base;
    },
    sort: {
      relevance: "Relevance",
      date: "Date",
      author: "Author",
      title: "Title",
    },
    formats: {
      all: "All",
      pdf: "PDF",
      epub: "EPUB",
      mobi: "MOBI",
      azw3: "AZW3",
      djvu: "DJVU",
      txt: "TXT",
      html: "HTML",
    },
  },
};

const SOURCE_LABELS = {
  annasarchive: "Anna's Archive",
  archive: "Internet Archive",
  bdebooks: "BDE Books",
  bookracy: "Bookracy",
  booksee: "Booksee",
  ebookoz: "Ebookoz",
  freebannedbooks: "FreeBannedBooks",
  gutenberg: "Project Gutenberg",
  inventaire: "Inventaire",
  jstor: "JSTOR",
  liber3: "Liber3",
  libgen: "LibGen",
  mobilism: "Mobilism Forum",
  monoskop: "Monoskop",
  myanonamouse: "MyAnonamouse",
  openlibrary: "Open Library",
  scribd: "Scribd",
  standardebooks: "Standard Ebooks",
  vkbookstagram: "VK Bookstagram",
  wikisource: "Wikisource",
  zlib: "Z-Library",
};

async function searchSource(sourceKey, query, signal) {
  const params = new URLSearchParams({ source: sourceKey, q: query, lang: currentLang });
  const requestController = new AbortController();
  let didTimeout = false;
  const abortFromSearch = () => requestController.abort();
  signal.addEventListener("abort", abortFromSearch, { once: true });
  const timeout = setTimeout(() => {
    didTimeout = true;
    requestController.abort();
  }, SOURCE_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`/api/search?${params}`, {
      signal: requestController.signal,
      headers: { Accept: "application/json" },
    });
  } catch (cause) {
    if (cause && cause.name === "AbortError" && signal.aborted) throw cause;
    if (cause && cause.name === "AbortError" && didTimeout) {
      throw new Error(`${SOURCE_LABELS[sourceKey]}: timeout`);
    }
    const error = new Error("BACKEND_UNAVAILABLE", { cause });
    error.code = "BACKEND_UNAVAILABLE";
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abortFromSearch);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const error = new Error("BACKEND_UNAVAILABLE");
    error.code = "BACKEND_UNAVAILABLE";
    throw error;
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `${SOURCE_LABELS[sourceKey]}: HTTP ${response.status}`);
  }
  return Array.isArray(data.results) ? data.results.slice(0, RESULTS_PER_SOURCE) : [];
}

const FETCHERS = Object.fromEntries(
  Object.keys(SOURCE_LABELS).map((sourceKey) => [
    sourceKey,
    (query, signal) => searchSource(sourceKey, query, signal),
  ])
);

const qInput = document.getElementById("q");
const grid = document.getElementById("grid");
const status = document.getElementById("status");
const sourcesNav = document.getElementById("sources");
const footerText = document.getElementById("footerText");
const themeToggle = document.getElementById("themeToggle");
const langToggle = document.getElementById("langToggle");
const resultControls = document.getElementById("resultControls");

let activeSources = new Set(Object.keys(SOURCE_LABELS));
let currentController = null;
let debounceTimer = null;
let lastResults = [];
let lastFailedSources = [];
let currentSort = "relevance";
let currentFormat = "all";
let currentLang = localStorage.getItem("reading-lang") || "it";
const landing = document.getElementById("landing");
const landingWord = document.getElementById("landingWord");

function setTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.body.style.background = isDark ? "#060606" : "#fdfdfc";
  document.body.style.color = isDark ? "#f5f5f0" : "#111";
  document.querySelector(".page")?.style.setProperty("background", isDark ? "#060606" : "#fdfdfc");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("reading-theme", isDark ? "dark" : "light");
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("reading-lang", lang);
  qInput.placeholder = UI_TEXT[lang].placeholder;
  document.documentElement.lang = lang === "en" ? "en" : "it";
  footerText.textContent = UI_TEXT[lang].footer;
  sourcesNav.querySelectorAll(".chip").forEach((chip) => {
    const source = chip.dataset.source;
    if (source === "all") {
      chip.textContent = lang === "en" ? "All" : "Tutte";
    }
  });
  if (qInput.value.trim()) {
    runSearch(qInput.value);
  } else {
    status.textContent = "";
  }
}

const savedTheme = localStorage.getItem("reading-theme");
const shouldDark = savedTheme === "light" ? false : true;
setTheme(shouldDark);
applyLanguage(currentLang);

function startLanding() {
  const isMobile = window.matchMedia("(max-width: 560px)").matches || window.innerWidth <= 560;
  if (isMobile) {
    document.body.classList.add("ready");
    document.documentElement.classList.add("ready");
    landing.classList.add("hidden");
    return;
  }

  const buildWord = (aCount) => `scr${"a".repeat(aCount)}ping`;
  const baseWord = buildWord(1);
  const targetWidth = Math.max(280, window.innerWidth - 40);
  let aCount = 1;
  landingWord.textContent = baseWord;

  const stepInterval = setInterval(() => {
    aCount += 1;
    const nextWord = buildWord(aCount);
    landingWord.textContent = nextWord;

    if (landingWord.getBoundingClientRect().width >= targetWidth || aCount >= 80) {
      clearInterval(stepInterval);
    }
  }, 28);

  setTimeout(() => {
    clearInterval(stepInterval);
    document.body.classList.add("ready");
    document.documentElement.classList.add("ready");
    landing.classList.add("hidden");
  }, 2900);
}

startLanding();

themeToggle.addEventListener("click", () => {
  const next = !document.body.classList.contains("dark");
  setTheme(next);
});

langToggle.addEventListener("click", () => {
  applyLanguage(currentLang === "it" ? "en" : "it");
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function inferFormat(item) {
  const candidates = [item.fileType, item.format, item.file_format, item.formatType, item.extension, item.mimeType, item.type];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = String(candidate).toLowerCase();
    if (value.includes("pdf")) return "pdf";
    if (value.includes("epub")) return "epub";
    if (value.includes("mobi")) return "mobi";
    if (value.includes("azw3")) return "azw3";
    if (value.includes("djvu")) return "djvu";
    if (value.includes("txt")) return "txt";
    if (value.includes("html")) return "html";
    if (value.includes("fb2")) return "fb2";
    if (value.includes("docx")) return "docx";
    if (value.includes("chm")) return "chm";
    if (value.includes("rar")) return "rar";
  }
  return null;
}

function buildMetaLine(item) {
  const authorPart = item.author ? String(item.author).trim() : "";
  const details = [];
  if (item.year) details.push(String(item.year));
  const format = inferFormat(item);
  if (format) details.push(format.toUpperCase());
  const detailsText = details.length ? ` · ${escapeHtml(details.join(" · "))}` : "";
  return authorPart ? `${escapeHtml(authorPart)}${detailsText}` : `${escapeHtml(details.join(" · "))}`;
}

function renderCard(item) {
  const isShortcut = !isGenuineResult(item);
  const modeSuffix = item.searchMode === "indexed" ? ` · ${UI_TEXT[currentLang].indexed}` : "";
  const coverHtml = item.cover
    ? `<img src="${escapeHtml(item.cover)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;placeholder&quot;>${escapeHtml(item.title)}</span>'" />`
    : `<span class="placeholder">${isShortcut ? "🔎" : escapeHtml(item.title)}</span>`;
  const metaText = buildMetaLine(item);

  return `
    <a class="card${isShortcut ? " card-shortcut" : ""}" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
      <div class="cover">
        <span class="source-tag">${escapeHtml(SOURCE_LABELS[item.source] || item.source)}${escapeHtml(modeSuffix)}</span>
        ${coverHtml}
      </div>
      <div class="title">${escapeHtml(item.title || "Senza titolo")}</div>
      <div class="author">${metaText}</div>
    </a>
  `;
}

function sortResults(list) {
  const next = [...list];
  switch (currentSort) {
    case "date":
      return next.sort((a, b) => {
        const yearA = Number(a.year) || 0;
        const yearB = Number(b.year) || 0;
        if (yearA !== yearB) return yearB - yearA;
        return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
      });
    case "author":
      return next.sort((a, b) => {
        const authorA = String(a.author || "").trim().toLowerCase();
        const authorB = String(b.author || "").trim().toLowerCase();
        return authorA.localeCompare(authorB, undefined, { sensitivity: "base" });
      });
    case "title":
      return next.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
    default:
      return next;
  }
}

function applyFormatMetadata(items) {
  // Never invent a file format from the source name: filters must reflect
  // metadata actually returned by the catalogue.
  return items;
}

function isGenuineResult(item) {
  if (!item || !item.link || item.link === "") return false;
  if (item.isFallback === true) return false;
  const author = String(item.author || "").trim();
  if (author.startsWith("Cerca su") || author.startsWith("Search on")) return false;
  return Boolean(item.source && item.title);
}

function isDisplayableResult(item) {
  return Boolean(item && item.link && item.source && item.title);
}

function getVisibleResults() {
  const filteredBySource = lastResults.filter((r) => activeSources.has(r.source));
  const displayable = filteredBySource.filter(isDisplayableResult);
  const genuine = displayable.filter(isGenuineResult);
  const shortcuts = displayable.filter((r) => !isGenuineResult(r));
  const withFormats = applyFormatMetadata(genuine);
  const filteredByFormat = currentFormat === "all"
    ? withFormats
    : withFormats.filter((r) => inferFormat(r) === currentFormat);
  // shortcut cards ("search on X") have no real file format, only show them in the "all" view
  const visibleShortcuts = currentFormat === "all" ? shortcuts : [];
  return sortResults([...filteredByFormat, ...visibleShortcuts]);
}

function renderResultControls() {
  const hasQuery = qInput.value.trim();
  if (!hasQuery) {
    resultControls.innerHTML = "";
    return;
  }

  const sortButtons = [
    { key: "relevance", label: UI_TEXT[currentLang].sort.relevance },
    { key: "date", label: UI_TEXT[currentLang].sort.date },
    { key: "author", label: UI_TEXT[currentLang].sort.author },
    { key: "title", label: UI_TEXT[currentLang].sort.title },
  ];
  const formatButtons = [
    { key: "all", label: UI_TEXT[currentLang].formats.all },
    { key: "pdf", label: UI_TEXT[currentLang].formats.pdf },
    { key: "epub", label: UI_TEXT[currentLang].formats.epub },
    { key: "mobi", label: UI_TEXT[currentLang].formats.mobi },
    { key: "azw3", label: UI_TEXT[currentLang].formats.azw3 },
    { key: "djvu", label: UI_TEXT[currentLang].formats.djvu },
    { key: "txt", label: UI_TEXT[currentLang].formats.txt },
    { key: "html", label: UI_TEXT[currentLang].formats.html },
  ];

  resultControls.innerHTML = `
    <div class="control-group">
      ${sortButtons.map((opt) => `<button class="control-btn ${currentSort === opt.key ? "active" : ""}" data-sort="${opt.key}" type="button">${escapeHtml(opt.label)}</button>`).join("")}
    </div>
    <div class="control-group">
      ${formatButtons.map((opt) => `<button class="control-btn ${currentFormat === opt.key ? "active" : ""}" data-format="${opt.key}" type="button">${escapeHtml(opt.label)}</button>`).join("")}
    </div>
  `;
}

function renderResults() {
  renderResultControls();
  const visible = getVisibleResults();
  if (visible.length === 0) {
    grid.innerHTML = "";
    if (qInput.value.trim()) {
      grid.innerHTML = `<p class="empty">${UI_TEXT[currentLang].empty}</p>`;
    }
    return;
  }
  grid.innerHTML = visible.map(renderCard).join("");
}

async function runSearch(query) {
  if (currentController) currentController.abort();
  currentController = new AbortController();
  const { signal } = currentController;

  if (!query.trim()) {
    lastResults = [];
    lastFailedSources = [];
    status.textContent = "";
    renderResults();
    return;
  }

  status.textContent = UI_TEXT[currentLang].searching;
  renderResultControls();
  grid.innerHTML = "";

  const sourceKeys = Object.keys(FETCHERS).filter((key) => activeSources.has(key));
  const settled = await Promise.allSettled(
    sourceKeys.map((key) => FETCHERS[key](query, signal))
  );

  if (signal.aborted) return;

  let merged = [];
  let failedSources = [];
  let backendUnavailable = false;
  settled.forEach((result, i) => {
    const key = sourceKeys[i];
    if (result.status === "fulfilled") {
      merged = merged.concat(result.value);
    } else {
      failedSources.push(SOURCE_LABELS[key]);
      if (result.reason && result.reason.code === "BACKEND_UNAVAILABLE") {
        backendUnavailable = true;
      }
    }
  });

  // interleave results from different sources instead of grouping by source
  const bySource = {};
  merged.forEach((item) => {
    (bySource[item.source] = bySource[item.source] || []).push(item);
  });
  const interleaved = [];
  let more = true;
  while (more) {
    more = false;
    for (const key of sourceKeys) {
      const arr = bySource[key];
      if (arr && arr.length) {
        interleaved.push(arr.shift());
        more = true;
      }
    }
  }

  const hasRealResults = interleaved.some(isGenuineResult);
  lastResults = interleaved;
  lastFailedSources = failedSources;
  status.textContent = backendUnavailable
    ? UI_TEXT[currentLang].backendOffline
    : UI_TEXT[currentLang].results(interleaved.length, failedSources, hasRealResults);
  renderResults();
}

qInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runSearch(qInput.value), 350);
});

resultControls.addEventListener("click", (e) => {
  const sortBtn = e.target.closest("[data-sort]");
  if (sortBtn) {
    currentSort = sortBtn.dataset.sort;
    renderResults();
    return;
  }

  const formatBtn = e.target.closest("[data-format]");
  if (formatBtn) {
    currentFormat = formatBtn.dataset.format;
    renderResults();
  }
});

sourcesNav.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  const source = btn.dataset.source;
  const allSourceKeys = Object.keys(SOURCE_LABELS);
  const allSelected = allSourceKeys.every((key) => activeSources.has(key));

  if (source === "all") {
    activeSources = allSelected ? new Set() : new Set(allSourceKeys);
  } else {
    if (activeSources.has(source)) {
      activeSources.delete(source);
    } else {
      activeSources.add(source);
    }
    if (activeSources.size === 0) {
      activeSources = new Set(allSourceKeys);
    }
  }

  const allActive = allSourceKeys.every((key) => activeSources.has(key));
  sourcesNav.querySelectorAll(".chip").forEach((chip) => {
    if (chip.dataset.source === "all") {
      chip.classList.toggle("active", allActive);
    } else {
      chip.classList.toggle("active", activeSources.has(chip.dataset.source));
    }
  });

  if (qInput.value.trim()) {
    runSearch(qInput.value);
  } else {
    renderResults();
  }
});
