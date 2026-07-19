"use strict";

const ARCHITECTURES = {
  arm64: ["arm64", "aarch64"],
  x64: ["x64", "x86_64", "amd64"],
};

function nameTokens(name) {
  return String(name || "").toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean);
}

function assetForCurrentPlatform(release, platform = process.platform, arch = process.arch) {
  const architectureNames = ARCHITECTURES[arch] || [String(arch).toLowerCase()];
  const candidates = (release.assets || []).filter((asset) => {
    const name = String(asset.name || "").toLowerCase();
    return architectureNames.some((architecture) => name.includes(architecture));
  });

  if (platform === "darwin") {
    return candidates.find((asset) => String(asset.name || "").toLowerCase().endsWith(".dmg"))
      || candidates.find((asset) => {
        const name = String(asset.name || "").toLowerCase();
        const tokens = nameTokens(name);
        return name.endsWith(".zip") && (tokens.includes("mac") || tokens.includes("darwin"));
      });
  }

  if (platform === "win32") {
    return candidates.find((asset) => String(asset.name || "").toLowerCase().endsWith(".exe"))
      || candidates.find((asset) => {
        const name = String(asset.name || "").toLowerCase();
        const tokens = nameTokens(name);
        return name.endsWith(".zip") && (
          tokens.includes("win") || tokens.includes("win32") || tokens.includes("windows")
        );
      });
  }

  return undefined;
}

module.exports = { assetForCurrentPlatform };
