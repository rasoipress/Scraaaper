const RESULTS_PER_SOURCE = 24;
const SOURCE_TIMEOUT_MS = 30_000;

const UI_TEXT = {
  it: {
    placeholder: "Cerca titolo, autore o DOI…",
    searching: "Ricerca in corso…",
    empty: "Nessun risultato.",
    backendOffline: "Il motore di ricerca non risponde. Chiudi e riapri Scraaaper.",
    indexed: "indice web",
    progress: (completed, total, count) => `${completed}/${total} fonti completate · ${count} risultati`,
    footer: "/ scraaaper è un motore di ricerca gratuito e open source per la ricerca di libri da fonti pubbliche, archivi e librerie online",
    jstor: {
      title: "JSTOR per studenti",
      disconnected: "Collega università o biblioteca per accedere ai contenuti disponibili.",
      connected: "Accesso universitario rilevato. La sessione resta soltanto su questo computer.",
      checking: "Completa l’accesso nella finestra JSTOR: Scraaaper verificherà automaticamente la sessione.",
      connect: "Collega università",
      manage: "Verifica o cambia",
      verify: "Verifica accesso",
      search: "Cerca su JSTOR",
      error: "Non è stato possibile aprire JSTOR.",
      stateConnected: "Collegato",
      stateDisconnected: "Non collegato",
      stateChecking: "Verifica in corso",
    },
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
    controls: {
      sort: "Ordina",
      format: "Formato",
      languages: "Lingue",
      allLanguages: "Tutte",
      selectedLanguages: (count) => `${count} selezionate`,
      unknownLanguage: "Lingua non indicata",
    },
    metadata: {
      unknownAuthor: "Autore non indicato",
      unknownYear: "Anno n.d.",
      unknownFormat: "Formato n.d.",
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
      fb2: "FB2",
      docx: "DOCX",
      chm: "CHM",
      rar: "RAR",
    },
  },
  en: {
    placeholder: "Search title, author or DOI…",
    searching: "Searching…",
    empty: "No results.",
    backendOffline: "The search engine is not responding. Quit and reopen Scraaaper.",
    indexed: "web index",
    progress: (completed, total, count) => `${completed}/${total} sources completed · ${count} results`,
    footer: "/ scraaaper is a free and open-source search engine for finding books from public sources, archives, and online libraries",
    jstor: {
      title: "JSTOR for students",
      disconnected: "Connect your university or library to access available content.",
      connected: "Institutional access detected. The session stays only on this computer.",
      checking: "Complete sign-in in the JSTOR window: Scraaaper will verify the session automatically.",
      connect: "Connect university",
      manage: "Verify or change",
      verify: "Verify access",
      search: "Search JSTOR",
      error: "JSTOR could not be opened.",
      stateConnected: "Connected",
      stateDisconnected: "Not connected",
      stateChecking: "Checking",
    },
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
    controls: {
      sort: "Sort",
      format: "Format",
      languages: "Languages",
      allLanguages: "All",
      selectedLanguages: (count) => `${count} selected`,
      unknownLanguage: "Language not specified",
    },
    metadata: {
      unknownAuthor: "Author not specified",
      unknownYear: "Year n/a",
      unknownFormat: "Format n/a",
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
      fb2: "FB2",
      docx: "DOCX",
      chm: "CHM",
      rar: "RAR",
    },
  },
};

const SOURCE_LABELS = {
  doi: "DOI",
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

const NAV_SOURCE_KEYS = Object.keys(SOURCE_LABELS).filter((key) => key !== "doi");

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
const searchSpinner = document.getElementById("searchSpinner");
const jstorAccess = document.getElementById("jstorAccess");
const jstorTitle = document.getElementById("jstorTitle");
const jstorState = document.getElementById("jstorState");
const jstorMessage = document.getElementById("jstorMessage");
const jstorConnect = document.getElementById("jstorConnect");
const jstorVerify = document.getElementById("jstorVerify");
const jstorSearch = document.getElementById("jstorSearch");

let activeSources = new Set(NAV_SOURCE_KEYS);
let currentController = null;
let debounceTimer = null;
let lastResults = [];
let lastFailedSources = [];
let currentSort = "relevance";
let currentFormat = "all";
let selectedLanguages = new Set();
let lastExecutedQuery = "";
let currentLang = localStorage.getItem("reading-lang") || "it";
let searchInProgress = false;
let jstorInstitutionalAccess = false;
let jstorChecking = false;
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
  langToggle.textContent = lang === "en" ? "ITA" : "ENG";
  langToggle.setAttribute(
    "aria-label",
    lang === "en" ? "Passa all’italiano" : "Switch to English"
  );
  footerText.textContent = UI_TEXT[lang].footer;
  sourcesNav.querySelectorAll(".chip").forEach((chip) => {
    const source = chip.dataset.source;
    if (source === "all") {
      chip.textContent = lang === "en" ? "All" : "Tutte";
    }
  });
  updateJstorPanel();
  if (qInput.value.trim()) {
    runSearch(qInput.value);
  } else {
    status.textContent = "";
  }
}

function setSearchInProgress(active) {
  searchInProgress = active;
  searchSpinner.hidden = !active;
  document.querySelector("main").setAttribute("aria-busy", String(active));
}

function updateJstorPanel(messageOverride = "") {
  const bridge = window.scraaaperDesktop?.jstor;
  const shouldShow = Boolean(bridge && activeSources.has("jstor"));
  jstorAccess.hidden = !shouldShow;
  if (!shouldShow) return;
  const text = UI_TEXT[currentLang].jstor;
  const state = jstorChecking
    ? "checking"
    : jstorInstitutionalAccess ? "connected" : "disconnected";
  jstorTitle.textContent = text.title;
  jstorMessage.textContent = messageOverride || (
    jstorChecking ? text.checking
      : jstorInstitutionalAccess ? text.connected : text.disconnected
  );
  jstorState.dataset.state = state;
  jstorState.textContent = state === "checking"
    ? text.stateChecking
    : state === "connected" ? text.stateConnected : text.stateDisconnected;
  jstorConnect.textContent = jstorInstitutionalAccess ? text.manage : text.connect;
  jstorVerify.textContent = text.verify;
  jstorSearch.textContent = text.search;
  jstorSearch.disabled = !qInput.value.trim();
}

function applyJstorStatus(nextStatus) {
  jstorInstitutionalAccess = nextStatus?.institutionalAccess === true;
  jstorChecking = nextStatus?.checking === true;
}

async function initializeJstorIntegration() {
  const bridge = window.scraaaperDesktop?.jstor;
  if (!bridge) {
    jstorAccess.hidden = true;
    return;
  }
  try {
    const savedStatus = await bridge.status();
    applyJstorStatus(savedStatus);
  } catch {
    jstorInstitutionalAccess = false;
    jstorChecking = false;
  }
  bridge.onStatusChanged((nextStatus) => {
    applyJstorStatus(nextStatus);
    updateJstorPanel();
  });
  updateJstorPanel();
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

function buildResultLine(item, isShortcut) {
  if (isShortcut) return `<strong class="result-title">${escapeHtml(item.title || "Senza titolo")}</strong>`;
  const text = UI_TEXT[currentLang].metadata;
  const author = String(item.author || "").trim() || text.unknownAuthor;
  const compactAuthor = author.length > 72
    ? `${author.slice(0, 68).replace(/[,;]\s*[^,;]*$/, "").trim()}, et al.`
    : author;
  const year = String(item.year || "").trim() || text.unknownYear;
  const format = inferFormat(item);
  const formatLabel = format ? format.toUpperCase() : text.unknownFormat;
  return `
    <span class="result-author" title="${escapeHtml(author)}">${escapeHtml(compactAuthor)}</span>
    <span class="result-separator" aria-hidden="true">–</span>
    <strong class="result-title">${escapeHtml(item.title || "Senza titolo")}</strong>
    <span class="result-separator" aria-hidden="true">–</span>
    <span class="result-year">${escapeHtml(year)}</span>
    <span class="result-separator" aria-hidden="true">–</span>
    <span class="result-format">${escapeHtml(formatLabel)}</span>
  `;
}

function renderCard(item) {
  const isShortcut = !isGenuineResult(item);
  const modeSuffix = item.searchMode === "indexed" ? ` · ${UI_TEXT[currentLang].indexed}` : "";
  const coverHtml = item.cover
    ? `<img src="${escapeHtml(item.cover)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;placeholder&quot;>${escapeHtml(item.title)}</span>'" />`
    : `<span class="placeholder">${isShortcut ? "🔎" : escapeHtml(item.title)}</span>`;
  const resultLine = buildResultLine(item, isShortcut);

  return `
    <a class="card${isShortcut ? " card-shortcut" : ""}" data-source="${escapeHtml(item.source)}" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
      <div class="cover">
        <span class="source-tag">${escapeHtml(SOURCE_LABELS[item.source] || item.source)}${escapeHtml(modeSuffix)}</span>
        ${coverHtml}
      </div>
      <div class="result-line">${resultLine}</div>
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
  const filteredBySource = lastResults.filter((r) => r.source === "doi" || activeSources.has(r.source));
  const displayable = filteredBySource.filter(isDisplayableResult);
  const genuine = displayable.filter(isGenuineResult);
  const shortcuts = displayable.filter((r) => !isGenuineResult(r));
  const withFormats = applyFormatMetadata(genuine);
  const filteredByFormat = currentFormat === "all"
    ? withFormats
    : withFormats.filter((r) => inferFormat(r) === currentFormat);
  const filteredByLanguage = filteredByFormat.filter((r) => window.ScraaaperMetadata.matchesLanguages(r, selectedLanguages));
  // shortcut cards ("search on X") have no real file format, only show them in the "all" view
  const visibleShortcuts = currentFormat === "all" && selectedLanguages.size === 0 ? shortcuts : [];
  return sortResults([...filteredByLanguage, ...visibleShortcuts]);
}

function getFilterableResults() {
  return lastResults
    .filter((r) => r.source === "doi" || activeSources.has(r.source))
    .filter(isGenuineResult);
}

function renderResultControls() {
  const hasQuery = qInput.value.trim();
  if (!hasQuery) {
    resultControls.innerHTML = "";
    return;
  }

  const languageMenuWasOpen = resultControls.querySelector(".language-filter")?.open === true;
  const filterableResults = getFilterableResults();
  const availableFormats = new Set(filterableResults.map(inferFormat).filter(Boolean));
  const availableLanguages = window.ScraaaperMetadata.availableLanguageCodes(filterableResults);
  if (!searchInProgress) {
    selectedLanguages = new Set([...selectedLanguages].filter((code) => availableLanguages.has(code)));
  }
  const languageCounts = new Map();
  filterableResults.forEach((item) => {
    window.ScraaaperMetadata.itemLanguages(item).forEach((code) => {
      languageCounts.set(code, (languageCounts.get(code) || 0) + 1);
    });
  });
  const languageOptions = window.ScraaaperMetadata.languageOptions(
    filterableResults,
    currentLang,
    UI_TEXT[currentLang].controls.unknownLanguage
  );
  const selectedLabel = selectedLanguages.size === 0
    ? UI_TEXT[currentLang].controls.allLanguages
    : selectedLanguages.size === 1
      ? window.ScraaaperMetadata.languageName(
        [...selectedLanguages][0],
        currentLang,
        UI_TEXT[currentLang].controls.unknownLanguage
      )
      : UI_TEXT[currentLang].controls.selectedLanguages(selectedLanguages.size);

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
    { key: "fb2", label: UI_TEXT[currentLang].formats.fb2 },
    { key: "docx", label: UI_TEXT[currentLang].formats.docx },
    { key: "chm", label: UI_TEXT[currentLang].formats.chm },
    { key: "rar", label: UI_TEXT[currentLang].formats.rar },
  ];

  resultControls.innerHTML = `
    <div class="control-section">
      <span class="control-label">${escapeHtml(UI_TEXT[currentLang].controls.sort)}</span>
      <div class="control-group">
        ${sortButtons.map((opt) => `<button class="control-btn ${currentSort === opt.key ? "active" : ""}" data-sort="${opt.key}" type="button">${escapeHtml(opt.label)}</button>`).join("")}
      </div>
    </div>
    <div class="control-section control-section-separated">
      <span class="control-label">${escapeHtml(UI_TEXT[currentLang].controls.format)}</span>
      <div class="control-group">
        ${formatButtons.map((opt) => {
          const disabled = opt.key !== "all" && !availableFormats.has(opt.key);
          return `<button class="control-btn ${currentFormat === opt.key ? "active" : ""}" data-format="${opt.key}" type="button" ${disabled ? "disabled" : ""}>${escapeHtml(opt.label)}</button>`;
        }).join("")}
      </div>
    </div>
    <div class="control-section control-section-separated">
      <span class="control-label">${escapeHtml(UI_TEXT[currentLang].controls.languages)}</span>
      <details class="language-filter" ${languageMenuWasOpen ? "open" : ""}>
        <summary class="control-btn language-summary">
          <span>${escapeHtml(selectedLabel)}</span><span class="language-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="language-menu" role="group" aria-label="${escapeHtml(UI_TEXT[currentLang].controls.languages)}">
          <button class="language-clear ${selectedLanguages.size === 0 ? "active" : ""}" data-clear-languages type="button">
            ${escapeHtml(UI_TEXT[currentLang].controls.allLanguages)}
          </button>
          <div class="language-options">
            ${languageOptions.map((option) => `
              <label class="language-option ${option.available ? "" : "unavailable"}">
                <input type="checkbox" data-language="${escapeHtml(option.code)}" ${selectedLanguages.has(option.code) ? "checked" : ""} ${option.available ? "" : "disabled"} />
                <span>${escapeHtml(option.name)}</span>
                <small>${option.available ? languageCounts.get(option.code) || 0 : "—"}</small>
              </label>
            `).join("")}
          </div>
        </div>
      </details>
    </div>
  `;
}

function renderResults() {
  renderResultControls();
  const visible = getVisibleResults();
  if (visible.length === 0) {
    grid.innerHTML = "";
    if (qInput.value.trim() && !searchInProgress) {
      grid.innerHTML = `<p class="empty">${UI_TEXT[currentLang].empty}</p>`;
    }
    return;
  }
  grid.innerHTML = visible.map(renderCard).join("");
}

async function runSearch(query) {
  if (currentController) currentController.abort();
  const controller = new AbortController();
  currentController = controller;
  const { signal } = controller;

  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    lastExecutedQuery = "";
    lastResults = [];
    lastFailedSources = [];
    status.textContent = "";
    setSearchInProgress(false);
    updateJstorPanel();
    renderResults();
    return;
  }

  if (normalizedQuery !== lastExecutedQuery) {
    selectedLanguages = new Set();
    currentFormat = "all";
    lastExecutedQuery = normalizedQuery;
  }

  const isDoiSearch = Boolean(window.ScraaaperMetadata.normalizeDoi(normalizedQuery));
  const sourceKeys = [
    ...(isDoiSearch ? ["doi"] : []),
    ...NAV_SOURCE_KEYS.filter((key) => activeSources.has(key)),
  ];

  setSearchInProgress(true);
  status.textContent = UI_TEXT[currentLang].progress(0, sourceKeys.length, 0);
  renderResultControls();
  grid.innerHTML = "";
  updateJstorPanel();

  const resultsBySource = {};
  const failedSources = [];
  let backendUnavailable = false;
  let completed = 0;

  const refresh = () => {
    if (signal.aborted) return;
    const interleaved = window.ScraaaperSearch.interleaveResults(resultsBySource, sourceKeys);
    const hasRealResults = interleaved.some(isGenuineResult);
    lastResults = interleaved;
    lastFailedSources = [...failedSources];
    status.textContent = completed < sourceKeys.length
      ? UI_TEXT[currentLang].progress(completed, sourceKeys.length, interleaved.length)
      : backendUnavailable && failedSources.length === sourceKeys.length
        ? UI_TEXT[currentLang].backendOffline
        : UI_TEXT[currentLang].results(interleaved.length, failedSources, hasRealResults);
    renderResults();
  };

  if (sourceKeys.length === 0) {
    setSearchInProgress(false);
    status.textContent = UI_TEXT[currentLang].empty;
    renderResults();
    return;
  }

  refresh();
  await Promise.all(sourceKeys.map(async (key) => {
    try {
      resultsBySource[key] = await FETCHERS[key](query, signal);
    } catch (error) {
      if (signal.aborted) return;
      failedSources.push(SOURCE_LABELS[key]);
      if (error?.code === "BACKEND_UNAVAILABLE") backendUnavailable = true;
    } finally {
      if (!signal.aborted) {
        completed += 1;
        refresh();
      }
    }
  }));

  if (signal.aborted || currentController !== controller) return;
  setSearchInProgress(false);
  refresh();
}

qInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  updateJstorPanel();
  debounceTimer = setTimeout(() => runSearch(qInput.value), 350);
});

jstorConnect.addEventListener("click", async () => {
  const bridge = window.scraaaperDesktop?.jstor;
  if (!bridge) return;
  jstorConnect.disabled = true;
  try {
    applyJstorStatus(await bridge.connect());
    updateJstorPanel();
  } catch {
    updateJstorPanel(UI_TEXT[currentLang].jstor.error);
  } finally {
    jstorConnect.disabled = false;
  }
});

jstorVerify.addEventListener("click", async () => {
  const bridge = window.scraaaperDesktop?.jstor;
  if (!bridge) return;
  jstorVerify.disabled = true;
  try {
    applyJstorStatus(await bridge.verify());
    updateJstorPanel();
  } catch {
    updateJstorPanel(UI_TEXT[currentLang].jstor.error);
  } finally {
    jstorVerify.disabled = false;
  }
});

jstorSearch.addEventListener("click", async () => {
  const bridge = window.scraaaperDesktop?.jstor;
  if (!bridge || !qInput.value.trim()) return;
  try {
    await bridge.search(qInput.value.trim());
  } catch {
    updateJstorPanel(UI_TEXT[currentLang].jstor.error);
  }
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest("a.card[data-source='jstor']");
  const bridge = window.scraaaperDesktop?.jstor;
  if (!card || !bridge) return;
  event.preventDefault();
  bridge.open(card.href).catch(() => updateJstorPanel(UI_TEXT[currentLang].jstor.error));
});

resultControls.addEventListener("click", (e) => {
  const clearLanguages = e.target.closest("[data-clear-languages]");
  if (clearLanguages) {
    selectedLanguages = new Set();
    renderResults();
    resultControls.querySelector(".language-filter")?.setAttribute("open", "");
    return;
  }

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

resultControls.addEventListener("change", (e) => {
  const languageInput = e.target.closest("[data-language]");
  if (!languageInput || languageInput.disabled) return;
  if (languageInput.checked) {
    selectedLanguages.add(languageInput.dataset.language);
  } else {
    selectedLanguages.delete(languageInput.dataset.language);
  }
  renderResults();
  resultControls.querySelector(".language-filter")?.setAttribute("open", "");
});

sourcesNav.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  const source = btn.dataset.source;
  const allSourceKeys = NAV_SOURCE_KEYS;
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
  updateJstorPanel();
});

initializeJstorIntegration();
