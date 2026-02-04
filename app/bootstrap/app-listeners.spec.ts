import { app, globalShortcut } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { ConfigManagerService } from '../services/config-manager.service';
import { WindowManagerService } from '../services/window-manager.service';
import { MOCK_CONFIG } from '../tests/test-config';
import { registerAppEventListeners } from './app-listeners';

vi.mock('electron', () => ({
  app: {
    on: vi.fn(),
    quit: vi.fn(),
  },
  globalShortcut: {
    unregisterAll: vi.fn(),
  },
}));

describe('AppListeners', () => {
  let windowManager: WindowManagerService;
  let autoUpdater: AutoUpdaterService;
  let configManager: ConfigManagerService;

  beforeEach(() => {
    vi.clearAllMocks();

    windowManager = {
      setQuitting: vi.fn(),
      showWindow: vi.fn(),
      getWindow: vi.fn(() => null),
      createWindow: vi.fn(() => ({
        webContents: {
          send: vi.fn(),
        },
      })),
    } as any;

    autoUpdater = {
      setupAutoUpdater: vi.fn(),
      destroy: vi.fn(),
    } as any;

    configManager = {
      getConfig: vi.fn(() => ({ ...MOCK_CONFIG })),
    } as any;
  });

  it('should register all event listeners', () => {
    registerAppEventListeners(windowManager, autoUpdater, configManager);

    expect(app.on).toHaveBeenCalledWith('before-quit', expect.any(Function));
    expect(app.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
    expect(app.on).toHaveBeenCalledWith('second-instance', expect.any(Function));
    expect(app.on).toHaveBeenCalledWith('activate', expect.any(Function));
    expect(app.on).toHaveBeenCalledWith('will-quit', expect.any(Function));
  });

  it('should set quitting on before-quit', () => {
    registerAppEventListeners(windowManager, autoUpdater, configManager);

    const onCalls = (app.on as any).mock.calls;
    const beforeQuitCallback = onCalls.find((call: any[]) => call[0] === 'before-quit')[1];

    beforeQuitCallback();

    expect(windowManager.setQuitting).toHaveBeenCalledWith(true);
  });

  it('should quit app on window-all-closed for non-darwin', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });

    registerAppEventListeners(windowManager, autoUpdater, configManager);

    const onCalls = (app.on as any).mock.calls;
    const windowAllClosedCallback = onCalls.find((call: any[]) => call[0] === 'window-all-closed')[1];

    windowAllClosedCallback();

    expect(app.quit).toHaveBeenCalled();

    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it('should show window on second-instance', () => {
    registerAppEventListeners(windowManager, autoUpdater, configManager);

    const onCalls = (app.on as any).mock.calls;
    const secondInstanceCallback = onCalls.find((call: any[]) => call[0] === 'second-instance')[1];

    secondInstanceCallback();

    expect(windowManager.showWindow).toHaveBeenCalled();
  });

  it('should create window on activate if no window exists', () => {
    registerAppEventListeners(windowManager, autoUpdater, configManager);

    const onCalls = (app.on as any).mock.calls;
    const activateCallback = onCalls.find((call: any[]) => call[0] === 'activate')[1];

    activateCallback();

    expect(windowManager.createWindow).toHaveBeenCalled();
  });

  it('should unregister all shortcuts on will-quit', () => {
    registerAppEventListeners(windowManager, autoUpdater, configManager);

    const onCalls = (app.on as any).mock.calls;
    const willQuitCallback = onCalls.find((call: any[]) => call[0] === 'will-quit')[1];

    willQuitCallback();

    expect(globalShortcut.unregisterAll).toHaveBeenCalled();
    expect(autoUpdater.destroy).toHaveBeenCalled();
  });
});
