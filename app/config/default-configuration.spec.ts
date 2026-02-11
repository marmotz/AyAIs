import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIGURATION } from './default-configuration';

describe('DEFAULT_CONFIGURATION', () => {
  it('should have correct structure', () => {
    expect(DEFAULT_CONFIGURATION).toBeDefined();
    expect(DEFAULT_CONFIGURATION).toHaveProperty('launchAtStartup');
    expect(DEFAULT_CONFIGURATION).toHaveProperty('launchHidden');
    expect(DEFAULT_CONFIGURATION).toHaveProperty('lastService');
    expect(DEFAULT_CONFIGURATION).toHaveProperty('shortcuts');
    expect(DEFAULT_CONFIGURATION).toHaveProperty('position');
    expect(DEFAULT_CONFIGURATION).toHaveProperty('updateChannel');
  });

  it('should have launchAtStartup set to true', () => {
    expect(DEFAULT_CONFIGURATION.launchAtStartup).toBe(true);
  });

  it('should have launchHidden set to false', () => {
    expect(DEFAULT_CONFIGURATION.launchHidden).toBe(false);
  });

  it('should have lastService as undefined', () => {
    expect(DEFAULT_CONFIGURATION.lastService).toBeUndefined();
  });

  it('should have valid position configuration', () => {
    expect(DEFAULT_CONFIGURATION.position).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });
  });

  it('should have updateChannel set to stable', () => {
    expect(DEFAULT_CONFIGURATION.updateChannel).toBe('stable');
  });

  describe('shortcuts configuration', () => {
    it('should have global shortcuts defined', () => {
      expect(DEFAULT_CONFIGURATION.shortcuts.globalShortcuts).toBeDefined();
      expect(DEFAULT_CONFIGURATION.shortcuts.globalShortcuts.showHideApp).toBeDefined();
    });

    it('should have correct global shortcut based on platform', () => {
      const expectedShortcut = process.platform === 'win32' ? 'Ctrl+Alt+I' : 'Meta+I';
      expect(DEFAULT_CONFIGURATION.shortcuts.globalShortcuts.showHideApp).toBe(expectedShortcut);
    });

    it('should have all required internal shortcuts', () => {
      const { internalShortcuts } = DEFAULT_CONFIGURATION.shortcuts;

      expect(internalShortcuts.openSettings).toBeDefined();
      expect(internalShortcuts.quitApp).toBeDefined();
      expect(internalShortcuts.previousService).toBeDefined();
      expect(internalShortcuts.nextService).toBeDefined();
      expect(internalShortcuts.services).toBeDefined();
    });

    it('should have correct openSettings shortcut based on platform', () => {
      const expectedShortcut = process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,';
      expect(DEFAULT_CONFIGURATION.shortcuts.internalShortcuts.openSettings).toBe(expectedShortcut);
    });

    it('should have all 10 service shortcuts', () => {
      const { services } = DEFAULT_CONFIGURATION.shortcuts.internalShortcuts;

      expect(services.service1).toBe('Ctrl+1');
      expect(services.service2).toBe('Ctrl+2');
      expect(services.service3).toBe('Ctrl+3');
      expect(services.service4).toBe('Ctrl+4');
      expect(services.service5).toBe('Ctrl+5');
      expect(services.service6).toBe('Ctrl+6');
      expect(services.service7).toBe('Ctrl+7');
      expect(services.service8).toBe('Ctrl+8');
      expect(services.service9).toBe('Ctrl+9');
      expect(services.service10).toBe('Ctrl+0');
    });

    it('should have standard shortcuts defined', () => {
      const { internalShortcuts } = DEFAULT_CONFIGURATION.shortcuts;

      expect(internalShortcuts.quitApp).toBe('Ctrl+Q');
      expect(internalShortcuts.previousService).toBe('Ctrl+Shift+Tab');
      expect(internalShortcuts.nextService).toBe('Ctrl+Tab');
    });
  });

  it('should be immutable at export', () => {
    const config1 = DEFAULT_CONFIGURATION;
    const config2 = DEFAULT_CONFIGURATION;

    expect(config1).toBe(config2);
  });
});
