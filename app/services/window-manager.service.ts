import { AppConfig } from '@shared/types/app-config.interface';
import { app, BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { IconService } from './icon.service';

export class WindowManagerService {
  private window: BrowserWindow | null = null;
  private isQuitting = false;
  private readonly serve: boolean;
  private saveConfigCallback: (() => void) | null = null;

  constructor(private appConfig: AppConfig) {
    const args = process.argv.slice(1);
    this.serve = args.some((val) => val === '--serve');
  }

  public createWindow(): BrowserWindow {
    const size = screen.getPrimaryDisplay().workAreaSize;
    let windowBounds = { x: 0, y: 0, width: size.width, height: size.height };

    try {
      if (
        this.appConfig.position.x !== undefined &&
        this.appConfig.position.y !== undefined &&
        this.appConfig.position.width &&
        this.appConfig.position.height
      ) {
        windowBounds = this.appConfig.position;
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
        allowRunningInsecureContent: this.serve,
        contextIsolation: true,
        webSecurity: !this.serve,
        webviewTag: true,
        preload: path.join(__dirname, '../electron/preload.js'),
      },
      icon: IconService.getIconPath(),
      skipTaskbar: this.appConfig.launchHidden,
    };

    if (process.platform === 'linux' && this.appConfig.launchHidden) {
      windowOptions.show = false;
    }

    const window = new BrowserWindow(windowOptions);
    this.setupWindowLoad(window);
    this.setupWindowEvents(window);

    this.window = window;

    return window;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public hideWindow(): void {
    if (this.window) {
      if (process.platform === 'win32' || process.platform === 'darwin') {
        this.window.setSkipTaskbar(true);
      } else if (process.platform === 'linux') {
        this.window.setSkipTaskbar(true);
        this.window.setVisibleOnAllWorkspaces(false);
        this.window.setAlwaysOnTop(false);
      }

      this.window.hide();
    }
  }

  public isVisible(): boolean {
    return this.window?.isVisible() ?? false;
  }

  public setQuitting(quitting: boolean): void {
    this.isQuitting = quitting;
  }

  public showWindow(): void {
    if (this.window) {
      if (process.platform === 'win32' || process.platform === 'darwin') {
        this.window.setSkipTaskbar(false);
      } else if (process.platform === 'linux') {
        this.window.setSkipTaskbar(false);
        this.window.setVisibleOnAllWorkspaces(true);
      }
      this.window.show();
      this.window.focus();
    }
  }

  public updateConfig(appConfig: AppConfig, saveCallback: () => void): void {
    this.appConfig = appConfig;
    this.saveConfigCallback = saveCallback;
  }

  private setupWindowEvents(window: BrowserWindow): void {
    const saveBounds = () => {
      if (window) {
        this.appConfig.position = window.getBounds();
        if (this.saveConfigCallback) {
          this.saveConfigCallback();
        }
      }
    };

    window.on('move', saveBounds);
    window.on('resize', saveBounds);
    window.on('close', (event) => {
      if (window && !this.isQuitting) {
        event.preventDefault();
        this.hideWindow();
      }
    });

    window.on('closed', () => {
      this.window = null;
    });

    if (this.appConfig.launchHidden) {
      window.setSkipTaskbar(true);
    }
  }

  private setupWindowLoad(window: BrowserWindow): void {
    if (this.serve) {
      import('electron-debug').then((debug) => {
        debug.default({
          isEnabled: true,
          showDevTools: true,
        });
      });

      import('electron-reloader').then((reloader) => {
        const reloaderFn = (reloader as any).default || reloader;
        reloaderFn(module);
      });

      window.loadURL('http://localhost:4213');
      window.webContents.openDevTools();
    } else {
      let pathIndex = './renderer/browser/index.html';

      if (fs.existsSync(path.join(__dirname, '../../dist/renderer/browser/index.html'))) {
        pathIndex = '../../dist/renderer/browser/index.html';
      }

      const fullPath = path.join(__dirname, '../..', pathIndex);
      const url = `file://${path.resolve(fullPath).replace(/\\/g, '/')}`;

      window.loadURL(url);

      if (!app.isPackaged) {
        window.webContents.openDevTools();
      }
    }
  }
}
