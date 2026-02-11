import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MOCK_CONFIG_WITH_SERVICES } from '@app-tests/test-config';
import { ShortcutManagerService } from '@app/services/shortcut-manager.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsShortcutsComponent } from './settings-shortcuts.component';

describe('SettingsShortcutsComponent', () => {
  let component: SettingsShortcutsComponent;
  let fixture: ComponentFixture<SettingsShortcutsComponent>;
  let shortcutManagerService: ShortcutManagerService;
  const saveAppConfigSpy = vi.fn().mockResolvedValue(undefined);
  const validateGlobalShortcutSpy = vi.fn().mockResolvedValue({ isValid: true });
  const unregisterGlobalShortcutsSpy = vi.fn().mockResolvedValue(undefined);
  const registerGlobalShortcutsSpy = vi.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    (window as any).electronAPI = {
      getAppConfig: () => Promise.resolve({ ...MOCK_CONFIG_WITH_SERVICES }),
      saveAppConfig: saveAppConfigSpy,
      validateGlobalShortcut: validateGlobalShortcutSpy,
      getPlatform: () => Promise.resolve('linux'),
      unregisterGlobalShortcuts: unregisterGlobalShortcutsSpy,
      registerGlobalShortcuts: registerGlobalShortcutsSpy,
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsShortcutsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsShortcutsComponent);
    component = fixture.componentInstance;
    shortcutManagerService = TestBed.inject(ShortcutManagerService);
    fixture.detectChanges();

    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load shortcuts from config on init', () => {
    const globalShortcuts = component.globalShortcuts();
    const internalShortcuts = component.internalShortcuts();

    expect(globalShortcuts.length).toBe(1);
    expect(globalShortcuts.find((s) => s.id === 'showHideApp')?.id).toBe('showHideApp');

    expect(internalShortcuts.length).toBe(15);
    expect(internalShortcuts.find((s) => s.id === 'openSettings')?.id).toBe('openSettings');
    expect(internalShortcuts.find((s) => s.id === 'quitApp')?.id).toBe('quitApp');
    expect(internalShortcuts.find((s) => s.id === 'previousService')?.id).toBe('previousService');
    expect(internalShortcuts.find((s) => s.id === 'nextService')?.id).toBe('nextService');
    expect(internalShortcuts.find((s) => s.id === 'refreshService')?.id).toBe('refreshService');
  });

  it('should start editing when startEditing is called', async () => {
    const shortcuts = component.globalShortcuts();
    const shortcut = shortcuts.find((s) => s.id === 'showHideApp');
    if (!shortcut) {
      throw new Error('Global shortcut not found');
    }

    await component.startEditing(shortcut);
    expect(component.isEditing(shortcut.id)).toBe(true);
    expect(shortcutManagerService.tempShortcutValue()).toBe(shortcut.value);
    await fixture.whenStable();
  });

  it('should update temp value on keydown', async () => {
    const shortcuts = component.globalShortcuts();
    const shortcut = shortcuts.find((s) => s.id === 'showHideApp');
    if (!shortcut) {
      throw new Error('Global shortcut not found');
    }

    await component.startEditing(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(event);

    expect(shortcutManagerService.tempShortcutValue()).toBe('Ctrl+A');
  });

  it('should cancel editing on Escape key without saving', async () => {
    const shortcuts = component.globalShortcuts();
    const shortcut = shortcuts.find((s) => s.id === 'showHideApp');
    if (!shortcut) {
      throw new Error('Global shortcut not found');
    }

    await component.startEditing(shortcut);

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
    });
    component.handleKeydown(escapeEvent);

    expect(component.isEditing(shortcut.id)).toBe(false);
    const updatedShortcut = component.globalShortcuts().find((s) => s.id === shortcut.id);
    expect(updatedShortcut?.value).toBe(shortcut.value);

    await fixture.whenStable();
    expect(saveAppConfigSpy).not.toHaveBeenCalled();
  });

  it('should save shortcut on Enter key when valid', async () => {
    const shortcuts = component.globalShortcuts();
    const shortcut = shortcuts.find((s) => s.id === 'showHideApp');
    if (!shortcut) {
      throw new Error('Global shortcut not found');
    }

    await component.startEditing(shortcut);

    const ctrlAEvent = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(ctrlAEvent);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
    });
    component.handleKeydown(enterEvent);

    await fixture.whenStable();
    expect(component.isEditing(shortcut.id)).toBe(false);
    const updatedShortcut = component.globalShortcuts().find((s) => s.id === shortcut.id);
    expect(updatedShortcut?.value).toBe('Ctrl+A');

    expect(saveAppConfigSpy).toHaveBeenCalled();
    expect(validateGlobalShortcutSpy).toHaveBeenCalledWith('Ctrl+A', 'showHideApp');
  });

  it('should not save shortcut on Enter key when invalid', async () => {
    saveAppConfigSpy.mockClear();
    validateGlobalShortcutSpy.mockResolvedValueOnce({
      isValid: false,
      error: 'EXTERNAL_CONFLICT',
    });

    const shortcuts = component.globalShortcuts();
    const shortcut = shortcuts.find((s) => s.id === 'showHideApp');
    if (!shortcut) {
      throw new Error('Global shortcut not found');
    }

    await component.startEditing(shortcut);

    const ctrlAEvent = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(ctrlAEvent);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
    });
    component.handleKeydown(enterEvent);

    await fixture.whenStable();
    expect(component.isEditing(shortcut.id)).toBe(false);
    const updatedShortcut = component.globalShortcuts().find((s) => s.id === shortcut.id);
    expect(updatedShortcut?.value).toBe('Ctrl+A');
    expect(updatedShortcut?.validation?.isValid).toBe(false);

    expect(saveAppConfigSpy).not.toHaveBeenCalled();
  });

  it('should display validation error for invalid shortcut', async () => {
    validateGlobalShortcutSpy.mockResolvedValueOnce({
      isValid: false,
      error: 'INTERNAL_CONFLICT',
      conflictedShortcut: 'openSettings',
    });

    const shortcuts = component.globalShortcuts();
    const shortcut = shortcuts.find((s) => s.id === 'showHideApp');
    if (!shortcut) {
      throw new Error('Global shortcut not found');
    }

    await component.startEditing(shortcut);

    const ctrlCommaEvent = new KeyboardEvent('keydown', {
      key: ',',
      ctrlKey: true,
    });
    component.handleKeydown(ctrlCommaEvent);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
    });
    component.handleKeydown(enterEvent);

    await fixture.whenStable();

    const updatedShortcut = component.globalShortcuts().find((s) => s.id === shortcut.id);
    expect(component.hasValidationError(updatedShortcut!)).toBe(true);
    expect(shortcutManagerService.getValidationErrorMessage(updatedShortcut!)).toBe('Conflicts with: openSettings');
  });

  it('should not handle keydown when not editing', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(event);
    expect(shortcutManagerService.tempShortcutValue()).toBe('');
  });

  it('should use physical key code for digits (AZERTY fix)', async () => {
    const serviceShortcut = component.internalShortcuts().find((s) => s.id.startsWith('service'));
    if (!serviceShortcut) {
      throw new Error('No service shortcut found');
    }

    await component.startEditing(serviceShortcut);

    const event = new KeyboardEvent('keydown', {
      key: '&',
      ctrlKey: true,
    });
    Object.defineProperty(event, 'code', {
      value: 'Digit1',
      writable: false,
    });
    component.handleKeydown(event);

    expect(shortcutManagerService.tempShortcutValue()).toBe('Ctrl+1');
  });

  it('should use physical key code for letters', async () => {
    const shortcuts = component.globalShortcuts();
    const shortcut = shortcuts.find((s) => s.id === 'showHideApp');
    if (!shortcut) {
      throw new Error('Global shortcut not found');
    }

    await component.startEditing(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
    });
    Object.defineProperty(event, 'code', {
      value: 'KeyA',
      writable: false,
    });
    component.handleKeydown(event);

    expect(shortcutManagerService.tempShortcutValue()).toBe('Ctrl+A');
  });
});
