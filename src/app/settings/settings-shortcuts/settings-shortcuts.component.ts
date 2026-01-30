import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShortcutConfig } from '@shared/types/app-config.interface';
import { DEFAULT_SHORTCUTS, Shortcut } from './shortcut.model';

@Component({
  selector: 'app-settings-shortcuts',
  standalone: true,
  templateUrl: './settings-shortcuts.component.html',
  imports: [CommonModule, FormsModule],
})
export class SettingsShortcutsComponent implements OnInit {
  private elementRef = inject(ElementRef);

  private isMac = signal<boolean>(navigator.platform.toLowerCase().includes('mac'));

  globalShortcuts = signal<Shortcut[]>([]);
  internalShortcuts = signal<Shortcut[]>([]);

  editingShortcutId = signal<string | null>(null);
  tempShortcutValue = signal<string>('');

  ngOnInit(): void {
    this.loadShortcuts();
  }

  private loadShortcuts(): void {
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

  setEmptyShortcuts() {
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

  startEditing(shortcut: Shortcut): void {
    this.editingShortcutId.set(shortcut.id);
    this.tempShortcutValue.set(shortcut.value);
    window.electronAPI.disableShortcuts().catch((e) => {
      console.error('Failed to disable shortcuts:', e);
    });
  }

  private getKeyDisplayName(event: KeyboardEvent): string {
    if (event.code.startsWith('Digit')) {
      return event.code.replace('Digit', '');
    }

    if (event.code.startsWith('Key')) {
      return event.key;
    }

    if (event.code.startsWith('Numpad')) {
      return 'Num' + event.key
    }

    if (event.code.startsWith('F') && event.code.length <= 3) {
      return event.code;
    }

    return event.key;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const editingId = this.editingShortcutId();
    if (!editingId) {
      return;
    }

    if (event.key === 'Escape') {
      this.cancelEditing();
      return;
    }

    if (event.key === 'Enter') {
      this.saveShortcut(editingId);
      return;
    }

    event.preventDefault();
    const keys: string[] = [];

    if (event.ctrlKey) {
      keys.push('Ctrl');
    }
    if (event.altKey) {
      keys.push(this.isMac() ? 'Opt' : 'Alt');
    }
    if (event.shiftKey) {
      keys.push('Shift');
    }
    if (event.metaKey) {
      keys.push(this.isMac() ? 'Cmd' : 'Meta');
    }

    const mainKey = this.getKeyDisplayName(event);
    if (mainKey && !['Control', 'Alt', 'Shift', 'Meta', 'Escape'].includes(mainKey)) {
      keys.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);
    }

    if (keys.length > 0) {
      this.tempShortcutValue.set(keys.join('+'));
    }
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const editingId = this.editingShortcutId();
    if (!editingId) {
      return;
    }

    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.cancelEditing();
    }
  }

  cancelEditing(): void {
    this.editingShortcutId.set(null);
    this.tempShortcutValue.set('');
    window.electronAPI.enableShortcuts().catch(() => {});
  }

  saveShortcut(shortcutId: string): void {
    const newValue = this.tempShortcutValue();

    const allShortcuts = [...this.globalShortcuts(), ...this.internalShortcuts()];
    const updatedShortcuts = allShortcuts.map((s) => (s.id === shortcutId ? { ...s, value: newValue } : s));

    const global = updatedShortcuts.filter((s) => s.id === 'showHideApp');
    const internal = updatedShortcuts.filter((s) => s.id !== 'showHideApp');

    this.globalShortcuts.set(global);
    this.internalShortcuts.set(internal);

    this.editingShortcutId.set(null);
    this.tempShortcutValue.set('');

    window.electronAPI.enableShortcuts().catch(() => {});
    this.onShortcutSaved();
  }

  onShortcutSaved(): void {
    const global = this.globalShortcuts();
    const internal = this.internalShortcuts();

    const shortcutConfig: ShortcutConfig = {
      globalShortcuts: {
        showHideApp: global.find((s) => s.id === 'showHideApp')?.value || 'Super+I',
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

  isEditing(shortcutId: string): boolean {
    return this.editingShortcutId() === shortcutId;
  }

  getDisplayValue(shortcut: Shortcut): string {
    let value: string;
    if (this.isEditing(shortcut.id)) {
      value = this.tempShortcutValue();
    } else {
      value = shortcut.value;
    }

    return value;
  }
}
