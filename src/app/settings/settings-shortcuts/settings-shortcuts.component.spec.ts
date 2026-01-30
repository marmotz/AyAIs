import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsShortcutsComponent } from './settings-shortcuts.component';

describe('SettingsShortcutsComponent', () => {
  let component: SettingsShortcutsComponent;
  let fixture: ComponentFixture<SettingsShortcutsComponent>;
  const saveAppConfigSpy = vi.fn().mockResolvedValue(undefined);
  const disableShortcutsSpy = vi.fn().mockResolvedValue(undefined);
  const enableShortcutsSpy = vi.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    (window as any).electronAPI = {
      getAppConfig: () =>
        Promise.resolve({
          shortcuts: {
            globalShortcuts: {
              showHideApp: 'Super+I',
            },
            internalShortcuts: {
              openSettings: 'Ctrl+,',
              quitApp: 'Ctrl+Q',
              previousService: 'Ctrl+Shift+Tab',
              nextService: 'Ctrl+Tab',
              services: {
                service1: 'Ctrl+1',
                service2: 'Ctrl+2',
                service3: 'Ctrl+3',
                service4: 'Ctrl+4',
                service5: 'Ctrl+5',
                service6: 'Ctrl+6',
                service7: 'Ctrl+7',
                service8: 'Ctrl+8',
                service9: 'Ctrl+9',
                service10: 'Ctrl+0',
              },
            },
          },
        }),
      saveAppConfig: saveAppConfigSpy,
      disableShortcuts: disableShortcutsSpy,
      enableShortcuts: enableShortcutsSpy,
    };

    await TestBed.configureTestingModule({
      imports: [SettingsShortcutsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Wait for ngOnInit to complete
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load shortcuts from config on init', () => {
    const globalShortcuts = component.globalShortcuts();
    const internalShortcuts = component.internalShortcuts();

    expect(globalShortcuts.length).toBe(1);
    expect(globalShortcuts[0].id).toBe('showHideApp');

    expect(internalShortcuts.length).toBe(14);
    expect(internalShortcuts[0].id).toBe('openSettings');
    expect(internalShortcuts[1].id).toBe('quitApp');
    expect(internalShortcuts[2].id).toBe('previousService');
    expect(internalShortcuts[3].id).toBe('nextService');
  });

  it('should start editing when startEditing is called', async () => {
    const shortcut = component.globalShortcuts()[0];
    component.startEditing(shortcut);
    expect(component.isEditing(shortcut.id)).toBe(true);
    expect(component.tempShortcutValue()).toBe(shortcut.value);
    await fixture.whenStable();
    expect(disableShortcutsSpy).toHaveBeenCalled();
  });

  it('should update temp value on keydown', () => {
    const shortcut = component.globalShortcuts()[0];
    component.startEditing(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(event);

    expect(component.tempShortcutValue()).toBe('Ctrl+A');
  });

  it('should cancel editing on Escape key without saving', async () => {
    const shortcut = component.globalShortcuts()[0];
    const originalValue = shortcut.value;
    component.startEditing(shortcut);

    const ctrlAEvent = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(ctrlAEvent);

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
    });
    component.handleKeydown(escapeEvent);

    expect(component.isEditing(shortcut.id)).toBe(false);
    const updatedShortcut = component.globalShortcuts().find((s) => s.id === shortcut.id);
    expect(updatedShortcut?.value).toBe(originalValue);

    await fixture.whenStable();
    expect(enableShortcutsSpy).toHaveBeenCalled();
    expect(saveAppConfigSpy).not.toHaveBeenCalled();
  });

  it('should save shortcut on Enter key', async () => {
    const shortcut = component.globalShortcuts()[0];
    component.startEditing(shortcut);

    const ctrlAEvent = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(ctrlAEvent);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
    });
    component.handleKeydown(enterEvent);

    expect(component.isEditing(shortcut.id)).toBe(false);
    const updatedShortcut = component.globalShortcuts().find((s) => s.id === shortcut.id);
    expect(updatedShortcut?.value).toBe('Ctrl+A');

    await fixture.whenStable();
    expect(enableShortcutsSpy).toHaveBeenCalled();
    expect(saveAppConfigSpy).toHaveBeenCalled();
  });

  it('should not handle keydown when not editing', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(event);
    expect(component.tempShortcutValue()).toBe('');
  });

  it('should use physical key code for digits (AZERTY fix)', () => {
    const shortcut = component.internalShortcuts()[4];
    component.startEditing(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: '&',
      ctrlKey: true,
    });
    Object.defineProperty(event, 'code', {
      value: 'Digit1',
      writable: false,
    });
    component.handleKeydown(event);

    expect(component.tempShortcutValue()).toBe('Ctrl+1');
  });

  it('should use physical key code for letters', () => {
    const shortcut = component.globalShortcuts()[0];
    component.startEditing(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
    });
    Object.defineProperty(event, 'code', {
      value: 'KeyA',
      writable: false,
    });
    component.handleKeydown(event);

    expect(component.tempShortcutValue()).toBe('Ctrl+A');
  });
});
