import { AppConfig } from '@shared/types/app-config.interface';
import { globalShortcut } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShortcutManagerService } from './shortcut-manager.service';
import { WindowManagerService } from './window-manager.service';

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

describe('ShortcutManagerService', () => {
  let shortcutManager: ShortcutManagerService;
  let windowManager: WindowManagerService;
  let mockConfig: AppConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      launchAtStartup: false,
      launchHidden: false,
      lastService: undefined,
      position: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      shortcuts: {
        globalShortcuts: {
          showHideApp: 'Meta+I',
        },
        internalShortcuts: {
          openSettings: 'Ctrl+,',
          quitApp: 'Ctrl+Q',
          previousService: 'Ctrl+Shift+Tab',
          nextService: 'Ctrl+Tab',
          services: {
            service1: 'Ctrl+1',
            service2: 'Ctrl+2',
          },
        },
      },
    };

    windowManager = new MockWindowManagerService() as any;
    shortcutManager = new ShortcutManagerService(mockConfig, windowManager);
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

    const result = shortcutManager.validateShortcut('Meta+I', 'otherId');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('INTERNAL_CONFLICT');
    expect(result.conflictedShortcut).toBe('showHideApp');
  });

  it('should register global shortcuts', () => {
    vi.spyOn(globalShortcut, 'register').mockReturnValue(true);

    shortcutManager.setupShortcuts();

    expect(globalShortcut.register).toHaveBeenCalledWith('Meta+I', expect.any(Function));
  });

  it('should unregister global shortcuts', () => {
    vi.spyOn(globalShortcut, 'unregister').mockImplementation(() => {});

    shortcutManager.refreshShortcuts();

    expect(globalShortcut.unregister).toHaveBeenCalledWith('Meta+I');
  });

  it('should handle show/hide app shortcut', () => {
    const mockWindow = {
      isVisible: vi.fn().mockReturnValue(true),
      isFocused: vi.fn().mockReturnValue(true),
    } as any;

    vi.spyOn(windowManager, 'getWindow').mockReturnValue(mockWindow);
    vi.spyOn(windowManager, 'hideWindow');
    vi.spyOn(windowManager, 'showWindow');

    shortcutManager.handleShortcut('Meta+I');

    expect(windowManager.hideWindow).toHaveBeenCalled();
  });

  it('should show window when hidden', () => {
    const mockWindow = {
      isVisible: vi.fn().mockReturnValue(false),
      isFocused: vi.fn().mockReturnValue(false),
    } as any;

    vi.spyOn(windowManager, 'getWindow').mockReturnValue(mockWindow);
    vi.spyOn(windowManager, 'showWindow');

    shortcutManager.handleShortcut('Meta+I');

    expect(windowManager.showWindow).toHaveBeenCalled();
  });

  it('should update config', () => {
    const newConfig: Partial<AppConfig> = {
      shortcuts: {
        ...mockConfig.shortcuts,
        globalShortcuts: {
          showHideApp: 'CmdOrCtrl+U',
        },
      },
    };

    shortcutManager.updateConfig({ ...mockConfig, ...newConfig } as AppConfig);

    expect(shortcutManager['appConfig'].shortcuts.globalShortcuts.showHideApp).toBe('CmdOrCtrl+U');
  });
});
