import { app, Menu } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { ConfigManagerService } from '../services/config-manager.service';
import { DebugLoggerService } from '../services/debug-logger.service';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { TrayManagerService } from '../services/tray-manager.service';
import { WindowManagerService } from '../services/window-manager.service';
import { MOCK_CONFIG } from '../tests/test-config';
import { initializeApp } from './app-initializer';

vi.mock('electron', () => ({
  app: {
    setAppUserModelId: vi.fn(),
    requestSingleInstanceLock: vi.fn(() => true),
    quit: vi.fn(),
    dock: {
      setIcon: vi.fn(),
    },
    on: vi.fn(),
  },
  Menu: {
    setApplicationMenu: vi.fn(),
  },
}));

vi.mock('../services/icon.service', () => ({
  IconService: {
    getIconPath: vi.fn(() => 'mock-icon-path'),
  },
}));

vi.mock('../handlers', () => ({
  setupIPCHandlers: vi.fn(),
}));

describe('AppInitializer', () => {
  let configManager: ConfigManagerService;
  let windowManager: WindowManagerService;
  let shortcutManager: ShortcutManagerService;
  let trayManager: TrayManagerService;
  let autoUpdater: AutoUpdaterService;
  let startupManager: StartupManagerService;
  let debugLogger: DebugLoggerService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock implementation to return true by default
    (app.requestSingleInstanceLock as any).mockReturnValue(true);

    configManager = {
      getConfig: vi.fn(() => ({ ...MOCK_CONFIG })),
    } as any;

    windowManager = {
      createWindow: vi.fn(),
      hideWindow: vi.fn(),
      getWindow: vi.fn(),
    } as any;

    shortcutManager = {
      setupShortcuts: vi.fn(),
    } as any;

    trayManager = {
      setupTray: vi.fn(),
    } as any;

    autoUpdater = {
      setupAutoUpdater: vi.fn(),
      checkForUpdates: vi.fn(() => Promise.resolve()),
    } as any;

    startupManager = {
      sync: vi.fn(),
    } as any;

    debugLogger = {} as any;
  });

  it('should set app user model ID', () => {
    initializeApp(
      configManager,
      windowManager,
      shortcutManager,
      trayManager,
      autoUpdater,
      startupManager,
      debugLogger,
      false
    );

    expect(app.setAppUserModelId).toHaveBeenCalledWith('dev.marmotz.ayais');
  });

  it('should request single instance lock', () => {
    initializeApp(
      configManager,
      windowManager,
      shortcutManager,
      trayManager,
      autoUpdater,
      startupManager,
      debugLogger,
      false
    );

    expect(app.requestSingleInstanceLock).toHaveBeenCalled();
  });

  it('should quit app if single instance lock fails', () => {
    (app.requestSingleInstanceLock as any).mockReturnValue(false);

    initializeApp(
      configManager,
      windowManager,
      shortcutManager,
      trayManager,
      autoUpdater,
      startupManager,
      debugLogger,
      false
    );

    expect(app.quit).toHaveBeenCalled();
  });

  it('should sync startup settings', () => {
    initializeApp(
      configManager,
      windowManager,
      shortcutManager,
      trayManager,
      autoUpdater,
      startupManager,
      debugLogger,
      false
    );

    // sync is called immediately, not in setTimeout
    expect(startupManager.sync).toHaveBeenCalledWith(false);
  });

  it('should setup tray', () => {
    initializeApp(
      configManager,
      windowManager,
      shortcutManager,
      trayManager,
      autoUpdater,
      startupManager,
      debugLogger,
      false
    );

    // setupTray is called immediately, not in setTimeout
    expect(trayManager.setupTray).toHaveBeenCalled();
  });

  it('should set application menu to null', () => {
    initializeApp(
      configManager,
      windowManager,
      shortcutManager,
      trayManager,
      autoUpdater,
      startupManager,
      debugLogger,
      false
    );

    // setApplicationMenu is called immediately, not in setTimeout
    expect(Menu.setApplicationMenu).toHaveBeenCalledWith(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
