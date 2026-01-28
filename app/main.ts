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
let appConfig = loadAppConfig();

function loadAppConfig() {
  let rawConfig = '{}';
  try {
    rawConfig = fs.readFileSync(configPath, 'utf8');
  } catch {
    // use default
  }

  const appConfig: Partial<AppConfig> = JSON.parse(rawConfig);

  return {
    launchAtStartup: false,
    launchHidden: false,
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

function isStartupEnabled(): boolean {
  try {
    const loginItemSettings = app.getLoginItemSettings();

    return loginItemSettings.openAtLogin;
  } catch {
    return false;
  }
}

function enableStartup(): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      args: [],
    });
  } catch (e) {
    console.error('Failed to enable startup:', e);
  }
}

function disableStartup(): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: false,
      args: [],
    });
  } catch (e) {
    console.error('Failed to disable startup:', e);
  }
}

function syncStartupSettings(): void {
  try {
    const currentlyEnabled = isStartupEnabled();
    const shouldBeEnabled = appConfig.launchAtStartup;

    if (currentlyEnabled && !shouldBeEnabled) {
      // Désactiver le démarrage automatique
      disableStartup();
    } else if (!currentlyEnabled && shouldBeEnabled) {
      // Activer le démarrage automatique
      enableStartup();
    }
    // Si les états sont identiques, ne rien faire
  } catch (e) {
    console.error('Failed to sync startup settings:', e);
  }
}

function saveAppConfig() {
  fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2));
  // Synchroniser les paramètres de démarrage après sauvegarde
  syncStartupSettings();
}

function getIconPath(): string {
  return path.resolve(__dirname, 'icon.png');
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

function showWindow(): void {
  if (win) {
    if (process.platform === 'win32' || process.platform === 'darwin') {
      win.setSkipTaskbar(false);
    } else if (process.platform === 'linux') {
      // On Linux, we need to use window flags to hide from taskbar
      win.setSkipTaskbar(false);
      win.setVisibleOnAllWorkspaces(true);
    }
    win.show();
    win.focus();
  }
}

function hideWindow(): void {
  if (win) {
    if (process.platform === 'win32' || process.platform === 'darwin') {
      win.setSkipTaskbar(true);
    } else if (process.platform === 'linux') {
      // On Linux, we need to use window flags to hide from taskbar
      win.setSkipTaskbar(true);
      win.setVisibleOnAllWorkspaces(false);
      win.setAlwaysOnTop(false);
    }

    win.hide();
  }
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
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
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
    skipTaskbar: appConfig.launchHidden,
  };

  // Linux specific window options
  if (process.platform === 'linux' && appConfig.launchHidden) {
    windowOptions.show = false;
  }

  const window = new BrowserWindow(windowOptions);
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
      saveAppConfig();
    }
  };
  window.on('move', saveBounds);
  window.on('resize', saveBounds);
  window.on('close', (event) => {
    if (window && !isQuitting) {
      event.preventDefault();
      hideWindow();
    }
  });

  window.on('closed', () => {
    win = null;
  });

  // Set initial taskbar visibility based on launchHidden setting
  if (appConfig.launchHidden) {
    window.setSkipTaskbar(true);
  }

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

ipcMain.handle('save-last-service', (_event, serviceName) => {
  try {
    appConfig.lastService = serviceName;
    saveAppConfig();
  } catch (e) {
    console.error('Failed to save service', e);
  }
});

ipcMain.handle('get-app-config', () => {
  return appConfig;
});

ipcMain.handle('save-app-config', (_event, newAppConfig: Partial<AppConfig>) => {
  try {
    appConfig = {
      ...appConfig,
      ...newAppConfig,
    };
    saveAppConfig();
  } catch (e) {
    console.error('Failed to save app config', e);
  }
});

ipcMain.handle('is-startup-enabled', () => {
  try {
    return isStartupEnabled();
  } catch (e) {
    console.error('Failed to check startup status', e);
    return false;
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

    if (process.platform === 'darwin' && app.dock) {
      try {
        app.dock.setIcon(getIconPath());
      } catch {
        // ignore
      }
    }

    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    // Synchroniser les paramètres de démarrage au lancement de l'app
    syncStartupSettings();
    setTimeout(() => {
      win = createWindow();
      if (appConfig.launchHidden) {
        hideWindow();
      }
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
        if (win.isVisible()) {
          hideWindow();
        } else {
          showWindow();
        }
      }
    });
    globalShortcut.register('Super+I', () => {
      if (win) {
        if (win.isVisible() && win.isFocused()) {
          hideWindow();
        } else {
          showWindow();
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
    showWindow();
  }
});

app.on('activate', () => {
  if (win === null) {
    win = createWindow();
    if (appConfig.launchHidden) {
      hideWindow();
    }
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
