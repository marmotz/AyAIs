import { ipcMain } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { WindowManagerService } from '../services/window-manager.service';
import { setupUpdateIPCHandlers } from './update-ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn(),
  },
}));

vi.mock('../services/auto-updater.service');
vi.mock('../services/window-manager.service');

describe('Update IPC Handlers', () => {
  let autoUpdater: AutoUpdaterService;
  let windowManager: WindowManagerService;

  beforeEach(() => {
    vi.clearAllMocks();

    autoUpdater = {
      downloadUpdate: vi.fn(),
      quitAndInstall: vi.fn(),
    } as any;

    windowManager = {
      getWindow: vi.fn(),
    } as any;
  });

  describe('start_download listener', () => {
    it('should setup start_download listener', () => {
      setupUpdateIPCHandlers(autoUpdater, windowManager);

      expect(ipcMain.on).toHaveBeenCalledWith('start_download', expect.any(Function));
    });

    it('should call downloadUpdate', async () => {
      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const listener = vi.mocked(ipcMain.on).mock.calls.find((call) => call[0] === 'start_download')?.[1] as any;
      if (listener) {
        await listener();
        expect(autoUpdater.downloadUpdate).toHaveBeenCalled();
      }
    });

    it('should handle download errors', async () => {
      const mockError = new Error('Download failed');
      vi.mocked(autoUpdater.downloadUpdate).mockRejectedValue(mockError);
      const mockWebContents = { send: vi.fn() };
      const mockWindow = { webContents: mockWebContents };
      vi.mocked(windowManager.getWindow).mockReturnValue(mockWindow as any);

      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const listener = vi.mocked(ipcMain.on).mock.calls.find((call) => call[0] === 'start_download')?.[1] as any;
      if (listener) {
        await listener();
        expect(mockWebContents.send).toHaveBeenCalledWith('update_download_failed', 'Download failed');
      }
    });
  });

  describe('restart_app listener', () => {
    it('should setup restart_app listener', () => {
      setupUpdateIPCHandlers(autoUpdater, windowManager);

      expect(ipcMain.on).toHaveBeenCalledWith('restart_app', expect.any(Function));
    });

    it('should call quitAndInstall', () => {
      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const listener = vi.mocked(ipcMain.on).mock.calls.find((call) => call[0] === 'restart_app')?.[1] as any;
      if (listener) {
        listener();
        expect(autoUpdater.quitAndInstall).toHaveBeenCalled();
      }
    });
  });

  describe('simulate-update-available listener', () => {
    it('should setup simulate-update-available listener', () => {
      setupUpdateIPCHandlers(autoUpdater, windowManager);

      expect(ipcMain.on).toHaveBeenCalledWith('simulate-update-available', expect.any(Function));
    });

    it('should send update_available event to window', () => {
      const mockWebContents = { send: vi.fn() };
      const mockWindow = { webContents: mockWebContents };
      vi.mocked(windowManager.getWindow).mockReturnValue(mockWindow as any);

      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const listener = vi
        .mocked(ipcMain.on)
        .mock.calls.find((call) => call[0] === 'simulate-update-available')?.[1] as any;
      if (listener) {
        listener();
        expect(mockWebContents.send).toHaveBeenCalledWith('update_available');
      }
    });

    it('should handle missing window gracefully', () => {
      vi.mocked(windowManager.getWindow).mockReturnValue(null as any);

      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const listener = vi
        .mocked(ipcMain.on)
        .mock.calls.find((call) => call[0] === 'simulate-update-available')?.[1] as any;
      expect(() => listener()).not.toThrow();
    });
  });

  describe('simulate-update-downloaded listener', () => {
    it('should setup simulate-update-downloaded listener', () => {
      setupUpdateIPCHandlers(autoUpdater, windowManager);

      expect(ipcMain.on).toHaveBeenCalledWith('simulate-update-downloaded', expect.any(Function));
    });

    it('should send update_downloaded event to window', () => {
      const mockWebContents = { send: vi.fn() };
      const mockWindow = { webContents: mockWebContents };
      vi.mocked(windowManager.getWindow).mockReturnValue(mockWindow as any);

      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const listener = vi
        .mocked(ipcMain.on)
        .mock.calls.find((call) => call[0] === 'simulate-update-downloaded')?.[1] as any;
      if (listener) {
        listener();
        expect(mockWebContents.send).toHaveBeenCalledWith('update_downloaded');
      }
    });

    it('should handle missing window gracefully', () => {
      vi.mocked(windowManager.getWindow).mockReturnValue(null as any);

      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const listener = vi
        .mocked(ipcMain.on)
        .mock.calls.find((call) => call[0] === 'simulate-update-downloaded')?.[1] as any;
      expect(() => listener()).not.toThrow();
    });
  });

  describe('check-for-updates handler', () => {
    it('should setup check-for-updates handler', () => {
      setupUpdateIPCHandlers(autoUpdater, windowManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('check-for-updates', expect.any(Function));
    });

    it('should call checkForUpdates', async () => {
      const mockCheckForUpdates = vi.fn().mockResolvedValue(undefined);
      (autoUpdater as any).checkForUpdates = mockCheckForUpdates;

      setupUpdateIPCHandlers(autoUpdater, windowManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'check-for-updates')?.[1] as any;
      if (handler) {
        await handler();
        expect(mockCheckForUpdates).toHaveBeenCalled();
      }
    });
  });
});
