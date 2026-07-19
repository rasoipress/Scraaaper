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

module.exports = {
  JSTOR_HOME_URL,
  JSTOR_INSTITUTION_URL,
  accessStateFromPageText,
  isJstorUrl,
  jstorSearchUrl,
};
