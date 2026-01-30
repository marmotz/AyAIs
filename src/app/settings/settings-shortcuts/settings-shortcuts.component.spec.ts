import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsShortcutsComponent } from './settings-shortcuts.component';
import { DEFAULT_SHORTCUTS } from './shortcut.model';

describe('SettingsShortcutsComponent', () => {
  let component: SettingsShortcutsComponent;
  let fixture: ComponentFixture<SettingsShortcutsComponent>;
  const originalPlatform = navigator.platform;

  beforeEach(async () => {
    // Mock as non-Mac platform for consistent testing
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [SettingsShortcutsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default shortcuts', () => {
    const shortcuts = component.shortcuts();
    expect(shortcuts.length).toBe(2 + DEFAULT_SHORTCUTS.services.length);
    expect(shortcuts[0].id).toBe('previousService');
    expect(shortcuts[1].id).toBe('nextService');
  });

  it('should start editing when startEditing is called', () => {
    const shortcut = component.shortcuts()[0];
    component.startEditing(shortcut);
    expect(component.isEditing(shortcut.id)).toBe(true);
    expect(component.tempShortcutValue()).toBe(shortcut.value);
  });

  it('should update temp value on keydown', () => {
    const shortcut = component.shortcuts()[0];
    component.startEditing(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(event);

    expect(component.tempShortcutValue()).toBe('Ctrl+A');
  });

  it('should save shortcut on Escape key', () => {
    const shortcut = component.shortcuts()[0];
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
    const updatedShortcut = component.shortcuts().find((s) => s.id === shortcut.id);
    expect(updatedShortcut?.value).toBe('Ctrl+A');
  });

  it('should not handle keydown when not editing', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
    });
    component.handleKeydown(event);
    expect(component.tempShortcutValue()).toBe('');
  });

  it('should display Mac-specific abbreviations on Mac platform', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    // Re-create component to pick up new platform
    fixture = TestBed.createComponent(SettingsShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Test that stored values are displayed as-is (already using abbreviations)
    const shortcut = { id: 'test', label: 'Test', value: 'Ctrl+Opt+Cmd+A' };
    const displayValue = component.getDisplayValue(shortcut);

    expect(displayValue).toBe('Ctrl+Opt+Cmd+A');
  });
});
