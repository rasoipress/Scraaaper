(function exposeSourceCatalog(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ScraaaperSources = api;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const GROUPS = [
    {
      id: "open",
      labels: { it: "Accesso aperto", en: "Open access" },
      sources: [
        "archive", "freebannedbooks", "gutenberg", "inventaire", "openlibrary",
        "standardebooks", "wikisource", "wikibooks", "unglue", "pagebypage",
        "manybooks", "justfreebooks", "globalgrey", "literature", "dpla",
        "fadedpage", "ebookmecca", "planetebook", "loyalbooks", "planetpublish",
        "baen", "ebookzy", "bythefireplace", "digilibraries", "exclassics",
        "hplovecraft", "sherlock", "grimm", "andersen", "publicdomainreview",
        "monoskop",
      ],
    },
    {
      id: "external",
      labels: { it: "Fonti esterne", en: "External sources" },
      sources: [
        "annasarchive", "bdebooks", "bookracy", "booksee", "ebookoz", "liber3",
        "libgen", "mobilism", "scribd", "zlib",
      ],
    },
    {
      id: "academic",
      labels: { it: "Fonti accademiche", en: "Academic sources" },
      sources: ["jstor", "core", "researchgate", "academia"],
    },
    {
      id: "drive",
      labels: { it: "Drive pubblici", en: "Public drives" },
      sources: ["googledrive", "s3pdf"],
    },
  ];

  const LABELS = {
    doi: "DOI",
    annasarchive: "Anna's Archive",
    archive: "Internet Archive",
    bdebooks: "BDE Books",
    bookracy: "Bookracy",
    booksee: "Booksee",
    ebookoz: "Ebookoz",
    ebookzy: "Ebookzy",
    freebannedbooks: "FreeBannedBooks",
    gutenberg: "Project Gutenberg",
    inventaire: "Inventaire",
    jstor: "JSTOR",
    liber3: "Liber3",
    libgen: "LibGen",
    mobilism: "Mobilism",
    monoskop: "Monoskop",
    openlibrary: "Open Library",
    scribd: "Scribd",
    standardebooks: "Standard Ebooks",
    wikisource: "Wikisource",
    wikibooks: "Wikibooks",
    zlib: "Z-Library",
    unglue: "Unglue.it",
    pagebypage: "Page by Page Books",
    manybooks: "ManyBooks",
    justfreebooks: "JustFreeBooks",
    globalgrey: "Global Grey",
    literature: "Literature Network",
    dpla: "DPLA",
    fadedpage: "Faded Page",
    ebookmecca: "E-Book Mecca",
    planetebook: "Planet eBook",
    loyalbooks: "Loyal Books",
    planetpublish: "Planet Publish",
    baen: "Baen",
    bythefireplace: "By the Fireplace",
    digilibraries: "DigiLibraries",
    exclassics: "Ex-Classics",
    hplovecraft: "H. P. Lovecraft Archive",
    sherlock: "Sherlock Holmes Canon",
    grimm: "GrimmStories",
    andersen: "AndersenStories",
    publicdomainreview: "Public Domain Review",
    core: "CORE",
    researchgate: "ResearchGate",
    academia: "Academia",
    s3pdf: "AWS S3 PDF",
    googledrive: "Google Drive",
  };

  // Keep the first search quick and dependable. Optional, authenticated and
  // external sources are deliberately opt-in.
  const DEFAULT_ACTIVE = [
    "archive", "freebannedbooks", "gutenberg", "inventaire", "openlibrary",
    "standardebooks", "wikisource", "wikibooks",
  ];

  const SOURCE_KEYS = GROUPS.flatMap((group) => group.sources);

  function groupForSource(source) {
    return GROUPS.find((group) => group.sources.includes(source))?.id || "";
  }

  return { GROUPS, LABELS, DEFAULT_ACTIVE, SOURCE_KEYS, groupForSource };
}));
