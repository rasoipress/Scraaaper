"use strict";

const JSTOR_HOME_URL = "https://www.jstor.org/";
const JSTOR_INSTITUTION_URL = "https://www.jstor.org/institutionSearch";

function isJstorUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:"
      && (hostname === "jstor.org" || hostname.endsWith(".jstor.org"));
  } catch {
    return false;
  }
}

function jstorSearchUrl(query) {
  const url = new URL("https://www.jstor.org/action/doBasicSearch");
  url.searchParams.set("Query", String(query || "").trim().slice(0, 300));
  return url.toString();
}

function accessStateFromPageText(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (/Access provided by\b/i.test(text)) {
    return { institutionalAccess: true, conclusive: true };
  }
  if (/Have library access\?/i.test(text) || /Log in through your institution/i.test(text)) {
    return { institutionalAccess: false, conclusive: true };
  }
  return { institutionalAccess: false, conclusive: false };
}

function accessUpdateFromPageText(value, { allowDisconnected = false } = {}) {
  const state = accessStateFromPageText(value);
  if (state.institutionalAccess) return true;
  if (state.conclusive && allowDisconnected) return false;
  return null;
}

const DISCIPLINE_TERMS = {
  architecture: ["architecture", "architectural", "built environment"],
  anthropology: ["anthropology", "anthropological", "ethnography"],
  archaeology: ["archaeology", "archaeological"],
  art: ["art history", "visual culture", "museum"],
  design: ["design"],
  philosophy: ["philosophy", "philosophical"],
  geography: ["geography", "geographical", "landscape"],
  literature: ["literature", "literary", "poetry"],
  history: ["history", "historical"],
  sociology: ["sociology", "sociological"],
  urban: ["urban", "cities", "city planning"],
};

function clean(value, limit = 300) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function parseJstorResultText(title, value) {
  const normalizedTitle = clean(title, 240);
  const ignoredTypes = /^(?:journal article|book chapter|book|research report|review|miscellaneous)$/i;
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => clean(line, 500))
    .filter((line) => line && !ignoredTypes.test(line) && line !== normalizedTitle);
  const publicationIndex = lines.findIndex((line) => (
    /\b(?:Vol|No|pp?|Issue|Journal)\.?(?:\s|$)/i.test(line)
    || /\((?:18|19|20)\d{2}\)/.test(line)
  ));
  const authorLines = (publicationIndex > 0 ? lines.slice(0, publicationIndex) : lines.slice(0, 1))
    .filter((line) => !/^https?:/i.test(line) && !/\b(?:download|view|preview|access)\b/i.test(line));
  return {
    author: clean(authorLines.join(", "), 180),
    publication: publicationIndex >= 0 ? clean(lines[publicationIndex], 240) : "",
  };
}

function normalizeJstorSearchRecords(records) {
  const results = [];
  const seen = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    const title = clean(record?.title, 240);
    let link;
    try {
      const parsed = new URL(record?.link || "", JSTOR_HOME_URL);
      if (!isJstorUrl(parsed.toString()) || !/\/stable\//.test(parsed.pathname)) continue;
      parsed.search = "";
      parsed.hash = "";
      link = parsed.toString();
    } catch {
      continue;
    }
    if (!title || seen.has(link)) continue;
    seen.add(link);
    const parsedText = parseJstorResultText(title, record?.context);
    const context = clean(record?.context, 2000);
    const year = context.match(/(?:^|\D)((?:18|19|20)\d{2})(?:\D|$)/)?.[1] || "";
    const doi = context.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i)?.[0]?.replace(/[.,;:]$/, "") || "";
    const author = (
      context.match(/\b(?:Author|Authors|By)\s*:?\s*([^\n|·]{2,180})/i)?.[1]
      || clean(record?.author, 180)
      || parsedText.author
    );
    const haystack = `${title} ${context}`.toLowerCase();
    const disciplines = Object.entries(DISCIPLINE_TERMS)
      .filter(([, terms]) => terms.some((term) => haystack.includes(term)))
      .map(([discipline]) => discipline);
    results.push({
      source: "jstor",
      title,
      author: clean(author, 180),
      year,
      cover: null,
      link,
      fileType: null,
      languages: [],
      doi: doi || null,
      disciplines,
      publication: clean(record?.publication, 180) || parsedText.publication,
      searchMode: "authenticated",
    });
    if (results.length >= 24) break;
  }
  return results;
}

module.exports = {
  JSTOR_HOME_URL,
  JSTOR_INSTITUTION_URL,
  accessStateFromPageText,
  accessUpdateFromPageText,
  isJstorUrl,
  jstorSearchUrl,
  normalizeJstorSearchRecords,
  parseJstorResultText,
};
