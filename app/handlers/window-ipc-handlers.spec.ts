import { ipcMain, shell } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WindowManagerService } from '../services/window-manager.service';
import { setupWindowIPCHandlers } from './window-ipc-handlers';

vi.mock('electron', () => {
  return {
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
    },
    shell: {
      openExternal: vi.fn(),
    },
    app: {
      quit: vi.fn(),
    },
  };
});

vi.mock('../services/window-manager.service');

describe('Window IPC Handlers', () => {
  let windowManager: WindowManagerService;

  beforeEach(() => {
    vi.clearAllMocks();

    windowManager = {
      getWindow: vi.fn(),
      setQuitting: vi.fn(),
    } as any;
  });

  describe('quit-app handler', () => {
    it('should setup quit-app handler', () => {
      setupWindowIPCHandlers(windowManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('quit-app', expect.any(Function));
    });

    it('should set quitting flag and quit app', () => {
      setupWindowIPCHandlers(windowManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'quit-app')?.[1] as any;
      handler();

      expect(windowManager.setQuitting).toHaveBeenCalledWith(true);
    });
  });

  describe('open-external handler', () => {
    it('should setup open-external handler', () => {
      setupWindowIPCHandlers(windowManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('open-external', expect.any(Function));
    });

    it('should open external URL successfully', async () => {
      vi.mocked(shell.openExternal).mockResolvedValue(undefined);

      setupWindowIPCHandlers(windowManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'open-external')?.[1] as any;
      const result = await handler({}, 'https://example.com');

      expect(result).toBe(true);
      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });

    it('should handle URL opening errors', async () => {
      vi.mocked(shell.openExternal).mockRejectedValue(new Error('Failed to open'));

      setupWindowIPCHandlers(windowManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'open-external')?.[1] as any;
      const result = await handler({}, 'https://example.com');

      expect(result).toBe(false);
    });
  });

  describe('get-platform handler', () => {
    it('should setup get-platform handler', () => {
      setupWindowIPCHandlers(windowManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('get-platform', expect.any(Function));
    });

    it('should return current platform', () => {
      setupWindowIPCHandlers(windowManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'get-platform')?.[1] as any;
      const result = handler();

      expect(typeof result).toBe('string');
      expect(['win32', 'darwin', 'linux']).toContain(result);
    });
  });

  describe('dev-shortcut listener', () => {
    it('should setup dev-shortcut listener', () => {
      setupWindowIPCHandlers(windowManager);

      expect(ipcMain.on).toHaveBeenCalledWith('dev-shortcut', expect.any(Function));
    });

    it('should send open-dev-page message to window', () => {
      const mockWebContents = { send: vi.fn() };
      const mockWindow = { webContents: mockWebContents };
      vi.mocked(windowManager.getWindow).mockReturnValue(mockWindow as any);

      setupWindowIPCHandlers(windowManager);

      const listener = vi.mocked(ipcMain.on).mock.calls.find((call) => call[0] === 'dev-shortcut')?.[1] as any;
      if (listener) {
        listener();
        expect(mockWebContents.send).toHaveBeenCalledWith('open-dev-page');
      }
    });

    it('should handle missing window gracefully', () => {
      vi.mocked(windowManager.getWindow).mockReturnValue(null as any);

      setupWindowIPCHandlers(windowManager);

      const listener = vi.mocked(ipcMain.on).mock.calls.find((call) => call[0] === 'dev-shortcut')?.[1] as any;
      expect(() => listener()).not.toThrow();
    });
  });
});
