import { Injectable, signal } from '@angular/core';
import { DEFAULT_SHORTCUTS, Shortcut } from '@app/settings/settings-shortcuts/shortcut.model';
import { ShortcutConfig } from '@shared/types/app-config.interface';

export type ShortcutAction = 'openSettings' | 'quitApp' | 'nextService' | 'previousService' | 'selectService';

export interface ShortcutActionEvent {
  action: ShortcutAction;
  serviceIndex?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ShortcutManagerService {
  globalShortcuts = signal<Shortcut[]>([]);
  internalShortcuts = signal<Shortcut[]>([]);
  editingShortcutId = signal<string | null>(null);
  tempShortcutValue = signal<string>('');
  private isMac = false;
  private lastShortcutTime = 0;
  private readonly SHORTCUT_DEBOUNCE_MS = 100;
  private debugLogTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBUG_LOG_DEBOUNCE_MS = 300;

  constructor() {
    void this.initializePlatform();
  }

  buildShortcutFromEvent(event: KeyboardEvent): string | null {
    const shortcut = this.buildShortcutString(event);
    const mainKey = this.getMainKeyDisplayName(event);

    if (shortcut && mainKey && !['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
      return shortcut;
    }

    return null;
  }

  canExecuteInternalShortcuts(): boolean {
    return this.editingShortcutId() === null;
  }

  async cancelEditing(): Promise<void> {
    const wasEditingGlobalShortcut = this.editingShortcutId() === 'showHideApp';

    // Clear any pending debug log
    if (this.debugLogTimer) {
      clearTimeout(this.debugLogTimer);
      this.debugLogTimer = null;
    }

    this.editingShortcutId.set(null);
    this.tempShortcutValue.set('');

    if (wasEditingGlobalShortcut) {
      await window.electronAPI.registerGlobalShortcuts();
    }
  }

  async executeShortcut(shortcut: string): Promise<ShortcutActionEvent | null> {
    if (!this.shouldExecuteShortcut()) {
      return null;
    }

    const appConfig = await window.electronAPI.getAppConfig();
    const config = appConfig.shortcuts;

    if (shortcut === config.internalShortcuts.openSettings) {
      return { action: 'openSettings' };
    } else if (shortcut === config.internalShortcuts.quitApp) {
      return { action: 'quitApp' };
    } else if (shortcut === config.internalShortcuts.nextService) {
      return { action: 'nextService' };
    } else if (shortcut === config.internalShortcuts.previousService) {
      return { action: 'previousService' };
    } else {
      for (const [id, serviceShortcut] of Object.entries(config.internalShortcuts.services)) {
        if (shortcut === serviceShortcut) {
          const index = parseInt(id.replace('service', ''), 10) - 1;
          return { action: 'selectService', serviceIndex: index };
        }
      }
    }

    return null;
  }

  getDisplayValue(shortcut: Shortcut): string {
    if (this.isEditing(shortcut.id)) {
      return this.tempShortcutValue();
    }

    return shortcut.value;
  }

  getKeyDisplayName(event: KeyboardEvent): string {
    return this.getMainKeyDisplayName(event);
  }

  getValidationErrorMessage(shortcut: Shortcut): string {
    if (!shortcut.validation) {
      return '';
    }

    switch (shortcut.validation.error) {
      case 'INVALID_FORMAT':
        return 'Invalid shortcut format';
      case 'INTERNAL_CONFLICT':
        return `Conflicts with: ${shortcut.validation.conflictedShortcut}`;
      case 'EXTERNAL_CONFLICT':
        return 'Already used by another app';
      default:
        return 'Invalid shortcut';
    }
  }

  handleEditingKeydown(event: KeyboardEvent): void {
    const editingId = this.editingShortcutId();
    if (!editingId) {
      return;
    }

    if (event.key === 'Escape') {
      this.cancelEditing();
      return;
    }

    if (event.key === 'Enter') {
      void this.saveShortcut(editingId);
      return;
    }

    event.preventDefault();
    const shortcut = this.buildShortcutString(event);

    if (shortcut) {
      // Debounced debug log to avoid logging short/incomplete shortcuts
      this.debouncedDebugLog(event, shortcut, editingId);

      this.tempShortcutValue.set(shortcut);
    }
  }

  hasValidationError(shortcut: Shortcut): boolean {
    return !this.isEditing(shortcut.id) && shortcut.validation?.isValid === false;
  }

  isEditing(shortcutId: string): boolean {
    return this.editingShortcutId() === shortcutId;
  }

  loadShortcuts(): void {
    window.electronAPI
      .getAppConfig()
      .then((appConfig) => {
        const shortcutConfig = appConfig.shortcuts;
        if (shortcutConfig) {
          this.globalShortcuts.set([
            {
              id: 'showHideApp',
              label: DEFAULT_SHORTCUTS.globalShortcuts[0].label,
              value: shortcutConfig.globalShortcuts.showHideApp,
            },
          ]);

          this.internalShortcuts.set([
            {
              id: 'openSettings',
              label: DEFAULT_SHORTCUTS.internalShortcuts[0].label,
              value: shortcutConfig.internalShortcuts.openSettings,
            },
            {
              id: 'quitApp',
              label: DEFAULT_SHORTCUTS.internalShortcuts[1].label,
              value: shortcutConfig.internalShortcuts.quitApp,
            },
            {
              id: 'previousService',
              label: DEFAULT_SHORTCUTS.internalShortcuts[2].label,
              value: shortcutConfig.internalShortcuts.previousService,
            },
            {
              id: 'nextService',
              label: DEFAULT_SHORTCUTS.internalShortcuts[3].label,
              value: shortcutConfig.internalShortcuts.nextService,
            },
            ...DEFAULT_SHORTCUTS.internalShortcuts.slice(4).map((service) => ({
              ...service,
              value: shortcutConfig.internalShortcuts.services[service.id] ?? '',
            })),
          ]);
        } else {
          this.setEmptyShortcuts();
        }
      })
      .catch(() => {
        this.setEmptyShortcuts();
      });
  }

  onShortcutSaved(): void {
    const global = this.globalShortcuts();
    const internal = this.internalShortcuts();

    const shortcutConfig: ShortcutConfig = {
      globalShortcuts: {
        showHideApp: global.find((s) => s.id === 'showHideApp')?.value || 'Meta+I',
      },
      internalShortcuts: {
        openSettings: internal.find((s) => s.id === 'openSettings')?.value || 'Ctrl+,',
        quitApp: internal.find((s) => s.id === 'quitApp')?.value || 'Ctrl+Q',
        previousService: internal.find((s) => s.id === 'previousService')?.value || '',
        nextService: internal.find((s) => s.id === 'nextService')?.value || '',
        services: {} as Record<string, string>,
      },
    };

    internal
      .filter((s) => s.id.startsWith('service'))
      .forEach((s) => {
        (shortcutConfig.internalShortcuts.services as Record<string, string>)[s.id] = s.value;
      });

    window.electronAPI.saveAppConfig({ shortcuts: shortcutConfig }).catch(() => {});
  }

  async saveShortcut(shortcutId: string): Promise<void> {
    // Clear any pending debug log
    if (this.debugLogTimer) {
      clearTimeout(this.debugLogTimer);
      this.debugLogTimer = null;
    }

    const newValue = this.tempShortcutValue();
    const isGlobalShortcut = shortcutId === 'showHideApp';

    if (newValue) {
      let validationResult;

      if (isGlobalShortcut) {
        validationResult = await window.electronAPI.validateGlobalShortcut(newValue, shortcutId);
      } else {
        validationResult = this.validateInternalShortcut(newValue, shortcutId);
      }

      if (!validationResult.isValid) {
        this.updateShortcutValue(shortcutId, newValue, validationResult);
        this.editingShortcutId.set(null);
        this.tempShortcutValue.set('');

        if (isGlobalShortcut) {
          await window.electronAPI.registerGlobalShortcuts();
        }

        return;
      }
    }

    this.updateShortcutValue(shortcutId, newValue, undefined);
    this.editingShortcutId.set(null);
    this.tempShortcutValue.set('');

    this.onShortcutSaved();

    if (isGlobalShortcut) {
      await window.electronAPI.registerGlobalShortcuts();
    }
  }

  setEmptyShortcuts(): void {
    this.globalShortcuts.set(
      DEFAULT_SHORTCUTS.globalShortcuts.map((s) => ({
        ...s,
        value: '',
      }))
    );
    this.internalShortcuts.set(
      DEFAULT_SHORTCUTS.internalShortcuts.map((s) => ({
        ...s,
        value: '',
      }))
    );
  }

  async startEditing(shortcut: Shortcut): Promise<void> {
    this.editingShortcutId.set(shortcut.id);
    this.tempShortcutValue.set(shortcut.value);

    if (shortcut.id === 'showHideApp') {
      await window.electronAPI.unregisterGlobalShortcuts();
    }
  }

  private buildShortcutString(event: KeyboardEvent): string {
    const modifiers = this.getModifierKeys(event);
    const mainKey = this.getMainKeyDisplayName(event);

    if (
      mainKey &&
      !['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey) &&
      (modifiers.length > 0 ||
        ['Escape', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(mainKey))
    ) {
      modifiers.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);
    }

    return modifiers.join('+');
  }

  private debouncedDebugLog(event: KeyboardEvent, shortcut: string, editingId: string): void {
    // Clear existing timer if any
    if (this.debugLogTimer) {
      clearTimeout(this.debugLogTimer);
    }

    // Set new timer
    this.debugLogTimer = setTimeout(() => {
      void window.electronAPI.logDebug(
        `Shortcut editing event caught - ctrlKey: ${event.ctrlKey}, ` +
          `altKey: ${event.altKey}, shiftKey: ${event.shiftKey}, ` +
          `metaKey: ${event.metaKey}, code: "${event.code}", key: "${event.key}", ` +
          `generated shortcut: "${shortcut}", editing shortcut ID: ${editingId}`
      );
      this.debugLogTimer = null;
    }, this.DEBUG_LOG_DEBOUNCE_MS);
  }

  private getMainKeyDisplayName(event: KeyboardEvent): string {
    if (event.code.startsWith('Digit')) {
      return event.code.replace('Digit', '');
    }

    if (event.code.startsWith('Key')) {
      return event.key;
    }

    if (event.code.startsWith('Numpad')) {
      return 'Num' + event.key;
    }

    if (event.code.startsWith('F') && event.code.length <= 3) {
      return event.code;
    }

    return event.key;
  }

  private getModifierKeys(event: KeyboardEvent): string[] {
    const keys: string[] = [];

    if (event.ctrlKey) {
      keys.push('Ctrl');
    }
    if (event.altKey) {
      keys.push(this.isMac ? 'Opt' : 'Alt');
    }
    if (event.shiftKey) {
      keys.push('Shift');
    }
    if (event.metaKey) {
      keys.push(this.isMac ? 'Cmd' : 'Meta');
    }

    return keys;
  }

  private async initializePlatform(): Promise<void> {
    const platform = await window.electronAPI.getPlatform();
    this.isMac = platform === 'darwin';
  }

  private shouldExecuteShortcut(): boolean {
    const now = Date.now();
    if (now - this.lastShortcutTime < this.SHORTCUT_DEBOUNCE_MS) {
      return false;
    }
    this.lastShortcutTime = now;
    return true;
  }

  private updateShortcutValue(shortcutId: string, value: string, validation?: ValidationResult): void {
    const allShortcuts = [...this.globalShortcuts(), ...this.internalShortcuts()];
    const updatedShortcuts = allShortcuts.map((s) =>
      s.id === shortcutId
        ? {
            ...s,
            value,
            validation,
          }
        : s
    );

    const global = updatedShortcuts.filter((s) => s.id === 'showHideApp');
    const internal = updatedShortcuts.filter((s) => s.id !== 'showHideApp');

    this.globalShortcuts.set(global);
    this.internalShortcuts.set(internal);
  }

  private validateInternalShortcut(shortcut: string, excludeId: string): ValidationResult {
    if (!shortcut || shortcut.trim() === '') {
      return { isValid: true };
    }

    const allShortcuts = [...this.globalShortcuts(), ...this.internalShortcuts()];
    const conflicts = allShortcuts.filter((s) => s.value === shortcut && s.id !== excludeId);

    if (conflicts.length > 0) {
      return {
        isValid: false,
        error: 'INTERNAL_CONFLICT',
        conflictedShortcut: conflicts[0].id,
      };
    }

    return {
      isValid: true,
    };
  }
}

interface ValidationResult {
  isValid: boolean;
  error?: 'INVALID_FORMAT' | 'INTERNAL_CONFLICT' | 'EXTERNAL_CONFLICT';
  conflictedShortcut?: string;
}
