import {app, BrowserWindow, ipcMain} from "electron";
import path from "path";
import url, {fileURLToPath} from "url";
import "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js")
    },
    icon: path.join(__dirname, "../public/vite.svg")
  });
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, "../dist/index.html"),
    protocol: "file:",
    slashes: true
  });
  console.log("🔍 Loading:", startUrl);
  mainWindow.loadURL(startUrl);
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-fail-load", (event, code, description) => {
    console.error(`❌ Failed to load: [${code}] ${description}`);
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", function() {
    mainWindow = null;
  });
}
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.whenReady().then(() => {
  createWindow();
  app.on("activate", function() {
    if (mainWindow === null) createWindow();
  });
});
app.on("window-all-closed", function() {
  if (process.platform !== "darwin") app.quit();
});
ipcMain.on("app-ready", (event) => {
  console.log("App is ready");
});
