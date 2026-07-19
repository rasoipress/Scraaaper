"use strict";

const { app, BrowserWindow, Menu, dialog, net, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const readline = require("node:readline");
const { isNewerVersion } = require("./version");

const REPOSITORY = "rasoipress/Scraaaper";
const RELEASE_API = `https://api.github.com/repos/${REPOSITORY}/releases/latest`;
const RELEASES_URL = `https://github.com/${REPOSITORY}/releases`;
const UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000;

let engineProcess = null;
let mainWindow = null;
let quitting = false;
let updateDialogOpen = false;
let lastNotifiedVersion = "";

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

async function openExternal(value) {
  const url = safeExternalUrl(value);
  if (url) await shell.openExternal(url);
}

function engineLaunchConfig() {
  if (app.isPackaged) {
    return {
      command: path.join(process.resourcesPath, "search-service", "scraaaper-search-service"),
      args: ["--host", "127.0.0.1", "--port", "0", "--no-browser"],
      cwd: process.resourcesPath,
    };
  }
  return {
    command: process.env.SCRAAAPER_PYTHON || "python3",
    args: [
      path.join(app.getAppPath(), "server.py"),
      "--host",
      "127.0.0.1",
      "--port",
      "0",
      "--no-browser",
    ],
    cwd: app.getAppPath(),
  };
}

function startEngine() {
  const config = engineLaunchConfig();
  return new Promise((resolve, reject) => {
    let completed = false;
    let stderr = "";
    const finish = (callback, value) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      callback(value);
    };

    engineProcess = spawn(config.command, config.args, {
      cwd: config.cwd,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const output = readline.createInterface({ input: engineProcess.stdout });
    output.on("line", (line) => {
      const match = line.match(/^SCRAAAPER_READY=(http:\/\/127\.0\.0\.1:\d+\/)$/);
      if (match) finish(resolve, match[1]);
    });

    engineProcess.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-5000);
    });

    engineProcess.once("error", (error) => {
      finish(reject, new Error(`Impossibile avviare il motore di ricerca: ${error.message}`));
    });

    engineProcess.once("exit", (code, signal) => {
      if (!completed) {
        finish(
          reject,
          new Error(stderr.trim() || `Il motore di ricerca si è chiuso (${signal || code}).`)
        );
        return;
      }
      if (!quitting) {
        dialog.showErrorBox(
          "Scraaaper si è arrestato",
          stderr.trim() || "Il motore di ricerca locale si è chiuso inaspettatamente."
        );
        app.quit();
      }
    });

    const timeout = setTimeout(() => {
      finish(reject, new Error("Il motore di ricerca non ha risposto entro 25 secondi."));
      engineProcess?.kill();
    }, 25_000);
  });
}

async function createMainWindow(engineUrl) {
  const engineOrigin = new URL(engineUrl).origin;
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 820,
    minHeight: 620,
    show: false,
    backgroundColor: "#060606",
    title: "Scraaaper",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, target) => {
    const destination = safeExternalUrl(target);
    if (!destination || new URL(destination).origin !== engineOrigin) {
      event.preventDefault();
      if (destination) openExternal(destination);
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  await mainWindow.loadURL(engineUrl);
}

function assetForCurrentMac(release) {
  const names = process.arch === "arm64" ? ["arm64", "aarch64"] : ["x64", "x86_64"];
  return (release.assets || []).find((asset) => {
    const name = String(asset.name || "").toLowerCase();
    return name.endsWith(".dmg") && names.some((architecture) => name.includes(architecture));
  });
}

async function showUpdateDialog(release) {
  const latest = release.tag_name;
  if (updateDialogOpen || latest === lastNotifiedVersion) return;
  updateDialogOpen = true;
  lastNotifiedVersion = latest;
  const asset = assetForCurrentMac(release);
  const published = release.published_at
    ? new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(release.published_at))
    : "";
  const options = {
    type: "info",
    title: "Aggiornamento disponibile",
    message: `È disponibile Scraaaper ${latest}.`,
    detail: [
      `Versione installata: ${app.getVersion()}`,
      published ? `Pubblicata il ${published}.` : "",
      "Il download si aprirà su GitHub.",
    ].filter(Boolean).join("\n"),
    buttons: ["Scarica da GitHub", "Più tardi"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  };
  const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  const result = parent
    ? await dialog.showMessageBox(parent, options)
    : await dialog.showMessageBox(options);
  updateDialogOpen = false;
  if (result.response === 0) {
    await openExternal(asset?.browser_download_url || release.html_url || RELEASES_URL);
  }
}

async function checkForUpdates(interactive = false) {
  try {
    const response = await net.fetch(RELEASE_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": `Scraaaper/${app.getVersion()}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (response.status === 404) {
      if (interactive) {
        await dialog.showMessageBox(mainWindow, {
          type: "info",
          message: "Non ci sono ancora versioni pubblicate su GitHub Releases.",
          buttons: ["OK"],
        });
      }
      return;
    }
    if (!response.ok) throw new Error(`GitHub ha risposto con HTTP ${response.status}.`);
    const release = await response.json();
    if (release.draft || release.prerelease) return;
    if (isNewerVersion(release.tag_name, app.getVersion())) {
      await showUpdateDialog(release);
    } else if (interactive) {
      await dialog.showMessageBox(mainWindow, {
        type: "info",
        message: "Scraaaper è aggiornato.",
        detail: `Versione installata: ${app.getVersion()}`,
        buttons: ["OK"],
      });
    }
  } catch (error) {
    if (interactive) {
      await dialog.showMessageBox(mainWindow, {
        type: "warning",
        message: "Non è stato possibile controllare gli aggiornamenti.",
        detail: String(error.message || error),
        buttons: ["OK"],
      });
    }
  }
}

function createMenu() {
  const template = [
    ...(process.platform === "darwin" ? [{
      label: app.name,
      submenu: [
        { role: "about", label: "Informazioni su Scraaaper" },
        { type: "separator" },
        { role: "hide", label: "Nascondi Scraaaper" },
        { role: "hideOthers", label: "Nascondi altre" },
        { role: "unhide", label: "Mostra tutte" },
        { type: "separator" },
        { role: "quit", label: "Esci da Scraaaper" },
      ],
    }] : []),
    {
      label: "Modifica",
      submenu: [
        { role: "undo", label: "Annulla" },
        { role: "redo", label: "Ripristina" },
        { type: "separator" },
        { role: "cut", label: "Taglia" },
        { role: "copy", label: "Copia" },
        { role: "paste", label: "Incolla" },
        { role: "selectAll", label: "Seleziona tutto" },
      ],
    },
    {
      label: "Vista",
      submenu: [
        { role: "reload", label: "Ricarica" },
        { type: "separator" },
        { role: "resetZoom", label: "Dimensione reale" },
        { role: "zoomIn", label: "Ingrandisci" },
        { role: "zoomOut", label: "Riduci" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Schermo intero" },
      ],
    },
    {
      label: "Finestra",
      submenu: [
        { role: "minimize", label: "Contrai" },
        { role: "close", label: "Chiudi" },
      ],
    },
    {
      label: "Aiuto",
      role: "help",
      submenu: [
        { label: "Controlla aggiornamenti…", click: () => checkForUpdates(true) },
        { label: "Versioni su GitHub", click: () => openExternal(RELEASES_URL) },
        { label: "Codice sorgente", click: () => openExternal(`https://github.com/${REPOSITORY}`) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function bootstrap() {
  app.setAboutPanelOptions({
    applicationName: "Scraaaper",
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
  });
  createMenu();
  const engineUrl = await startEngine();
  await createMainWindow(engineUrl);
  setTimeout(() => checkForUpdates(false), 3500);
  setInterval(() => checkForUpdates(false), UPDATE_INTERVAL_MS);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(bootstrap).catch((error) => {
    dialog.showErrorBox("Scraaaper non può avviarsi", String(error.message || error));
    app.quit();
  });
}

app.on("before-quit", () => {
  quitting = true;
  if (engineProcess && !engineProcess.killed) engineProcess.kill();
});

app.on("window-all-closed", () => app.quit());
