"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { GROUPS, DEFAULT_ACTIVE, SOURCE_KEYS } = require("../source-catalog");

test("ogni fonte appartiene a un solo gruppo", () => {
  assert.equal(new Set(SOURCE_KEYS).size, SOURCE_KEYS.length);
  assert.deepEqual(GROUPS.map((group) => group.id), [
    "open", "external", "academic", "documents", "drive",
  ]);
});

test("JSTOR, Drive e fonti esterne sono disattivati all'apertura", () => {
  const active = new Set(DEFAULT_ACTIVE);
  assert.equal(active.has("jstor"), false);
  assert.equal(active.has("googledrive"), false);
  const external = GROUPS.find((group) => group.id === "external").sources;
  assert.equal(external.some((source) => active.has(source)), false);
});

test("catalogo grafico e motore Python espongono le stesse fonti", () => {
  const project = path.resolve(__dirname, "..");
  const script = "import json, server; print(json.dumps(sorted(server.SOURCE_LABELS)))";
  const result = spawnSync(process.env.PYTHON_BIN || "python3", ["-c", script], {
    cwd: project,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const engineSources = JSON.parse(result.stdout);
  assert.deepEqual([...SOURCE_KEYS, "doi"].sort(), engineSources);
});
