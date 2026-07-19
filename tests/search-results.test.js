"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { interleaveResults } = require("../search-results");

test("alterna i risultati disponibili senza attendere tutte le fonti", () => {
  const result = interleaveResults({
    openlibrary: [{ id: "o1" }, { id: "o2" }],
    jstor: [{ id: "j1" }],
  }, ["openlibrary", "jstor", "archive"]);
  assert.deepEqual(result.map((item) => item.id), ["o1", "j1", "o2"]);
});

test("non modifica gli array conservati per fonte", () => {
  const sources = { openlibrary: [{ id: "o1" }] };
  interleaveResults(sources, ["openlibrary"]);
  assert.equal(sources.openlibrary.length, 1);
});
