import { spawnSync } from "node:child_process";

export default async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const result = spawnSync("/usr/bin/xattr", ["-cr", context.appOutDir], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("Impossibile rimuovere i metadati estesi prima della firma macOS.");
  }
}
