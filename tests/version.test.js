"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { isNewerVersion, normalizeVersion } = require("../desktop/version");

test("legge versioni GitHub con prefisso v", () => {
  assert.deepEqual(normalizeVersion("v2.3.4"), {
    parts: [2, 3, 4],
    prerelease: "",
  });
});

test("riconosce una versione più recente", () => {
  assert.equal(isNewerVersion("v0.3.0", "0.2.0"), true);
  assert.equal(isNewerVersion("v0.2.1", "0.2.0"), true);
  assert.equal(isNewerVersion("v1.0.0", "0.9.9"), true);
});

test("non segnala versioni uguali, precedenti o non valide", () => {
  assert.equal(isNewerVersion("v0.2.0", "0.2.0"), false);
  assert.equal(isNewerVersion("v0.1.9", "0.2.0"), false);
  assert.equal(isNewerVersion("prossima", "0.2.0"), false);
});

test("considera la versione stabile successiva a una prerelease", () => {
  assert.equal(isNewerVersion("v1.0.0", "1.0.0-beta.1"), true);
  assert.equal(isNewerVersion("v1.0.0-beta.2", "1.0.0"), false);
});
