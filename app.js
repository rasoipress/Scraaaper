const RESULTS_PER_SOURCE = 24;
const SOURCE_TIMEOUT_MS = 30_000;
const SOURCE_SLOW_MS = 8_000;

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
      expired: "La sessione JSTOR è scaduta. Ricollega l’università per continuare.",
      connect: "Collega università",
      reconnect: "Ricollega",
      verify: "Verifica accesso",
      disconnect: "Disconnetti",
      search: "Cerca su JSTOR",
      error: "JSTOR non ha completato la richiesta.",
      stateConnected: "Collegato",
      stateDisconnected: "Non collegato",
      stateChecking: "Verifica in corso",
      stateExpired: "Sessione scaduta",
      stateError: "Errore",
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
      disciplines: "Discipline",
      allDisciplines: "Tutte",
      selectedDisciplines: (count) => `${count} selezionate`,
      date: "Data",
      dateFrom: "Da",
      dateTo: "A",
      clear: "Azzera",
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
      expired: "The JSTOR session has expired. Reconnect your institution to continue.",
      connect: "Connect university",
      reconnect: "Reconnect",
      verify: "Verify access",
      disconnect: "Disconnect",
      search: "Search JSTOR",
      error: "JSTOR could not complete the request.",
      stateConnected: "Connected",
      stateDisconnected: "Not connected",
      stateChecking: "Checking",
      stateExpired: "Session expired",
      stateError: "Error",
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
      disciplines: "Disciplines",
      allDisciplines: "All",
      selectedDisciplines: (count) => `${count} selected`,
      date: "Date",
      dateFrom: "From",
      dateTo: "To",
      clear: "Clear",
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

const SOURCE_LABELS = window.ScraaaperSources.LABELS;
const SOURCE_GROUPS = window.ScraaaperSources.GROUPS;
const NAV_SOURCE_KEYS = window.ScraaaperSources.SOURCE_KEYS;

const DISCIPLINES = [
  { key: "architecture", labels: { it: "Architettura", en: "Architecture" }, terms: ["architect", "urbanism", "built environment"] },
  { key: "anthropology", labels: { it: "Antropologia", en: "Anthropology" }, terms: ["anthropolog", "ethnograph"] },
  { key: "archaeology", labels: { it: "Archeologia", en: "Archaeology" }, terms: ["archaeolog"] },
  { key: "art", labels: { it: "Arte", en: "Art" }, terms: ["art ", "visual culture", "museum"] },
  { key: "design", labels: { it: "Design", en: "Design" }, terms: ["design"] },
  { key: "philosophy", labels: { it: "Filosofia", en: "Philosophy" }, terms: ["philosoph"] },
  { key: "geography", labels: { it: "Geografia", en: "Geography" }, terms: ["geograph", "landscape"] },
  { key: "literature", labels: { it: "Letteratura", en: "Literature" }, terms: ["literat", "poetry", "fiction"] },
  { key: "history", labels: { it: "Storia", en: "History" }, terms: ["history", "historical"] },
  { key: "sociology", labels: { it: "Sociologia", en: "Sociology" }, terms: ["sociolog"] },
  { key: "urban", labels: { it: "Studi urbani", en: "Urban studies" }, terms: ["urban", "city", "cities"] },
];

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

FETCHERS.jstor = async (query, signal) => {
  const bridge = window.scraaaperDesktop?.jstor;
  if (!bridge || !jstorInstitutionalAccess) {
    const error = new Error("JSTOR_AUTH_REQUIRED");
    error.code = "JSTOR_AUTH_REQUIRED";
    throw error;
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const result = await bridge.searchResults(query);
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return Array.isArray(result) ? result.slice(0, RESULTS_PER_SOURCE) : [];
};

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
const jstorDisconnect = document.getElementById("jstorDisconnect");
const jstorSearch = document.getElementById("jstorSearch");

let activeSources = new Set(window.ScraaaperSources.DEFAULT_ACTIVE);
let currentController = null;
let debounceTimer = null;
let lastResults = [];
let lastFailedSources = [];
let currentSort = "relevance";
let currentFormat = "all";
let selectedLanguages = new Set();
let selectedDisciplines = new Set();
let dateFrom = "";
let dateTo = "";
let lastExecutedQuery = "";
let currentLang = localStorage.getItem("reading-lang") || "it";
let searchInProgress = false;
let jstorInstitutionalAccess = false;
let jstorChecking = false;
let jstorConnectionState = "disconnected";
const sourceStatuses = new Map(NAV_SOURCE_KEYS.map((key) => [key, "idle"]));
const collapsedGroups = new Set();
const landing = document.getElementById("landing");
const landingWord = document.getElementById("landingWord");

function sourceStatusText(state) {
  if (state !== "requires-access") return "";
  return currentLang === "en" ? "Requires access" : "Richiede accesso";
}

function setSourceStatus(source, state) {
  sourceStatuses.set(source, state);
  const sourceNode = sourcesNav.querySelector(`[data-source="${source}"]`);
  const statusNode = sourcesNav.querySelector(`[data-source-status="${source}"]`);
  if (sourceNode) {
    sourceNode.dataset.sourceState = state;
    sourceNode.setAttribute("aria-label", `${SOURCE_LABELS[source]}${sourceStatusText(state) ? ` — ${sourceStatusText(state)}` : ""}`);
  }
  if (!statusNode) return;
  statusNode.dataset.state = state;
  statusNode.textContent = sourceStatusText(state);
  statusNode.hidden = state !== "requires-access";
}

function renderSourceGroups() {
  const collapseLabel = currentLang === "en" ? "Collapse all" : "Comprimi tutto";
  sourcesNav.innerHTML = `
    <div class="sources-toolbar">
      <span>${currentLang === "en" ? "Search sources" : "Fonti di ricerca"}</span>
      <button class="sources-collapse-all" data-collapse-all type="button">${collapseLabel}</button>
    </div>
    ${SOURCE_GROUPS.map((group) => {
      const selected = group.sources.filter((source) => activeSources.has(source)).length;
      const collapsed = collapsedGroups.has(group.id);
      const allSelected = selected === group.sources.length;
      return `
        <section class="source-group ${collapsed ? "collapsed" : ""}" data-source-group="${group.id}">
          <div class="source-group-header">
            <button class="source-group-toggle" data-toggle-group="${group.id}" type="button" aria-expanded="${!collapsed}">
              <span class="source-chevron" aria-hidden="true">⌄</span>
              <strong>${escapeHtml(group.labels[currentLang])}</strong>
              <span class="source-count">${selected}/${group.sources.length}</span>
            </button>
            <button class="source-group-select" data-select-group="${group.id}" type="button">
              ${allSelected ? (currentLang === "en" ? "Clear" : "Azzera") : (currentLang === "en" ? "Select all" : "Seleziona tutte")}
            </button>
          </div>
          <div class="source-group-body" ${collapsed ? "hidden" : ""}>
            ${group.sources.map((source) => {
              let state = sourceStatuses.get(source) || "idle";
              if (source === "jstor" && !jstorInstitutionalAccess) state = "requires-access";
              return `
                <button class="chip ${activeSources.has(source) ? "active" : ""}" data-source="${source}" data-source-state="${state}" type="button" aria-pressed="${activeSources.has(source)}" aria-label="${escapeHtml(`${SOURCE_LABELS[source]}${sourceStatusText(state) ? ` — ${sourceStatusText(state)}` : ""}`)}">
                  <span>${escapeHtml(SOURCE_LABELS[source])}</span>
                  <small class="source-state" data-source-status="${source}" data-state="${state}" ${state === "requires-access" ? "" : "hidden"}>${escapeHtml(sourceStatusText(state))}</small>
                </button>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }).join("")}
  `;
}

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
  renderSourceGroups();
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
  const state = jstorChecking ? "checking" : jstorConnectionState;
  jstorTitle.textContent = text.title;
  jstorMessage.textContent = messageOverride || (
    jstorChecking ? text.checking
      : state === "expired" ? text.expired
        : state === "error" ? text.error
          : jstorInstitutionalAccess ? text.connected : text.disconnected
  );
  jstorState.dataset.state = state;
  jstorState.textContent = state === "checking"
    ? text.stateChecking
    : state === "connected" ? text.stateConnected
      : state === "expired" ? text.stateExpired
        : state === "error" ? text.stateError : text.stateDisconnected;
  jstorConnect.textContent = jstorInstitutionalAccess ? text.reconnect : text.connect;
  jstorVerify.textContent = text.verify;
  jstorDisconnect.textContent = text.disconnect;
  jstorDisconnect.hidden = !jstorInstitutionalAccess && state !== "expired";
  jstorSearch.textContent = text.search;
  jstorSearch.disabled = !qInput.value.trim() || !jstorInstitutionalAccess;
  setSourceStatus("jstor", jstorInstitutionalAccess ? "available" : "requires-access");
}

function applyJstorStatus(nextStatus) {
  jstorInstitutionalAccess = nextStatus?.institutionalAccess === true;
  jstorChecking = nextStatus?.checking === true;
  jstorConnectionState = nextStatus?.state
    || (jstorChecking ? "checking" : jstorInstitutionalAccess ? "connected" : "disconnected");
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
    jstorConnectionState = "error";
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
  const letters = [..."scraaaper"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let position = 0;
  landingWord.textContent = "";
  landingWord.classList.add("typing");

  const finish = () => {
    landingWord.classList.remove("typing");
    landingWord.classList.add("caret-blink");
    setTimeout(() => {
      landingWord.classList.remove("caret-blink");
      landingWord.classList.add("caret-visible");
    }, reducedMotion ? 180 : 1_350);
    setTimeout(() => {
      landingWord.classList.remove("caret-visible");
      landingWord.classList.add("caret-hidden");
      document.body.classList.add("ready");
      document.documentElement.classList.add("ready");
      landing.classList.add("hidden");
    }, reducedMotion ? 260 : 1_520);
  };

  const typeNext = () => {
    if (position >= letters.length) {
      finish();
      return;
    }
    const letter = letters[position];
    landingWord.textContent += letter;
    position += 1;
    const delay = reducedMotion ? 18 : letter === "a" ? 310 : 120;
    setTimeout(typeNext, delay);
  };

  setTimeout(() => {
    try {
      typeNext();
    } catch {
      document.body.classList.add("ready");
      document.documentElement.classList.add("ready");
      landing.classList.add("hidden");
    }
  }, reducedMotion ? 20 : 160);
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

function itemDisciplines(item) {
  const values = Array.isArray(item?.disciplines) ? item.disciplines : [];
  return [...new Set(values.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))];
}

function matchesDateRange(item) {
  if (!dateFrom && !dateTo) return true;
  const match = String(item?.year || "").match(/(?:18|19|20)\d{2}/);
  if (!match) return false;
  const year = Number(match[0]);
  if (dateFrom && year < Number(dateFrom)) return false;
  if (dateTo && year > Number(dateTo)) return false;
  return true;
}

function getVisibleResults() {
  const filteredBySource = lastResults.filter((r) => r.source === "doi" || activeSources.has(r.source));
  const genuine = filteredBySource.filter(isGenuineResult);
  const withFormats = applyFormatMetadata(genuine);
  const filteredByFormat = currentFormat === "all"
    ? withFormats
    : withFormats.filter((r) => inferFormat(r) === currentFormat);
  const filteredByLanguage = filteredByFormat.filter((r) => window.ScraaaperMetadata.matchesLanguages(r, selectedLanguages));
  const filteredByDiscipline = selectedDisciplines.size === 0
    ? filteredByLanguage
    : filteredByLanguage.filter((item) => itemDisciplines(item).some((discipline) => selectedDisciplines.has(discipline)));
  const filteredByDate = filteredByDiscipline.filter(matchesDateRange);
  return sortResults(filteredByDate);
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
  const disciplineMenuWasOpen = resultControls.querySelector(".discipline-filter")?.open === true;
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
  const disciplineCounts = new Map();
  filterableResults.forEach((item) => {
    itemDisciplines(item).forEach((discipline) => {
      disciplineCounts.set(discipline, (disciplineCounts.get(discipline) || 0) + 1);
    });
  });
  if (!searchInProgress) {
    selectedDisciplines = new Set(
      [...selectedDisciplines].filter((discipline) => disciplineCounts.has(discipline))
    );
  }
  const disciplineLabel = selectedDisciplines.size === 0
    ? UI_TEXT[currentLang].controls.allDisciplines
    : UI_TEXT[currentLang].controls.selectedDisciplines(selectedDisciplines.size);
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
    <div class="control-section control-section-separated">
      <span class="control-label">${escapeHtml(UI_TEXT[currentLang].controls.disciplines)}</span>
      <details class="language-filter discipline-filter" ${disciplineMenuWasOpen ? "open" : ""}>
        <summary class="control-btn language-summary" ${activeSources.has("jstor") ? "" : "aria-disabled=\"true\""}>
          <span>${escapeHtml(disciplineLabel)}</span><span class="language-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="language-menu" role="group" aria-label="${escapeHtml(UI_TEXT[currentLang].controls.disciplines)}">
          <button class="language-clear ${selectedDisciplines.size === 0 ? "active" : ""}" data-clear-disciplines type="button">
            ${escapeHtml(UI_TEXT[currentLang].controls.allDisciplines)}
          </button>
          <div class="language-options">
            ${DISCIPLINES.map((discipline) => {
              const available = disciplineCounts.has(discipline.key);
              return `
                <label class="language-option ${available ? "" : "unavailable"}">
                  <input type="checkbox" data-discipline="${discipline.key}" ${selectedDisciplines.has(discipline.key) ? "checked" : ""} ${available ? "" : "disabled"} />
                  <span>${escapeHtml(discipline.labels[currentLang])}</span>
                  <small>${available ? disciplineCounts.get(discipline.key) : "—"}</small>
                </label>
              `;
            }).join("")}
          </div>
        </div>
      </details>
    </div>
    <div class="control-section control-section-separated date-filter">
      <span class="control-label">${escapeHtml(UI_TEXT[currentLang].controls.date)}</span>
      <label>
        <span>${escapeHtml(UI_TEXT[currentLang].controls.dateFrom)}</span>
        <input data-date-from type="number" min="1000" max="2100" inputmode="numeric" value="${escapeHtml(dateFrom)}" />
      </label>
      <label>
        <span>${escapeHtml(UI_TEXT[currentLang].controls.dateTo)}</span>
        <input data-date-to type="number" min="1000" max="2100" inputmode="numeric" value="${escapeHtml(dateTo)}" />
      </label>
      <button class="control-btn" data-clear-date type="button" ${dateFrom || dateTo ? "" : "disabled"}>${escapeHtml(UI_TEXT[currentLang].controls.clear)}</button>
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
    selectedDisciplines = new Set();
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
    let slowTimer = null;
    try {
      if (key !== "doi") {
        setSourceStatus(key, key === "jstor" && !jstorInstitutionalAccess ? "requires-access" : "searching");
        slowTimer = setTimeout(() => setSourceStatus(key, "slow"), SOURCE_SLOW_MS);
      }
      resultsBySource[key] = await FETCHERS[key](query, signal);
      if (key !== "doi") setSourceStatus(key, "available");
    } catch (error) {
      if (signal.aborted) return;
      if (error?.code === "JSTOR_AUTH_REQUIRED") {
        setSourceStatus(key, "requires-access");
      } else {
        failedSources.push(SOURCE_LABELS[key]);
        if (key !== "doi") setSourceStatus(key, "unavailable");
      }
      if (error?.code === "BACKEND_UNAVAILABLE") backendUnavailable = true;
    } finally {
      clearTimeout(slowTimer);
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

jstorDisconnect.addEventListener("click", async () => {
  const bridge = window.scraaaperDesktop?.jstor;
  if (!bridge) return;
  jstorDisconnect.disabled = true;
  try {
    applyJstorStatus(await bridge.disconnect());
    updateJstorPanel();
    if (qInput.value.trim()) runSearch(qInput.value);
  } catch {
    jstorConnectionState = "error";
    updateJstorPanel(UI_TEXT[currentLang].jstor.error);
  } finally {
    jstorDisconnect.disabled = false;
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

  const clearDisciplines = e.target.closest("[data-clear-disciplines]");
  if (clearDisciplines) {
    selectedDisciplines = new Set();
    renderResults();
    resultControls.querySelector(".discipline-filter")?.setAttribute("open", "");
    return;
  }

  const clearDate = e.target.closest("[data-clear-date]");
  if (clearDate) {
    dateFrom = "";
    dateTo = "";
    renderResults();
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
  if (languageInput && !languageInput.disabled) {
    if (languageInput.checked) {
      selectedLanguages.add(languageInput.dataset.language);
    } else {
      selectedLanguages.delete(languageInput.dataset.language);
    }
    renderResults();
    resultControls.querySelector(".language-filter")?.setAttribute("open", "");
    return;
  }

  const disciplineInput = e.target.closest("[data-discipline]");
  if (disciplineInput && !disciplineInput.disabled) {
    if (disciplineInput.checked) {
      selectedDisciplines.add(disciplineInput.dataset.discipline);
    } else {
      selectedDisciplines.delete(disciplineInput.dataset.discipline);
    }
    renderResults();
    resultControls.querySelector(".discipline-filter")?.setAttribute("open", "");
    return;
  }

  const dateInput = e.target.closest("[data-date-from], [data-date-to]");
  if (!dateInput) return;
  const normalized = /^\d{4}$/.test(dateInput.value) ? dateInput.value : "";
  if (dateInput.matches("[data-date-from]")) dateFrom = normalized;
  if (dateInput.matches("[data-date-to]")) dateTo = normalized;
  if (dateFrom && dateTo && Number(dateFrom) > Number(dateTo)) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }
  renderResults();
});

sourcesNav.addEventListener("click", (e) => {
  const collapseAll = e.target.closest("[data-collapse-all]");
  if (collapseAll) {
    const allCollapsed = SOURCE_GROUPS.every((group) => collapsedGroups.has(group.id));
    collapsedGroups.clear();
    if (!allCollapsed) SOURCE_GROUPS.forEach((group) => collapsedGroups.add(group.id));
    renderSourceGroups();
    return;
  }

  const toggleGroup = e.target.closest("[data-toggle-group]");
  if (toggleGroup) {
    const groupId = toggleGroup.dataset.toggleGroup;
    if (collapsedGroups.has(groupId)) collapsedGroups.delete(groupId);
    else collapsedGroups.add(groupId);
    renderSourceGroups();
    return;
  }

  const selectGroup = e.target.closest("[data-select-group]");
  if (selectGroup) {
    const group = SOURCE_GROUPS.find((candidate) => candidate.id === selectGroup.dataset.selectGroup);
    if (!group) return;
    const allSelected = group.sources.every((source) => activeSources.has(source));
    group.sources.forEach((source) => {
      if (allSelected) {
        activeSources.delete(source);
        sourceStatuses.set(source, source === "jstor" && !jstorInstitutionalAccess ? "requires-access" : "idle");
      } else {
        activeSources.add(source);
      }
    });
    renderSourceGroups();
    updateJstorPanel();
    if (qInput.value.trim()) runSearch(qInput.value);
    return;
  }

  const btn = e.target.closest(".chip");
  if (!btn) return;
  const source = btn.dataset.source;
  if (activeSources.has(source)) {
    activeSources.delete(source);
    sourceStatuses.set(source, source === "jstor" && !jstorInstitutionalAccess ? "requires-access" : "idle");
  } else {
    activeSources.add(source);
  }
  renderSourceGroups();

  if (qInput.value.trim()) {
    runSearch(qInput.value);
  } else {
    renderResults();
  }
  updateJstorPanel();
});

initializeJstorIntegration();
