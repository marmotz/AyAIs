import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, screen, shell, Tray } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from './app-config';

let win: BrowserWindow | null = null;
let isQuitting = false;
let tray: Tray | null = null;
const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');
const configPath = path.join(app.getPath('userData'), 'config.json');
const appConfig = loadAppConfig();

function loadAppConfig() {
  let rawConfig = '{}';
  try {
    rawConfig = fs.readFileSync(configPath, 'utf8');
  } catch {
    // use default
  }

  const appConfig: Partial<AppConfig> = JSON.parse(rawConfig);

  return {
    openOnStartup: false,
    launchMinimized: false,
    lastService: undefined,
    ...appConfig,
    position: {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      ...(appConfig.position ?? {}),
    },
  } satisfies AppConfig;
}

function saveAppConfig(config: AppConfig) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getIconPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'AI.png');
  }
  return path.resolve(__dirname, 'AI.png');
}

// Returns a tray icon with macOS template support when available
function getTrayIcon(): any {
  // macOS: use a small template icon to avoid occupying the status bar
  if (process.platform === 'darwin') {
    try {
      const base = nativeImage.createFromPath(getIconPath());
      const small = base.resize({ width: 16, height: 16 });
      small.setTemplateImage(true);
      return small;
    } catch {
      // fallback below
    }
  }
  return nativeImage.createFromPath(getIconPath());
}

function createWindow(): BrowserWindow {
  const size = screen.getPrimaryDisplay().workAreaSize;
  let windowBounds = { x: 0, y: 0, width: size.width, height: size.height };
  try {
    if (
      appConfig.position.x !== undefined &&
      appConfig.position.y !== undefined &&
      appConfig.position.width &&
      appConfig.position.height
    ) {
      windowBounds = appConfig.position;
    }
  } catch {
    // ignore
  }
  const window = new BrowserWindow({
    x: windowBounds.x,
    y: windowBounds.y,
    width: windowBounds.width,
    height: windowBounds.height,
    title: 'AyAIs',
    webPreferences: {
      nodeIntegration: false,
      allowRunningInsecureContent: serve,
      contextIsolation: true,
      webSecurity: !serve,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: getIconPath(),
  });
  if (serve) {
    import('electron-debug').then((debug) => {
      debug.default({ isEnabled: true, showDevTools: true });
    });
    import('electron-reloader').then((reloader) => {
      const reloaderFn = (reloader as any).default || reloader;
      reloaderFn(module);
    });
    window.loadURL('http://localhost:4200');
    window.webContents.openDevTools();
  } else {
    let pathIndex = './browser/index.html';
    if (fs.existsSync(path.join(__dirname, '../dist/browser/index.html'))) {
      pathIndex = '../dist/browser/index.html';
    }
    const fullPath = path.join(__dirname, pathIndex);
    const url = `file://${path.resolve(fullPath).replace(/\\/g, '/')}`;
    window.loadURL(url);
    if (!app.isPackaged) {
      window.webContents.openDevTools();
    }
  }
  const saveBounds = () => {
    if (window) {
      appConfig.position = window.getBounds();
      saveAppConfig(appConfig);
    }
  };
  window.on('move', saveBounds);
  window.on('resize', saveBounds);
  window.on('close', (event) => {
    if (window && !isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });
  window.on('closed', () => {
    win = null;
  });

  return window;
}

// IPC handlers for app settings
ipcMain.handle('get-last-service', () => {
  try {
    return appConfig.lastService;
  } catch {
    return null;
  }
});

ipcMain.handle('save-last-service', (event, serviceName) => {
  try {
    appConfig.lastService = serviceName;
    saveAppConfig(appConfig);
  } catch (e) {
    console.error('Failed to save service', e);
  }
});

ipcMain.handle('get-app-config', () => {
  try {
    return appConfig;
  } catch {
    return { openOnStartup: false, launchMinimized: false };
  }
});

ipcMain.handle('save-app-config', (event, appConfig: AppConfig) => {
  try {
    saveAppConfig(appConfig);
  } catch (e) {
    console.error('Failed to save app config', e);
  }
});

// Open external URLs in the default browser via IPC
ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (e) {
    console.error('Failed to open external URL', url, e);
    return false;
  }
});

try {
  app.on('ready', () => {
    try {
      app.setAppUserModelId('dev.marmotz.ayais');
    } catch {
      // ignore
    }
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }
    setTimeout(() => {
      win = createWindow();
    }, 400);
    Menu.setApplicationMenu(null);
    const trayMenu = Menu.buildFromTemplate([
      {
        label: 'Quit AyAIs',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray = new Tray(getTrayIcon());
    tray.setToolTip('AyAIs');
    // Attach the tray menu so users can quit from the tray
    tray.setContextMenu(trayMenu);
    tray.on('click', () => {
      if (win) {
        win.show();
        win.focus();
      }
    });
    globalShortcut.register('Super+I', () => {
      if (win) {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
          win.focus();
        }
      }
    });
  });
} catch (e) {
  // ignore
}

app.on('before-quit', () => {
  isQuitting = true;
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !tray) {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  if (win === null) {
    win = createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
