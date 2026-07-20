"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeDoi,
  itemLanguages,
  availableLanguageCodes,
  matchesLanguages,
  languageOptions,
} = require("../result-metadata");

test("riconosce DOI semplici, prefissati e URL doi.org", () => {
  assert.equal(normalizeDoi("10.1038/s41586-020-2649-2"), "10.1038/s41586-020-2649-2");
  assert.equal(normalizeDoi("DOI: 10.5555/ABC.12"), "10.5555/abc.12");
  assert.equal(normalizeDoi("https://doi.org/10.1000/182"), "10.1000/182");
  assert.equal(normalizeDoi("un normale titolo"), "");
});

test("normalizza le lingue restituite dalle diverse fonti", () => {
  assert.deepEqual(itemLanguages({ languages: ["eng", "it-IT"] }), ["en", "it"]);
  assert.deepEqual(itemLanguages({ language: "fr; de" }), ["fr", "de"]);
  assert.deepEqual(itemLanguages({}), ["und"]);
});

test("filtra con selezione multipla e conserva i risultati multilingue", () => {
  const item = { languages: ["en", "it"] };
  assert.equal(matchesLanguages(item, new Set(["it", "fr"])), true);
  assert.equal(matchesLanguages(item, new Set(["fr"])), false);
  assert.equal(matchesLanguages(item, new Set()), true);
});

test("rende disponibili solo le lingue presenti nei risultati", () => {
  const results = [{ languages: ["it"] }, { language: "en" }, {}];
  assert.deepEqual([...availableLanguageCodes(results)].sort(), ["en", "it", "und"]);
  const options = languageOptions(results, "it", "Lingua non indicata");
  assert.equal(options.find((option) => option.code === "it").available, true);
  assert.equal(options.find((option) => option.code === "fr").available, false);
});
