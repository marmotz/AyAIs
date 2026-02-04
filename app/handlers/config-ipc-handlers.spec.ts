import { ipcMain } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigManagerService } from '../services/config-manager.service';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { WindowManagerService } from '../services/window-manager.service';
import { MOCK_CONFIG } from '../tests/test-config';
import { setupConfigIPCHandlers } from './config-ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  app: {
    getVersion: vi.fn(() => '0.3.0-beta.1'),
  },
}));

vi.mock('../services/config-manager.service');
vi.mock('../services/window-manager.service');
vi.mock('../services/shortcut-manager.service');
vi.mock('../services/startup-manager.service');

describe('Config IPC Handlers', () => {
  let configManager: ConfigManagerService;
  let windowManager: WindowManagerService;
  let shortcutManager: ShortcutManagerService;
  let startupManager: StartupManagerService;

  beforeEach(() => {
    vi.clearAllMocks();

    configManager = {
      getConfig: vi.fn(() => ({ ...MOCK_CONFIG })),
      updateConfig: vi.fn(),
      saveConfig: vi.fn(),
    } as any;

    windowManager = {
      updateConfig: vi.fn(),
    } as any;

    shortcutManager = {
      updateConfig: vi.fn(),
      refreshShortcuts: vi.fn(),
    } as any;

    startupManager = {
      sync: vi.fn(),
    } as any;
  });

  describe('get-last-service handler', () => {
    it('should setup get-last-service handler', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('get-last-service', expect.any(Function));
    });

    it('should return last service from config', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'get-last-service')?.[1] as any;
      expect(handler()).toBe('chatgpt');
    });

    it('should handle errors and return null', () => {
      vi.mocked(configManager.getConfig).mockImplementation(() => {
        throw new Error('Config error');
      });

      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'get-last-service')?.[1] as any;
      expect(handler()).toBeNull();
    });
  });

  describe('get-app-version handler', () => {
    it('should setup get-app-version handler', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('get-app-version', expect.any(Function));
    });

    it('should return app version', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'get-app-version')?.[1] as any;
      const version = handler();
      expect(version).toBe('0.3.0-beta.1');
    });
  });

  describe('save-last-service handler', () => {
    it('should setup save-last-service handler', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('save-last-service', expect.any(Function));
    });

    it('should save last service to config', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'save-last-service')?.[1] as any;
      handler({}, 'claude');
      expect(configManager.updateConfig).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      vi.mocked(configManager.updateConfig).mockImplementation(() => {
        throw new Error('Update error');
      });

      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'save-last-service')?.[1] as any;
      expect(() => handler({}, 'claude')).not.toThrow();
    });
  });

  describe('get-app-config handler', () => {
    it('should setup get-app-config handler', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('get-app-config', expect.any(Function));
    });

    it('should return entire app config', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'get-app-config')?.[1] as any;
      const result = handler();
      expect(result).toEqual(MOCK_CONFIG);
    });
  });

  describe('save-app-config handler', () => {
    it('should setup save-app-config handler', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      expect(ipcMain.handle).toHaveBeenCalledWith('save-app-config', expect.any(Function));
    });

    it('should merge and save new config', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'save-app-config')?.[1] as any;
      const newConfig = { launchHidden: true };
      handler({}, newConfig);

      expect(configManager.updateConfig).toHaveBeenCalled();
    });

    it('should update shortcuts when shortcuts config changes', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'save-app-config')?.[1] as any;
      const newConfig = {
        shortcuts: {
          globalShortcuts: { showHideApp: 'Meta+J' },
          internalShortcuts: MOCK_CONFIG.shortcuts.internalShortcuts,
        },
      };
      handler({}, newConfig);

      expect(shortcutManager.updateConfig).toHaveBeenCalled();
      expect(shortcutManager.refreshShortcuts).toHaveBeenCalled();
    });

    it('should sync startup manager when launchAtStartup changes', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'save-app-config')?.[1] as any;
      const newConfig = { launchAtStartup: true };
      handler({}, newConfig);

      expect(startupManager.sync).toHaveBeenCalledWith(true);
    });

    it('should update window manager config', () => {
      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'save-app-config')?.[1] as any;
      handler({}, { launchHidden: true });

      expect(windowManager.updateConfig).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      vi.mocked(configManager.updateConfig).mockImplementation(() => {
        throw new Error('Update error');
      });

      setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'save-app-config')?.[1] as any;
      expect(() => handler({}, { launchHidden: true })).not.toThrow();
    });
  });
});
