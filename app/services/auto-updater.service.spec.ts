import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdaterService } from './auto-updater.service';
import { ConfigManagerService } from './config-manager.service';

vi.mock('electron-updater', () => ({
  autoUpdater: {
    autoDownload: false,
    checkForUpdatesAndNotify: vi.fn(() => Promise.resolve()),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  app: {
    isPackaged: true,
  },
  BrowserWindow: vi.fn(),
}));

describe('AutoUpdaterService', () => {
  let autoUpdaterService: AutoUpdaterService;
  let mockWindow: BrowserWindow;
  let mockConfigManager: ConfigManagerService;
  const eventCallbacks: Map<string, Function> = new Map();

  beforeEach(() => {
    vi.clearAllMocks();
    eventCallbacks.clear();

    mockWindow = {
      webContents: {
        send: vi.fn(),
      },
    } as any;

    mockConfigManager = {
      getConfig: vi.fn(() => ({
        updateChannel: 'stable',
      })),
    } as any;

    (autoUpdater.on as any).mockImplementation((event: string, callback: Function) => {
      eventCallbacks.set(event, callback);
    });

    autoUpdaterService = new AutoUpdaterService(mockConfigManager);
  });

  it('should set autoDownload to false', () => {
    expect(autoUpdater.autoDownload).toBe(false);
  });

  it('should setup update downloaded event', () => {
    autoUpdaterService.setupAutoUpdater(mockWindow);

    expect(autoUpdater.on).toHaveBeenCalledWith('update-downloaded', expect.any(Function));
  });

  it('should send update_downloaded event to window', () => {
    autoUpdaterService.setupAutoUpdater(mockWindow);

    const updateDownloadedCallback = eventCallbacks.get('update-downloaded');
    updateDownloadedCallback?.();

    expect(mockWindow.webContents.send).toHaveBeenCalledWith('update_downloaded');
  });

  it('should check for updates', () => {
    autoUpdaterService.checkForUpdates();

    expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalled();
  });

  it('should handle check for updates error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (autoUpdater.checkForUpdatesAndNotify as any).mockRejectedValueOnce(new Error('Network error'));

    await autoUpdaterService.checkForUpdates();

    expect(consoleErrorSpy).toHaveBeenCalledWith('[AutoUpdate] Failed to check for updates:', 'Network error');
    consoleErrorSpy.mockRestore();
  });

  it('should setup error event handler', () => {
    autoUpdaterService.setupAutoUpdater(mockWindow);

    expect(autoUpdater.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should log error event', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    autoUpdaterService.setupAutoUpdater(mockWindow);

    const errorCallback = eventCallbacks.get('error');
    errorCallback?.(new Error('Test error'));

    expect(consoleErrorSpy).toHaveBeenCalledWith('[AutoUpdate] Error:', 'Test error');
    consoleErrorSpy.mockRestore();
  });

  it('should download update', () => {
    autoUpdaterService.downloadUpdate();

    expect(autoUpdater.downloadUpdate).toHaveBeenCalled();
  });

  it('should quit and install', () => {
    autoUpdaterService.quitAndInstall();

    expect(autoUpdater.quitAndInstall).toHaveBeenCalled();
  });
});
