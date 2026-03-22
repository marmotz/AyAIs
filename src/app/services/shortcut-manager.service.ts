import { computed, inject, Injectable, signal } from '@angular/core';
import { ConfigService } from '@app/services/config.service';
import { DEFAULT_SHORTCUTS, Shortcut } from '@app/settings/settings-shortcuts/shortcut.model';
import { ShortcutConfig } from '@shared/types/app-config.interface';

export type ShortcutAction =
  | 'openSettings'
  | 'quitApp'
  | 'nextService'
  | 'previousService'
  | 'refreshService'
  | 'selectService';

export interface ShortcutActionEvent {
  action: ShortcutAction;
  serviceIndex?: number;
}

interface PendingShortcut {
  shortcut: string;
  resolve: (result: ShortcutActionEvent | null) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ShortcutManagerService {
  private readonly configService = inject(ConfigService);
  editingShortcutId = signal<string | null>(null);
  tempShortcutValue = signal<string>('');
  private readonly validationResults = signal<Record<string, ValidationResult>>({});
  private isMac = false;
  private pendingRequest: PendingShortcut | null = null;
  private lastShortcutExecuted = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 100;

  readonly globalShortcuts = computed<Shortcut[]>(() => {
    const config = this.configService.shortcuts();
    if (!config) {
      return [];
    }

    const id = 'showHideApp';
    return [
      {
        id,
        label: DEFAULT_SHORTCUTS.globalShortcuts.find((s) => s.id === id)!.label,
        value: config.globalShortcuts.showHideApp,
        validation: this.validationResults()[id],
      },
    ];
  });

  readonly internalShortcuts = computed<Shortcut[]>(() => {
    const config = this.configService.shortcuts();
    if (!config) {
      return [];
    }

    const getShortcutLabel = (id: string): string => {
      return DEFAULT_SHORTCUTS.internalShortcuts.find((s) => s.id === id)!.label;
    };

    const shortcuts: Shortcut[] = [
      {
        id: 'openSettings',
        label: getShortcutLabel('openSettings'),
        value: config.internalShortcuts.openSettings,
      },
      {
        id: 'quitApp',
        label: getShortcutLabel('quitApp'),
        value: config.internalShortcuts.quitApp,
      },
      {
        id: 'previousService',
        label: getShortcutLabel('previousService'),
        value: config.internalShortcuts.previousService,
      },
      {
        id: 'nextService',
        label: getShortcutLabel('nextService'),
        value: config.internalShortcuts.nextService,
      },
      {
        id: 'refreshService',
        label: getShortcutLabel('refreshService'),
        value: config.internalShortcuts.refreshService,
      },
      ...DEFAULT_SHORTCUTS.internalShortcuts
        .filter((s) => s.id.startsWith('service'))
        .map((service) => ({
          ...service,
          value: config.internalShortcuts.services[service.id] ?? '',
        })),
    ];

    const results = this.validationResults();
    return shortcuts.map((s) => ({
      ...s,
      validation: results[s.id],
    }));
  });


  constructor() {
    void this.initializePlatform();
  }

  private flushShortcut(): void {
    if (this.pendingRequest) {
      const request = this.pendingRequest;
      this.pendingRequest = null;

      this.executeShortcutInternal(request.shortcut).then((result) => {
        if (result) {
          this.lastShortcutExecuted = Date.now();
        }
        request.resolve(result);
      });
    }
    this.debounceTimer = null;
  }

  private async executeShortcutInternal(shortcut: string): Promise<ShortcutActionEvent | null> {
    const config = this.configService.shortcuts();
    if (!config) {
      return null;
    }

    if (shortcut === config.internalShortcuts.openSettings) {
      return { action: 'openSettings' };
    } else if (shortcut === config.internalShortcuts.quitApp) {
      return { action: 'quitApp' };
    } else if (shortcut === config.internalShortcuts.nextService) {
      return { action: 'nextService' };
    } else if (shortcut === config.internalShortcuts.previousService) {
      return { action: 'previousService' };
    } else if (shortcut === config.internalShortcuts.refreshService) {
      return { action: 'refreshService' };
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

    this.editingShortcutId.set(null);
    this.tempShortcutValue.set('');

    if (wasEditingGlobalShortcut) {
      await window.electronAPI.registerGlobalShortcuts();
    }
  }

  async executeShortcut(shortcut: string): Promise<ShortcutActionEvent | null> {
    const now = Date.now();

    if (this.pendingRequest || now - this.lastShortcutExecuted < this.DEBOUNCE_MS) {
      return null;
    }

    return new Promise((resolve) => {
      this.pendingRequest = { shortcut, resolve };
      this.debounceTimer = setTimeout(() => this.flushShortcut(), this.DEBOUNCE_MS);
    });
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
      void window.electronAPI.logDebug(
        `Shortcut editing event caught - ctrlKey: ${event.ctrlKey}, ` +
          `altKey: ${event.altKey}, shiftKey: ${event.shiftKey}, ` +
          `metaKey: ${event.metaKey}, code: "${event.code}", key: "${event.key}", ` +
          `generated shortcut: "${shortcut}", editing shortcut ID: ${editingId}`
      );

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
    void this.configService.loadConfig();
  }

  async saveShortcut(shortcutId: string): Promise<void> {
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
        this.validationResults.update((prev) => ({ ...prev, [shortcutId]: validationResult }));
        this.editingShortcutId.set(null);
        this.tempShortcutValue.set('');

        if (isGlobalShortcut) {
          await window.electronAPI.registerGlobalShortcuts();
        }

        return;
      }
    }

    // Clear previous validation result
    this.validationResults.update((prev) => {
      const next = { ...prev };
      delete next[shortcutId];
      return next;
    });

    const currentConfig = this.configService.appConfig();
    if (currentConfig) {
      const shortcuts: ShortcutConfig = JSON.parse(JSON.stringify(currentConfig.shortcuts));
      if (isGlobalShortcut) {
        shortcuts.globalShortcuts.showHideApp = newValue;
      } else {
        const internal = shortcuts.internalShortcuts;
        if (shortcutId === 'openSettings') internal.openSettings = newValue;
        else if (shortcutId === 'quitApp') internal.quitApp = newValue;
        else if (shortcutId === 'previousService') internal.previousService = newValue;
        else if (shortcutId === 'nextService') internal.nextService = newValue;
        else if (shortcutId === 'refreshService') internal.refreshService = newValue;
        else if (shortcutId.startsWith('service')) {
          internal.services[shortcutId] = newValue;
        }
      }

      void this.configService.updateConfig({ shortcuts });
    }

    this.editingShortcutId.set(null);
    this.tempShortcutValue.set('');

    if (isGlobalShortcut) {
      await window.electronAPI.registerGlobalShortcuts();
    }
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

