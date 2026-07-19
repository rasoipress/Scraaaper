"use strict";

function normalizeVersion(value) {
  const match = String(value || "")
    .trim()
    .match(/^[^\d]*(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if (!match) return null;
  return {
    parts: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] || "",
  };
}

function isNewerVersion(candidate, current) {
  const next = normalizeVersion(candidate);
  const installed = normalizeVersion(current);
  if (!next || !installed) return false;
  for (let index = 0; index < 3; index += 1) {
    if (next.parts[index] !== installed.parts[index]) {
      return next.parts[index] > installed.parts[index];
    }
  }
  return Boolean(installed.prerelease && !next.prerelease);
}

module.exports = { isNewerVersion, normalizeVersion };
