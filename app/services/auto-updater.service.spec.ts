import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdaterService } from './auto-updater.service';
import { ConfigManagerService } from './config-manager.service';

vi.mock('electron-updater', () => ({
  autoUpdater: {
    autoDownload: false,
    checkForUpdates: vi.fn(() => Promise.resolve({ isUpdateAvailable: false })),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  app: {
    get isPackaged() {
      return mockIsPackaged;
    },
  },
  BrowserWindow: vi.fn(),
}));

let mockIsPackaged = true;

describe('AutoUpdaterService', () => {
  let autoUpdaterService: AutoUpdaterService;
  let mockWindow: BrowserWindow;
  let mockConfigManager: ConfigManagerService;
  const eventCallbacks: Map<string, Function> = new Map();

  beforeEach(() => {
    vi.clearAllMocks();
    eventCallbacks.clear();
    mockIsPackaged = true;

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

  it('should send update_not_available when no update available', async () => {
    (autoUpdater.checkForUpdates as any).mockResolvedValue({ isUpdateAvailable: false });
    autoUpdaterService.setupAutoUpdater(mockWindow);

    await autoUpdaterService.checkForUpdates();

    expect(mockWindow.webContents.send).toHaveBeenCalledWith('update_not_available');
  });

  it('should check for updates', () => {
    autoUpdaterService.checkForUpdates();

    expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
  });

  it('should send update_available when update is available', async () => {
    (autoUpdater.checkForUpdates as any).mockResolvedValue({ isUpdateAvailable: true });
    autoUpdaterService.setupAutoUpdater(mockWindow);

    await autoUpdaterService.checkForUpdates();

    expect(mockWindow.webContents.send).toHaveBeenCalledWith('update_available');
  });

  it('should handle check for updates error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (autoUpdater.checkForUpdates as any).mockRejectedValueOnce(new Error('Network error'));

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

  it('should start periodic update check when setupAutoUpdater is called', () => {
    vi.useFakeTimers();

    autoUpdaterService.setupAutoUpdater(mockWindow);

    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('should clear interval when destroy is called', () => {
    vi.useFakeTimers();

    autoUpdaterService.setupAutoUpdater(mockWindow);
    autoUpdaterService.destroy();

    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should not start periodic check when updater is disabled', () => {
    mockIsPackaged = false;

    vi.useFakeTimers();

    const newService = new AutoUpdaterService(mockConfigManager);
    newService.setupAutoUpdater(mockWindow);

    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
