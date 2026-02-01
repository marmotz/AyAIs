import { ipcMain } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { setupShortcutIPCHandlers } from './shortcut-ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('../services/shortcut-manager.service');

describe('Shortcut IPC Handlers', () => {
  let shortcutManager: ShortcutManagerService;

  beforeEach(() => {
    vi.clearAllMocks();

    shortcutManager = {
      validateShortcut: vi.fn(),
      handleShortcut: vi.fn(),
      refreshShortcuts: vi.fn(),
    } as any;
  });

  describe('validate-global-shortcut handler', () => {
    it('should setup validate-global-shortcut handler', () => {
      setupShortcutIPCHandlers(shortcutManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('validate-global-shortcut', expect.any(Function));
    });

    it('should validate shortcut successfully', async () => {
      vi.mocked(shortcutManager.validateShortcut).mockReturnValue({ isValid: true });

      setupShortcutIPCHandlers(shortcutManager);

      const handler = vi
        .mocked(ipcMain.handle)
        .mock.calls.find((call) => call[0] === 'validate-global-shortcut')?.[1] as any;
      const result = await handler({}, 'Ctrl+Shift+K');

      expect(result).toEqual({ isValid: true });
      expect(shortcutManager.validateShortcut).toHaveBeenCalledWith('Ctrl+Shift+K', undefined);
    });

    it('should validate shortcut with excludeId', async () => {
      vi.mocked(shortcutManager.validateShortcut).mockReturnValue({ isValid: false, error: 'EXTERNAL_CONFLICT' });

      setupShortcutIPCHandlers(shortcutManager);

      const handler = vi
        .mocked(ipcMain.handle)
        .mock.calls.find((call) => call[0] === 'validate-global-shortcut')?.[1] as any;
      const result = await handler({}, 'Ctrl+Q', 'quitApp');

      expect(result).toEqual({ isValid: false, error: 'EXTERNAL_CONFLICT' });
      expect(shortcutManager.validateShortcut).toHaveBeenCalledWith('Ctrl+Q', 'quitApp');
    });

    it('should handle validation errors', async () => {
      vi.mocked(shortcutManager.validateShortcut).mockImplementation(() => {
        throw new Error('Validation error');
      });

      setupShortcutIPCHandlers(shortcutManager);

      const handler = vi
        .mocked(ipcMain.handle)
        .mock.calls.find((call) => call[0] === 'validate-global-shortcut')?.[1] as any;
      const result = await handler({}, 'Invalid');

      expect(result).toEqual({ isValid: false, error: 'INVALID_FORMAT' });
    });
  });

  describe('handle-shortcut handler', () => {
    it('should setup handle-shortcut handler', () => {
      setupShortcutIPCHandlers(shortcutManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('handle-shortcut', expect.any(Function));
    });

    it('should handle shortcut', async () => {
      setupShortcutIPCHandlers(shortcutManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'handle-shortcut')?.[1] as any;
      await handler({}, 'Ctrl+Shift+K');

      expect(shortcutManager.handleShortcut).toHaveBeenCalledWith('Ctrl+Shift+K');
    });

    it('should handle shortcut errors gracefully', async () => {
      vi.mocked(shortcutManager.handleShortcut).mockImplementation(() => {
        throw new Error('Handle error');
      });

      setupShortcutIPCHandlers(shortcutManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'handle-shortcut')?.[1] as any;
      expect(async () => await handler({}, 'Ctrl+Q')).not.toThrow();
    });
  });

  describe('unregister-global-shortcuts handler', () => {
    it('should setup unregister-global-shortcuts handler', () => {
      setupShortcutIPCHandlers(shortcutManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('unregister-global-shortcuts', expect.any(Function));
    });

    it('should call refreshShortcuts', () => {
      setupShortcutIPCHandlers(shortcutManager);

      const handler = vi
        .mocked(ipcMain.handle)
        .mock.calls.find((call) => call[0] === 'unregister-global-shortcuts')?.[1] as any;
      handler();

      expect(shortcutManager.refreshShortcuts).toHaveBeenCalled();
    });
  });

  describe('register-global-shortcuts handler', () => {
    it('should setup register-global-shortcuts handler', () => {
      setupShortcutIPCHandlers(shortcutManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('register-global-shortcuts', expect.any(Function));
    });

    it('should call refreshShortcuts', () => {
      setupShortcutIPCHandlers(shortcutManager);

      const handler = vi
        .mocked(ipcMain.handle)
        .mock.calls.find((call) => call[0] === 'register-global-shortcuts')?.[1] as any;
      handler();

      expect(shortcutManager.refreshShortcuts).toHaveBeenCalled();
    });
  });
});
