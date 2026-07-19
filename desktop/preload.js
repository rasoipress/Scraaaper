"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("scraaaperDesktop", {
  jstor: {
    status: () => ipcRenderer.invoke("jstor:status"),
    connect: () => ipcRenderer.invoke("jstor:connect"),
    search: (query) => ipcRenderer.invoke("jstor:search", query),
    open: (url) => ipcRenderer.invoke("jstor:open", url),
    onStatusChanged: (callback) => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on("jstor:status-changed", listener);
      return () => ipcRenderer.removeListener("jstor:status-changed", listener);
    },
  },
});
