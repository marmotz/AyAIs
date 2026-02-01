import { app } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StartupManagerService } from './startup-manager.service';

vi.mock('electron', () => ({
  app: {
    getLoginItemSettings: vi.fn(),
    setLoginItemSettings: vi.fn(),
  },
}));

describe('StartupManagerService', () => {
  let startupManager: StartupManagerService;

  beforeEach(() => {
    vi.clearAllMocks();
    startupManager = new StartupManagerService();
  });

  it('should return true when startup is enabled', () => {
    vi.spyOn(app, 'getLoginItemSettings').mockReturnValue({
      openAtLogin: true,
    } as any);

    const isEnabled = startupManager.isEnabled();

    expect(isEnabled).toBe(true);
  });

  it('should return false when startup is disabled', () => {
    vi.spyOn(app, 'getLoginItemSettings').mockReturnValue({
      openAtLogin: false,
    } as any);

    const isEnabled = startupManager.isEnabled();

    expect(isEnabled).toBe(false);
  });

  it('should enable startup', () => {
    const setLoginItemSpy = vi.spyOn(app, 'setLoginItemSettings');

    startupManager.enable();

    expect(setLoginItemSpy).toHaveBeenCalledWith({
      openAtLogin: true,
      args: [],
    });
  });

  it('should disable startup', () => {
    const setLoginItemSpy = vi.spyOn(app, 'setLoginItemSettings');

    startupManager.disable();

    expect(setLoginItemSpy).toHaveBeenCalledWith({
      openAtLogin: false,
      args: [],
    });
  });

  it('should enable startup when currently disabled and should be enabled', () => {
    vi.spyOn(app, 'getLoginItemSettings').mockReturnValue({
      openAtLogin: false,
    } as any);
    const setLoginItemSpy = vi.spyOn(app, 'setLoginItemSettings');

    startupManager.sync(true);

    expect(setLoginItemSpy).toHaveBeenCalledWith({
      openAtLogin: true,
      args: [],
    });
  });

  it('should disable startup when currently enabled and should be disabled', () => {
    vi.spyOn(app, 'getLoginItemSettings').mockReturnValue({
      openAtLogin: true,
    } as any);
    const setLoginItemSpy = vi.spyOn(app, 'setLoginItemSettings');

    startupManager.sync(false);

    expect(setLoginItemSpy).toHaveBeenCalledWith({
      openAtLogin: false,
      args: [],
    });
  });

  it('should not change startup settings when already in correct state', () => {
    vi.spyOn(app, 'getLoginItemSettings').mockReturnValue({
      openAtLogin: true,
    } as any);
    const setLoginItemSpy = vi.spyOn(app, 'setLoginItemSettings');

    startupManager.sync(true);

    expect(setLoginItemSpy).not.toHaveBeenCalled();
  });

  it('should handle errors when checking startup status', () => {
    vi.spyOn(app, 'getLoginItemSettings').mockImplementation(() => {
      throw new Error('Error');
    });

    const isEnabled = startupManager.isEnabled();

    expect(isEnabled).toBe(false);
  });
});
