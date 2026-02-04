import { TestBed } from '@angular/core/testing';
import { MOCK_CONFIG_WITH_SERVICES } from '@app-tests/test-config';
import { Shortcut } from '@app/settings/settings-shortcuts/shortcut.model';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShortcutManagerService } from './shortcut-manager.service';

describe('ShortcutManagerService', () => {
  let service: ShortcutManagerService;
  const saveAppConfigSpy = vi.fn().mockResolvedValue(undefined);
  const validateGlobalShortcutSpy = vi.fn().mockResolvedValue({ isValid: true });
  const unregisterGlobalShortcutsSpy = vi.fn().mockResolvedValue(undefined);
  const registerGlobalShortcutsSpy = vi.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    (window as any).electronAPI = {
      getAppConfig: () => Promise.resolve({ ...MOCK_CONFIG_WITH_SERVICES }),
      saveAppConfig: saveAppConfigSpy,
      validateGlobalShortcut: validateGlobalShortcutSpy,
      getPlatform: () => Promise.resolve(process.platform),
      unregisterGlobalShortcuts: unregisterGlobalShortcutsSpy,
      registerGlobalShortcuts: registerGlobalShortcutsSpy,
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({});
    service = TestBed.inject(ShortcutManagerService);
  });

  afterEach(() => {
    // Clear any pending timers to prevent logDebug errors after tests
    vi.clearAllTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadShortcuts', () => {
    it('should load shortcuts from config', async () => {
      service.loadShortcuts();

      await TestBed.flushEffects();

      const globalShortcuts = service.globalShortcuts();
      const internalShortcuts = service.internalShortcuts();

      expect(globalShortcuts.length).toBe(1);
      expect(globalShortcuts[0].id).toBe('showHideApp');
      expect(globalShortcuts[0].value).toBe(process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I');

      expect(internalShortcuts.length).toBe(14);
      expect(internalShortcuts[0].id).toBe('openSettings');
      expect(internalShortcuts[0].value).toBe(process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,');
    });

    it('should set empty shortcuts when config has no shortcuts', async () => {
      (window as any).electronAPI.getAppConfig = () =>
        Promise.resolve({
          shortcuts: null,
        });

      service.loadShortcuts();

      await TestBed.flushEffects();

      expect(service.globalShortcuts().length).toBeGreaterThan(0);
      expect(service.globalShortcuts()[0].value).toBe('');
      expect(service.internalShortcuts()[0].value).toBe('');
    });

    it('should set empty shortcuts when getAppConfig fails', async () => {
      (window as any).electronAPI.getAppConfig = () => Promise.reject(new Error('Failed'));

      service.loadShortcuts();

      await new Promise((resolve) => setTimeout(resolve, 0));
      await TestBed.flushEffects();

      expect(service.globalShortcuts().length).toBeGreaterThan(0);
      expect(service.globalShortcuts()[0].value).toBe('');
      expect(service.internalShortcuts()[0].value).toBe('');
    });
  });

  describe('setEmptyShortcuts', () => {
    it('should set empty values for all shortcuts', () => {
      service.setEmptyShortcuts();

      const globalShortcuts = service.globalShortcuts();
      const internalShortcuts = service.internalShortcuts();

      globalShortcuts.forEach((shortcut) => {
        expect(shortcut.value).toBe('');
      });

      internalShortcuts.forEach((shortcut) => {
        expect(shortcut.value).toBe('');
      });
    });
  });

  describe('startEditing', () => {
    it('should set editing shortcut id and temp value', async () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
      };

      await service.startEditing(shortcut);

      expect(service.editingShortcutId()).toBe('test');
      expect(service.tempShortcutValue()).toBe('Ctrl+T');
    });

    it('should unregister global shortcuts when editing global shortcut', async () => {
      const shortcut: Shortcut = {
        id: 'showHideApp',
        label: 'Show/Hide App',
        value: 'Ctrl+Shift+I',
      };

      await service.startEditing(shortcut);

      expect(unregisterGlobalShortcutsSpy).toHaveBeenCalled();
    });

    it('should not unregister global shortcuts when editing internal shortcut', async () => {
      unregisterGlobalShortcutsSpy.mockClear();
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
      };

      await service.startEditing(shortcut);

      expect(unregisterGlobalShortcutsSpy).not.toHaveBeenCalled();
    });
  });

  describe('cancelEditing', () => {
    it('should clear editing state', async () => {
      service.editingShortcutId.set('test');
      service.tempShortcutValue.set('Ctrl+T');

      await service.cancelEditing();

      expect(service.editingShortcutId()).toBeNull();
      expect(service.tempShortcutValue()).toBe('');
    });

    it('should re-register global shortcuts when canceling global shortcut editing', async () => {
      service.editingShortcutId.set('showHideApp');
      service.tempShortcutValue.set('Ctrl+Shift+I');

      await service.cancelEditing();

      expect(registerGlobalShortcutsSpy).toHaveBeenCalled();
    });

    it('should not re-register global shortcuts when canceling internal shortcut editing', async () => {
      registerGlobalShortcutsSpy.mockClear();
      service.editingShortcutId.set('test');
      service.tempShortcutValue.set('Ctrl+T');

      await service.cancelEditing();

      expect(registerGlobalShortcutsSpy).not.toHaveBeenCalled();
    });
  });

  describe('getKeyDisplayName', () => {
    it('should extract digit from Digit code', () => {
      const event = new KeyboardEvent('keydown', { key: '1' });
      Object.defineProperty(event, 'code', { value: 'Digit1' });

      const result = service.getKeyDisplayName(event);

      expect(result).toBe('1');
    });

    it('should return key for Key code', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      Object.defineProperty(event, 'code', { value: 'KeyA' });

      const result = service.getKeyDisplayName(event);

      expect(result).toBe('a');
    });

    it('should prefix with Num for Numpad code', () => {
      const event = new KeyboardEvent('keydown', { key: '1' });
      Object.defineProperty(event, 'code', { value: 'Numpad1' });

      const result = service.getKeyDisplayName(event);

      expect(result).toBe('Num1');
    });

    it('should return code for F keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'F1' });
      Object.defineProperty(event, 'code', { value: 'F1' });

      const result = service.getKeyDisplayName(event);

      expect(result).toBe('F1');
    });

    it('should return key for other keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(event, 'code', { value: 'Escape' });

      const result = service.getKeyDisplayName(event);

      expect(result).toBe('Escape');
    });
  });

  describe('handleKeydown', () => {
    beforeEach(() => {
      service.loadShortcuts();
      TestBed.flushEffects();
    });

    it('should not handle keydown when not editing', () => {
      const event = new KeyboardEvent('keydown', { key: 'A', ctrlKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      service.handleEditingKeydown(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(service.tempShortcutValue()).toBe('');
    });

    it('should cancel editing on Escape key', async () => {
      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      service.handleEditingKeydown(event);

      expect(service.editingShortcutId()).toBeNull();
    });

    it('should save shortcut on Enter key', async () => {
      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);
      service.tempShortcutValue.set('Ctrl+A');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      service.handleEditingKeydown(event);

      await TestBed.flushEffects();

      expect(service.editingShortcutId()).toBeNull();
      expect(saveAppConfigSpy).toHaveBeenCalled();
    });

    it('should build shortcut string with Ctrl', async () => {
      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);

      const event = new KeyboardEvent('keydown', { key: 'A', ctrlKey: true });
      Object.defineProperty(event, 'code', { value: 'KeyA' });
      service.handleEditingKeydown(event);

      expect(service.tempShortcutValue()).toBe('Ctrl+A');
    });

    it('should build shortcut string with Ctrl and Shift', async () => {
      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'A',
        ctrlKey: true,
        shiftKey: true,
      });
      Object.defineProperty(event, 'code', { value: 'KeyA' });
      service.handleEditingKeydown(event);

      expect(service.tempShortcutValue()).toBe('Ctrl+Shift+A');
    });

    it('should use Cmd on Mac when meta key is pressed', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      (window as any).electronAPI.getPlatform = () => Promise.resolve('darwin');
      const macService = TestBed.inject(ShortcutManagerService);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const shortcut: Shortcut = { id: 'test', label: 'Test', value: '' };
      await macService.startEditing(shortcut);

      const event = new KeyboardEvent('keydown', { key: 'A', metaKey: true });
      Object.defineProperty(event, 'code', { value: 'KeyA' });
      macService.handleEditingKeydown(event);

      expect(macService.tempShortcutValue()).toBe('Cmd+A');
    });

    it('should use Opt on Mac when alt key is pressed', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      (window as any).electronAPI.getPlatform = () => Promise.resolve('darwin');
      const macService = TestBed.inject(ShortcutManagerService);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const shortcut: Shortcut = { id: 'test', label: 'Test', value: '' };
      await macService.startEditing(shortcut);

      const event = new KeyboardEvent('keydown', { key: 'A', altKey: true });
      Object.defineProperty(event, 'code', { value: 'KeyA' });
      macService.handleEditingKeydown(event);

      expect(macService.tempShortcutValue()).toBe('Opt+A');
    });

    it('should handle digit keys correctly (AZERTY fix)', async () => {
      const shortcut = service.internalShortcuts()[4];
      await service.startEditing(shortcut);

      const event = new KeyboardEvent('keydown', { key: '&', ctrlKey: true });
      Object.defineProperty(event, 'code', { value: 'Digit1' });
      service.handleEditingKeydown(event);

      expect(service.tempShortcutValue()).toBe('Ctrl+1');
    });

    it('should not include modifier keys as main key', async () => {
      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'Control',
        ctrlKey: true,
      });
      service.handleEditingKeydown(event);

      expect(service.tempShortcutValue()).toBe('Ctrl');
    });
  });

  describe('saveShortcut', () => {
    beforeEach(() => {
      service.loadShortcuts();
      TestBed.flushEffects();
      saveAppConfigSpy.mockClear();
      validateGlobalShortcutSpy.mockClear();
    });

    it('should save valid global shortcut', async () => {
      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);
      service.tempShortcutValue.set('Ctrl+A');

      await service.saveShortcut(shortcut.id);

      expect(validateGlobalShortcutSpy).toHaveBeenCalledWith('Ctrl+A', 'showHideApp');
      expect(saveAppConfigSpy).toHaveBeenCalled();
      expect(service.editingShortcutId()).toBeNull();
      expect(registerGlobalShortcutsSpy).toHaveBeenCalled();
    });

    it('should save valid internal shortcut', async () => {
      registerGlobalShortcutsSpy.mockClear();
      const shortcut = service.internalShortcuts()[0];
      await service.startEditing(shortcut);
      service.tempShortcutValue.set('Ctrl+Shift+A');

      await service.saveShortcut(shortcut.id);

      expect(validateGlobalShortcutSpy).not.toHaveBeenCalled();
      expect(saveAppConfigSpy).toHaveBeenCalled();
      expect(service.editingShortcutId()).toBeNull();
      expect(registerGlobalShortcutsSpy).not.toHaveBeenCalled();
    });

    it('should handle invalid global shortcut with external conflict', async () => {
      validateGlobalShortcutSpy.mockResolvedValueOnce({
        isValid: false,
        error: 'EXTERNAL_CONFLICT',
      });

      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);
      service.tempShortcutValue.set('Ctrl+A');

      await service.saveShortcut(shortcut.id);

      expect(validateGlobalShortcutSpy).toHaveBeenCalledWith('Ctrl+A', 'showHideApp');
      expect(saveAppConfigSpy).not.toHaveBeenCalled();
      expect(registerGlobalShortcutsSpy).toHaveBeenCalled();

      const updatedShortcut = service.globalShortcuts().find((s) => s.id === shortcut.id);
      expect(updatedShortcut?.validation?.isValid).toBe(false);
      expect(updatedShortcut?.validation?.error).toBe('EXTERNAL_CONFLICT');
    });

    it('should handle invalid internal shortcut with internal conflict', async () => {
      const shortcut1 = service.internalShortcuts()[0];
      const shortcut2 = service.internalShortcuts()[1];

      await service.startEditing(shortcut2);
      service.tempShortcutValue.set(shortcut1.value);

      await service.saveShortcut(shortcut2.id);

      expect(saveAppConfigSpy).not.toHaveBeenCalled();

      const updatedShortcut = service.internalShortcuts().find((s) => s.id === shortcut2.id);
      expect(updatedShortcut?.validation?.isValid).toBe(false);
      expect(updatedShortcut?.validation?.error).toBe('INTERNAL_CONFLICT');
    });

    it('should clear editing state after saving invalid shortcut', async () => {
      validateGlobalShortcutSpy.mockResolvedValueOnce({
        isValid: false,
        error: 'EXTERNAL_CONFLICT',
      });

      const shortcut = service.globalShortcuts()[0];
      await service.startEditing(shortcut);
      service.tempShortcutValue.set('Ctrl+A');

      await service.saveShortcut(shortcut.id);

      expect(service.editingShortcutId()).toBeNull();
      expect(service.tempShortcutValue()).toBe('');
    });
  });

  describe('isEditing', () => {
    it('should return true when editing the given shortcut', () => {
      service.editingShortcutId.set('test');

      expect(service.isEditing('test')).toBe(true);
    });

    it('should return false when not editing the given shortcut', () => {
      service.editingShortcutId.set('other');

      expect(service.isEditing('test')).toBe(false);
    });

    it('should return false when not editing any shortcut', () => {
      expect(service.isEditing('test')).toBe(false);
    });
  });

  describe('getDisplayValue', () => {
    it('should return temp value when editing', () => {
      const shortcut: Shortcut = { id: 'test', label: 'Test', value: 'Ctrl+T' };
      service.editingShortcutId.set('test');
      service.tempShortcutValue.set('Ctrl+A');

      const result = service.getDisplayValue(shortcut);

      expect(result).toBe('Ctrl+A');
    });

    it('should return shortcut value when not editing', () => {
      const shortcut: Shortcut = { id: 'test', label: 'Test', value: 'Ctrl+T' };
      service.editingShortcutId.set('other');
      service.tempShortcutValue.set('Ctrl+A');

      const result = service.getDisplayValue(shortcut);

      expect(result).toBe('Ctrl+T');
    });
  });

  describe('hasValidationError', () => {
    it('should return true when shortcut has validation error and not editing', () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
        validation: { isValid: false, error: 'INTERNAL_CONFLICT' },
      };
      service.editingShortcutId.set(null);

      const result = service.hasValidationError(shortcut);

      expect(result).toBe(true);
    });

    it('should return false when editing', () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
        validation: { isValid: false, error: 'INTERNAL_CONFLICT' },
      };
      service.editingShortcutId.set('test');

      const result = service.hasValidationError(shortcut);

      expect(result).toBe(false);
    });

    it('should return false when validation is valid', () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
        validation: { isValid: true },
      };
      service.editingShortcutId.set(null);

      const result = service.hasValidationError(shortcut);

      expect(result).toBe(false);
    });

    it('should return false when validation is undefined', () => {
      const shortcut: Shortcut = { id: 'test', label: 'Test', value: 'Ctrl+T' };
      service.editingShortcutId.set(null);

      const result = service.hasValidationError(shortcut);

      expect(result).toBe(false);
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return empty string when validation is undefined', () => {
      const shortcut: Shortcut = { id: 'test', label: 'Test', value: 'Ctrl+T' };

      const result = service.getValidationErrorMessage(shortcut);

      expect(result).toBe('');
    });

    it('should return message for INVALID_FORMAT error', () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
        validation: { isValid: false, error: 'INVALID_FORMAT' },
      };

      const result = service.getValidationErrorMessage(shortcut);

      expect(result).toBe('Invalid shortcut format');
    });

    it('should return message for INTERNAL_CONFLICT error', () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
        validation: {
          isValid: false,
          error: 'INTERNAL_CONFLICT',
          conflictedShortcut: 'openSettings',
        },
      };

      const result = service.getValidationErrorMessage(shortcut);

      expect(result).toBe('Conflicts with: openSettings');
    });

    it('should return message for EXTERNAL_CONFLICT error', () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
        validation: { isValid: false, error: 'EXTERNAL_CONFLICT' },
      };

      const result = service.getValidationErrorMessage(shortcut);

      expect(result).toBe('Already used by another app');
    });

    it('should return default message for unknown error', () => {
      const shortcut: Shortcut = {
        id: 'test',
        label: 'Test',
        value: 'Ctrl+T',
        validation: { isValid: false, error: undefined },
      };

      const result = service.getValidationErrorMessage(shortcut);

      expect(result).toBe('Invalid shortcut');
    });
  });

  describe('onShortcutSaved', () => {
    beforeEach(() => {
      service.loadShortcuts();
      TestBed.flushEffects();
      saveAppConfigSpy.mockClear();
    });

    it('should save correct config format', () => {
      service.onShortcutSaved();

      expect(saveAppConfigSpy).toHaveBeenCalledWith({
        shortcuts: expect.objectContaining({
          globalShortcuts: {
            showHideApp: process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I',
          },
          internalShortcuts: expect.objectContaining({
            openSettings: process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,',
            quitApp: 'Ctrl+Q',
            previousService: 'Ctrl+Shift+Tab',
            nextService: 'Ctrl+Tab',
            services: expect.any(Object),
          }),
        }),
      });
    });

    it('should include service shortcuts in config', () => {
      service.onShortcutSaved();

      const callArgs = saveAppConfigSpy.mock.calls[0][0];
      const services = callArgs.shortcuts.internalShortcuts.services;

      expect(services.service1).toBe('Ctrl+1');
      expect(services.service2).toBe('Ctrl+2');
    });

    it('should handle save errors gracefully', () => {
      saveAppConfigSpy.mockRejectedValueOnce(new Error('Save failed'));

      expect(() => service.onShortcutSaved()).not.toThrow();
    });
  });

  describe('buildShortcutFromEvent', () => {
    it('should build shortcut string from Ctrl key event', () => {
      const event = new KeyboardEvent('keydown', { key: 'A', ctrlKey: true });
      Object.defineProperty(event, 'code', { value: 'KeyA' });

      const result = service.buildShortcutFromEvent(event);

      expect(result).toBe('Ctrl+A');
    });

    it('should build shortcut string with multiple modifiers', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'A',
        ctrlKey: true,
        shiftKey: true,
      });
      Object.defineProperty(event, 'code', { value: 'KeyA' });

      const result = service.buildShortcutFromEvent(event);

      expect(result).toBe('Ctrl+Shift+A');
    });

    it('should return null if no valid keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true });

      const result = service.buildShortcutFromEvent(event);

      expect(result).toBeNull();
    });

    it('should handle function keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'F1' });

      const result = service.buildShortcutFromEvent(event);

      expect(result).toBe('F1');
    });

    it('should use Cmd on Mac when meta key is pressed', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      (window as any).electronAPI.getPlatform = () => Promise.resolve('darwin');
      const macService = TestBed.inject(ShortcutManagerService);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const event = new KeyboardEvent('keydown', { key: 'A', metaKey: true });
      Object.defineProperty(event, 'code', { value: 'KeyA' });

      const result = macService.buildShortcutFromEvent(event);

      expect(result).toBe('Cmd+A');
    });
  });

  describe('executeShortcut', () => {
    beforeEach(() => {
      service.loadShortcuts();
      TestBed.flushEffects();
    });

    it('should debounce rapid shortcut executions', async () => {
      const event = new KeyboardEvent('keydown', { key: 'Q', ctrlKey: true });
      Object.defineProperty(event, 'code', { value: 'KeyQ' });

      const shortcut = service.buildShortcutFromEvent(event) || '';
      const action1 = await service.executeShortcut(shortcut);
      const action2 = await service.executeShortcut(shortcut);

      expect(action1).toBeTruthy();
      expect(action2).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 150));
      const action3 = await service.executeShortcut(shortcut);

      expect(action3).toBeTruthy();
    });

    it('should return openSettings action', async () => {
      const action = await service.executeShortcut(process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,');

      expect(action).toEqual({ action: 'openSettings' });
    });

    it('should return quitApp action', async () => {
      const action = await service.executeShortcut('Ctrl+Q');

      expect(action).toEqual({ action: 'quitApp' });
    });

    it('should return nextService action', async () => {
      const action = await service.executeShortcut('Ctrl+Tab');

      expect(action).toEqual({ action: 'nextService' });
    });

    it('should return previousService action', async () => {
      const action = await service.executeShortcut('Ctrl+Shift+Tab');

      expect(action).toEqual({ action: 'previousService' });
    });

    it('should return selectService action with index', async () => {
      const action = await service.executeShortcut('Ctrl+1');

      expect(action).toEqual({ action: 'selectService', serviceIndex: 0 });
    });

    it('should return selectService action for service 10', async () => {
      const action = await service.executeShortcut('Ctrl+0');

      expect(action).toEqual({ action: 'selectService', serviceIndex: 9 });
    });

    it('should return null for unknown shortcut', async () => {
      const action = await service.executeShortcut('Ctrl+Unknown');

      expect(action).toBeNull();
    });
  });
});
