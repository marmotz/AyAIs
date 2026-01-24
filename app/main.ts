import { app, BrowserWindow, globalShortcut, ipcMain, Menu, screen, Tray } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');
const configPath = path.join(app.getPath('userData'), 'window-config.json');
const appConfigPath = path.join(app.getPath('userData'), 'app-config.json');

/** Resolve the app icon path in development and production.
 *  - In development, point to the source asset in AI.png
 *  - In production, point to the packaged asset under resources
 */
function getIconPath(): string {
  if (app.isPackaged) {
    // Packaged app: assets are located in the resources path
    return path.join(process.resourcesPath, 'AI.png');
  }
  // Development: use the project source asset
  return path.resolve(__dirname, 'AI.png');
}

function createWindow(): BrowserWindow {
  const size = screen.getPrimaryDisplay().workAreaSize;

  let windowBounds = { x: 0, y: 0, width: size.width, height: size.height };
  try {
    const config = fs.readFileSync(configPath, 'utf8');
    const saved = JSON.parse(config);
    if (saved.x !== undefined && saved.y !== undefined && saved.width && saved.height) {
      windowBounds = saved;
    }
  } catch (e) {
    // ignore, use defaults
  }

  // Create the browser window.
  win = new BrowserWindow({
    x: windowBounds.x,
    y: windowBounds.y,
    width: windowBounds.width,
    height: windowBounds.height,
    title: 'AyAIs',
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,
      webSecurity: !serve,
      webviewTag: true,
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
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    // Path when running electron executable
    let pathIndex = './browser/index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/browser/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/browser/index.html';
    }

    const fullPath = path.join(__dirname, pathIndex);
    const url = `file://${path.resolve(fullPath).replace(/\\/g, '/')}`;
    win.loadURL(url);
    // Always open DevTools in development (when not packaged)
    if (!app.isPackaged) {
      win.webContents.openDevTools();
    }
  }

  const saveBounds = () => {
    if (win) {
      const bounds = win.getBounds();
      fs.writeFileSync(configPath, JSON.stringify(bounds));
    }
  };

  win.on('move', saveBounds);
  win.on('resize', saveBounds);

  // Prevent window from closing, hide to tray instead
  win.on('close', (event) => {
    if (win) {
      event.preventDefault();
      win.hide();
    }
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

// IPC handlers for app settings
ipcMain.handle('get-last-service', () => {
  try {
    const config = fs.readFileSync(appConfigPath, 'utf8');
    const saved = JSON.parse(config);
    return saved.lastService || null;
  } catch {
    return null;
  }
});

ipcMain.handle('save-service', (event, serviceName) => {
  try {
    let config: any = {};
    try {
      config = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
    } catch {}
    config.lastService = serviceName;
    fs.writeFileSync(appConfigPath, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save service', e);
  }
});

// App-wide config persistence (startup and shortcuts)
ipcMain.handle('get-app-config', () => {
  try {
    const config = fs.readFileSync(appConfigPath, 'utf8');
    const saved = JSON.parse(config);
    return saved.appConfig || { openOnStartup: false, launchMinimized: false };
  } catch {
    return { openOnStartup: false, launchMinimized: false };
  }
});

ipcMain.handle('save-app-config', (event, cfg) => {
  try {
    let config: any = {};
    try {
      config = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
    } catch {}
    config.appConfig = cfg;
    fs.writeFileSync(appConfigPath, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save app config', e);
  }
});

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    // Set a stable AppUserModelID for Windows taskbar/notifications
    try {
      app.setAppUserModelId('dev.marmotz.ayais');
    } catch {
      // ignore if not supported on current platform
    }
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }
    setTimeout(createWindow, 400);
    Menu.setApplicationMenu(null);

    // Create system tray
    const trayIconPath = getIconPath();
    tray = new Tray(trayIconPath);
    tray.setToolTip('AyAIs');

    // Tray click shows window
    tray.on('click', () => {
      if (win) {
        win.show();
        win.focus();
      }
    });

    // Register global shortcut
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

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // But keep running if tray is present
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
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
} catch (e) {
  // Catch Error
  // throw e;
}
