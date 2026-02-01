import { ipcMain } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DebugLoggerService } from '../services/debug-logger.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { setupDebugIPCHandlers } from './debug-ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../services/debug-logger.service');
vi.mock('../services/startup-manager.service');

describe('Debug IPC Handlers', () => {
  let debugLogger: DebugLoggerService;
  let startupManager: StartupManagerService;

  beforeEach(() => {
    vi.clearAllMocks();

    debugLogger = {
      log: vi.fn(),
    } as any;

    startupManager = {
      isEnabled: vi.fn(),
    } as any;
  });

  describe('log-debug handler', () => {
    it('should setup log-debug handler', () => {
      setupDebugIPCHandlers(debugLogger, startupManager, false);

      expect(ipcMain.handle).toHaveBeenCalledWith('log-debug', expect.any(Function));
    });

    it('should log debug messages', async () => {
      setupDebugIPCHandlers(debugLogger, startupManager, false);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'log-debug')?.[1] as any;
      await handler({}, 'Test message');

      expect(debugLogger.log).toHaveBeenCalledWith('Test message');
    });
  });

  describe('is-dev-mode handler', () => {
    it('should setup is-dev-mode handler', () => {
      setupDebugIPCHandlers(debugLogger, startupManager, false);

      expect(ipcMain.handle).toHaveBeenCalledWith('is-dev-mode', expect.any(Function));
    });

    it('should return false when serve is false', () => {
      setupDebugIPCHandlers(debugLogger, startupManager, false);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'is-dev-mode')?.[1] as any;
      const result = handler();

      expect(result).toBe(false);
    });

    it('should return true when serve is true', () => {
      setupDebugIPCHandlers(debugLogger, startupManager, true);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'is-dev-mode')?.[1] as any;
      const result = handler();

      expect(result).toBe(true);
    });
  });

  describe('is-startup-enabled handler', () => {
    it('should setup is-startup-enabled handler', () => {
      setupDebugIPCHandlers(debugLogger, startupManager, false);

      expect(ipcMain.handle).toHaveBeenCalledWith('is-startup-enabled', expect.any(Function));
    });

    it('should return startup status', () => {
      vi.mocked(startupManager.isEnabled).mockReturnValue(true);

      setupDebugIPCHandlers(debugLogger, startupManager, false);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'is-startup-enabled')?.[1] as any;
      const result = handler();

      expect(result).toBe(true);
      expect(startupManager.isEnabled).toHaveBeenCalled();
    });

    it('should return false when startup check fails', () => {
      vi.mocked(startupManager.isEnabled).mockImplementation(() => {
        throw new Error('Startup check error');
      });

      setupDebugIPCHandlers(debugLogger, startupManager, false);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'is-startup-enabled')?.[1] as any;
      const result = handler();

      expect(result).toBe(false);
    });
  });
});
