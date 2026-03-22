import { AppConfig } from '@shared/types/app-config.interface';
import { globalShortcut } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_CONFIG_WITH_SERVICES } from '../tests/test-config';
import { ShortcutManagerService } from './shortcut-manager.service';
import { WindowManagerService } from './window-manager.service';
import { ConfigManagerService } from './config-manager.service';

vi.mock('electron', () => ({
  globalShortcut: {
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

class MockWindowManagerService {
  public getWindow = vi.fn();
  public hideWindow = vi.fn();
  public showWindow = vi.fn();
}

vi.mock('./window-manager.service', () => ({
  WindowManagerService: MockWindowManagerService,
}));

class MockConfigManagerService {
  public getConfig = vi.fn().mockReturnValue(MOCK_CONFIG_WITH_SERVICES);
  public saveConfig = vi.fn();
}

describe('ShortcutManagerService', () => {
  let shortcutManager: ShortcutManagerService;
  let windowManager: WindowManagerService;
  let configManager: ConfigManagerService;

  beforeEach(() => {
    vi.clearAllMocks();

    configManager = new MockConfigManagerService() as any;
    windowManager = new MockWindowManagerService() as any;
    shortcutManager = new ShortcutManagerService(configManager, windowManager);
  });

  it('should validate empty shortcut', () => {
    const result = shortcutManager.validateShortcut('');

    expect(result.isValid).toBe(true);
  });

  it('should validate valid shortcut', () => {
    vi.spyOn(globalShortcut, 'register').mockReturnValue(true);
    vi.spyOn(globalShortcut, 'unregister').mockImplementation(() => {});

    const result = shortcutManager.validateShortcut('CmdOrCtrl+I');

    expect(result.isValid).toBe(true);
  });

  it('should detect external conflict', () => {
    vi.spyOn(globalShortcut, 'register').mockReturnValue(false);

    const result = shortcutManager.validateShortcut('CmdOrCtrl+I');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('EXTERNAL_CONFLICT');
  });

  it('should detect internal conflict', () => {
    vi.spyOn(globalShortcut, 'register').mockReturnValue(true);
    vi.spyOn(globalShortcut, 'unregister').mockImplementation(() => {});

    const defaultShortcut = process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I';
    const result = shortcutManager.validateShortcut(defaultShortcut, 'otherId');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('INTERNAL_CONFLICT');
    expect(result.conflictedShortcut).toBe('showHideApp');
  });

  it('should register global shortcuts', () => {
    vi.spyOn(globalShortcut, 'register').mockReturnValue(true);

    shortcutManager.setupShortcuts();

    const defaultShortcut = process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I';
    expect(globalShortcut.register).toHaveBeenCalledWith(defaultShortcut, expect.any(Function));
  });

  it('should unregister global shortcuts', () => {
    vi.spyOn(globalShortcut, 'unregister').mockImplementation(() => {});

    shortcutManager.refreshShortcuts();

    const defaultShortcut = process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I';
    expect(globalShortcut.unregister).toHaveBeenCalledWith(defaultShortcut);
  });

  it('should handle show/hide app shortcut', () => {
    const mockWindow = {
      isVisible: vi.fn().mockReturnValue(true),
      isFocused: vi.fn().mockReturnValue(true),
    } as any;

    vi.spyOn(windowManager, 'getWindow').mockReturnValue(mockWindow);
    vi.spyOn(windowManager, 'hideWindow');
    vi.spyOn(windowManager, 'showWindow');

    const defaultShortcut = process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I';
    shortcutManager.handleShortcut(defaultShortcut);

    expect(windowManager.hideWindow).toHaveBeenCalled();
  });

  it('should show window when hidden', () => {
    const mockWindow = {
      isVisible: vi.fn().mockReturnValue(false),
      isFocused: vi.fn().mockReturnValue(false),
    } as any;

    vi.spyOn(windowManager, 'getWindow').mockReturnValue(mockWindow);
    vi.spyOn(windowManager, 'showWindow');

    const defaultShortcut = process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I';
    shortcutManager.handleShortcut(defaultShortcut);

    expect(windowManager.showWindow).toHaveBeenCalled();
  });

  it('should update config', () => {
    const newConfig: Partial<AppConfig> = {
      shortcuts: {
        ...MOCK_CONFIG_WITH_SERVICES.shortcuts,
        globalShortcuts: {
          showHideApp: 'CmdOrCtrl+U',
        },
      },
    };

    shortcutManager.updateConfig({ ...MOCK_CONFIG_WITH_SERVICES, ...newConfig } as AppConfig);

    expect(shortcutManager['appConfig'].shortcuts.globalShortcuts.showHideApp).toBe('CmdOrCtrl+U');
  });
});
