"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  accessStateFromPageText,
  accessUpdateFromPageText,
  isJstorUrl,
  jstorSearchUrl,
  normalizeJstorSearchRecords,
} = require("../desktop/jstor");

test("accetta soltanto collegamenti HTTPS appartenenti a JSTOR", () => {
  assert.equal(isJstorUrl("https://www.jstor.org/stable/123"), true);
  assert.equal(isJstorUrl("https://support.jstor.org/article"), true);
  assert.equal(isJstorUrl("http://www.jstor.org/stable/123"), false);
  assert.equal(isJstorUrl("https://jstor.org.example.com/stable/123"), false);
});

test("mantiene la verifica attiva durante il passaggio dal portale universitario", () => {
  assert.equal(accessUpdateFromPageText("Have library access?", { allowDisconnected: false }), null);
  assert.equal(accessUpdateFromPageText("Access provided by Example University"), true);
  assert.equal(accessUpdateFromPageText("Have library access?", { allowDisconnected: true }), false);
});

test("crea una ricerca JSTOR con testo codificato", () => {
  const url = new URL(jstorSearchUrl("Virginia Woolf & modernism"));
  assert.equal(url.hostname, "www.jstor.org");
  assert.equal(url.pathname, "/action/doBasicSearch");
  assert.equal(url.searchParams.get("Query"), "Virginia Woolf & modernism");
});

test("riconosce l'accesso istituzionale senza leggere il nome dell'università", () => {
  assert.deepEqual(accessStateFromPageText("Access provided by Example University"), {
    institutionalAccess: true,
    conclusive: true,
  });
  assert.deepEqual(accessStateFromPageText("  ACCESS\nPROVIDED   BY Biblioteca di esempio  "), {
    institutionalAccess: true,
    conclusive: true,
  });
  assert.deepEqual(accessStateFromPageText("Have library access? Log in through your library"), {
    institutionalAccess: false,
    conclusive: true,
  });
  assert.deepEqual(accessStateFromPageText("Search and browse JSTOR"), {
    institutionalAccess: false,
    conclusive: false,
  });
});

test("normalizza risultati JSTOR autenticati e riconosce le discipline", () => {
  const results = normalizeJstorSearchRecords([
    {
      title: "Log 1",
      link: "https://www.jstor.org/stable/41765001?seq=1",
      author: "Cynthia Davidson",
      publication: "Log",
      context: "Architecture and urban studies · 2003 · doi:10.2307/41765001",
    },
    {
      title: "Duplicato",
      link: "https://www.jstor.org/stable/41765001#metadata_info_tab_contents",
    },
    {
      title: "Sito estraneo",
      link: "https://example.com/stable/123",
    },
  ]);
  assert.equal(results.length, 1);
  assert.equal(results[0].source, "jstor");
  assert.equal(results[0].publication, "Log");
  assert.equal(results[0].year, "2003");
  assert.equal(results[0].doi, "10.2307/41765001");
  assert.deepEqual(results[0].disciplines.sort(), ["architecture", "urban"]);
});
