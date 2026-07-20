(function initResultMetadata(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ScraaaperMetadata = api;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const LANGUAGE_CODES = [
    "und", "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
    "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br", "bs", "ca", "ce", "ch",
    "co", "cr", "cs", "cu", "cv", "cy", "da", "de", "dv", "dz", "ee", "el", "en",
    "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr", "fy", "ga", "gd",
    "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr", "ht", "hu", "hy", "hz",
    "ia", "id", "ie", "ig", "ii", "ik", "is", "it", "iu", "ja", "jv", "ka", "kg",
    "ki", "kj", "kk", "kl", "km", "kn", "ko", "kr", "ks", "ku", "kv", "kw", "ky",
    "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv", "mg", "mh", "mi", "mk",
    "ml", "mn", "mr", "ms", "mt", "my", "na", "nb", "nd", "ne", "ng", "nl", "nn",
    "no", "nr", "nv", "ny", "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps",
    "pt", "qu", "rm", "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se", "sg", "si",
    "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "ta",
    "te", "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty",
    "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi", "yo", "za",
    "zh", "zu",
  ];

  const THREE_TO_TWO = {
    ara: "ar", ben: "bn", bul: "bg", cat: "ca", chi: "zh", zho: "zh", cze: "cs", ces: "cs",
    dan: "da", dut: "nl", nld: "nl", eng: "en", fin: "fi", fre: "fr", fra: "fr", ger: "de",
    deu: "de", gre: "el", ell: "el", heb: "he", hin: "hi", hun: "hu", ice: "is", isl: "is",
    ind: "id", ita: "it", jpn: "ja", kor: "ko", lat: "la", nor: "no", per: "fa", fas: "fa",
    pol: "pl", por: "pt", rum: "ro", ron: "ro", rus: "ru", spa: "es", swe: "sv", tur: "tr",
    ukr: "uk", vie: "vi",
  };

  function normalizeDoi(value) {
    let candidate = String(value || "").trim();
    if (!candidate) return "";
    try { candidate = decodeURIComponent(candidate); } catch { /* keep the original input */ }
    candidate = candidate
      .replace(/^doi\s*:\s*/i, "")
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
      .trim()
      .replace(/[\s\u00a0]+/g, "")
      .replace(/[.,;:]$/, "");
    return /^10\.\d{4,9}\/[\w.()/:;+-]+$/i.test(candidate) ? candidate.toLowerCase() : "";
  }

  function normalizeLanguageCode(value) {
    const raw = String(value || "").trim().toLowerCase().replace(/_/g, "-");
    if (!raw) return "";
    const base = raw.split("-", 1)[0];
    if (THREE_TO_TWO[base]) return THREE_TO_TWO[base];
    if (/^[a-z]{2}$/.test(base)) return base;
    return "";
  }

  function itemLanguages(item) {
    const raw = item?.languages ?? item?.language ?? item?.lang ?? [];
    const values = Array.isArray(raw) ? raw : String(raw || "").split(/[,;]/);
    const normalized = [...new Set(values.map(normalizeLanguageCode).filter(Boolean))];
    return normalized.length ? normalized : ["und"];
  }

  function availableLanguageCodes(items) {
    return new Set((items || []).flatMap(itemLanguages));
  }

  function matchesLanguages(item, selected) {
    if (!selected || selected.size === 0) return true;
    return itemLanguages(item).some((code) => selected.has(code));
  }

  function languageName(code, locale, unknownLabel) {
    if (code === "und") return unknownLabel;
    try {
      return new Intl.DisplayNames([locale], { type: "language" }).of(code) || code.toUpperCase();
    } catch {
      return code.toUpperCase();
    }
  }

  function languageOptions(items, locale, unknownLabel) {
    const available = availableLanguageCodes(items);
    const observedExtras = [...available].filter((code) => !LANGUAGE_CODES.includes(code));
    return [...LANGUAGE_CODES, ...observedExtras]
      .map((code) => ({ code, name: languageName(code, locale, unknownLabel), available: available.has(code) }))
      .sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (a.code === "und") return -1;
        if (b.code === "und") return 1;
        return a.name.localeCompare(b.name, locale, { sensitivity: "base" });
      });
  }

  return {
    LANGUAGE_CODES,
    normalizeDoi,
    normalizeLanguageCode,
    itemLanguages,
    availableLanguageCodes,
    matchesLanguages,
    languageOptions,
  };
}));
