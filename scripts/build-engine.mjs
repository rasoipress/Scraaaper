import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const python = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");

const check = spawnSync(python, ["-c", "import PyInstaller, certifi"], {
  cwd: projectDirectory,
  stdio: "ignore",
});

if (check.status !== 0) {
  console.error("Mancano PyInstaller o certifi. Installa con:");
  console.error(`  ${python} -m pip install pyinstaller certifi`);
  process.exit(check.status || 1);
}

const webFiles = [
  "app.js",
  "search-results.js",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "icon.svg",
  "sw.js",
];
const argumentsForPyInstaller = [
  "-m",
  "PyInstaller",
  "--noconfirm",
  "--clean",
  "--onedir",
  "--name",
  "scraaaper-search-service",
  "--distpath",
  path.join(projectDirectory, "dist-bin"),
  "--workpath",
  path.join(projectDirectory, "work", "pyinstaller"),
  "--specpath",
  path.join(projectDirectory, "work"),
];

for (const file of webFiles) {
  argumentsForPyInstaller.push("--add-data", `${path.join(projectDirectory, file)}:web`);
}
argumentsForPyInstaller.push(path.join(projectDirectory, "server.py"));

const result = spawnSync(python, argumentsForPyInstaller, {
  cwd: projectDirectory,
  env: {
    ...process.env,
    PYINSTALLER_CONFIG_DIR: path.join(projectDirectory, "work", "pyinstaller-config"),
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(`Impossibile avviare ${python}: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
