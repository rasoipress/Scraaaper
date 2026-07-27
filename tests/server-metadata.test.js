"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

test("il motore Python normalizza DOI e crea il risultato Crossref", () => {
  const project = path.resolve(__dirname, "..");
  const script = [
    "import json, server",
    "assert server.normalize_doi('https://doi.org/10.1000/182') == '10.1000/182'",
    "assert server.normalize_languages(['eng', 'Italian']) == ['en', 'it']",
    "record = server.crossref_item_from_message({'title': ['Titolo'], 'author': [{'given': 'Nome', 'family': 'Cognome'}], 'issued': {'date-parts': [[2024]]}, 'language': 'it', 'DOI': '10.1000/182'}, '10.1000/182')",
    "drive = server.build_index_query('googledrive', 'perturbante vidler')",
    "assert 'site:drive.google.com/file' in drive",
    "assert 'site:docs.google.com/document' in drive",
    "assert '\"perturbante vidler\"' in drive",
    "assert 'filetype:pdf OR filetype:epub' in drive",
    "s3 = server.build_index_query('s3pdf', 'urban studies')",
    "assert s3 == 'site:s3.amazonaws.com \"urban studies\" filetype:pdf'",
    "print(json.dumps(record))",
  ].join("; ");
  const result = spawnSync(process.env.PYTHON_BIN || "python3", ["-c", script], {
    cwd: project,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const record = JSON.parse(result.stdout);
  assert.equal(record.author, "Nome Cognome");
  assert.equal(record.year, "2024");
  assert.deepEqual(record.languages, ["it"]);
  assert.equal(record.link, "https://doi.org/10.1000/182");
});
