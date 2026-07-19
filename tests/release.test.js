"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { assetForCurrentPlatform } = require("../desktop/release");

const release = {
  assets: [
    { name: "Scraaaper-0.3.0-mac-arm64.zip", browser_download_url: "mac-arm-zip" },
    { name: "Scraaaper-0.3.0-mac-arm64.dmg", browser_download_url: "mac-arm-dmg" },
    { name: "Scraaaper-0.3.0-mac-x64.zip", browser_download_url: "mac-x64-zip" },
    { name: "Scraaaper-0.3.0-mac-x64.dmg", browser_download_url: "mac-x64-dmg" },
    { name: "Scraaaper-0.3.0-win-x64.zip", browser_download_url: "win-x64-zip" },
    { name: "Scraaaper-0.3.0-win-x64.exe", browser_download_url: "win-x64-exe" },
  ],
};

test("sceglie il DMG corretto per Apple Silicon", () => {
  assert.equal(assetForCurrentPlatform(release, "darwin", "arm64").browser_download_url, "mac-arm-dmg");
});

test("sceglie il DMG corretto per Mac Intel", () => {
  assert.equal(assetForCurrentPlatform(release, "darwin", "x64").browser_download_url, "mac-x64-dmg");
});

test("sceglie l'installer EXE per Windows", () => {
  assert.equal(assetForCurrentPlatform(release, "win32", "x64").browser_download_url, "win-x64-exe");
});

test("non confonde gli ZIP di Windows e macOS", () => {
  const onlyArchives = { assets: release.assets.filter((asset) => asset.name.endsWith(".zip")) };
  assert.equal(assetForCurrentPlatform(onlyArchives, "win32", "x64").browser_download_url, "win-x64-zip");
  assert.equal(assetForCurrentPlatform(onlyArchives, "darwin", "x64").browser_download_url, "mac-x64-zip");
});

test("non propone pacchetti per piattaforme non supportate", () => {
  assert.equal(assetForCurrentPlatform(release, "linux", "x64"), undefined);
});
