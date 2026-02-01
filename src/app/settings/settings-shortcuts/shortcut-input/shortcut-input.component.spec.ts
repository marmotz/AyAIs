import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortcutManagerService } from '@app/services/shortcut-manager.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Shortcut } from '../shortcut.model';
import { ShortcutInputComponent } from './shortcut-input.component';

describe('ShortcutInputComponent', () => {
  let component: ShortcutInputComponent;
  let fixture: ComponentFixture<ShortcutInputComponent>;
  let shortcutManagerService: ShortcutManagerService;

  const mockShortcut: Shortcut = {
    id: 'test-shortcut',
    label: 'Test Shortcut',
    value: 'Ctrl+T',
  };

  beforeEach(async () => {
    // Mock window.electronAPI
    (window as any).electronAPI = {
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ShortcutInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShortcutInputComponent);
    component = fixture.componentInstance;
    shortcutManagerService = TestBed.inject(ShortcutManagerService);

    // Mock the service methods
    vi.spyOn(shortcutManagerService, 'getDisplayValue').mockReturnValue('Ctrl+T');
    vi.spyOn(shortcutManagerService, 'isEditing').mockReturnValue(false);
    vi.spyOn(shortcutManagerService, 'hasValidationError').mockReturnValue(false);
    vi.spyOn(shortcutManagerService, 'getValidationErrorMessage').mockReturnValue('');

    // Set the required input using setInput
    fixture.componentRef.setInput('shortcut', mockShortcut);

    fixture.detectChanges();
  });

  afterEach(() => {
    // Clear any pending timers to prevent logDebug errors after tests
    vi.clearAllTimers();
    // Don't delete the mock - the setup file will maintain it
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
