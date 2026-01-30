import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_SHORTCUTS, Shortcut } from './shortcut.model';

@Component({
  selector: 'app-settings-shortcuts',
  standalone: true,
  templateUrl: './settings-shortcuts.component.html',
  imports: [CommonModule, FormsModule],
})
export class SettingsShortcutsComponent {
  private isMac = signal<boolean>(navigator.platform.toLowerCase().includes('mac'));

  shortcuts = signal<Shortcut[]>([
    DEFAULT_SHORTCUTS.previousService,
    DEFAULT_SHORTCUTS.nextService,
    ...DEFAULT_SHORTCUTS.services,
  ]);

  editingShortcutId = signal<string | null>(null);
  tempShortcutValue = signal<string>('');

  startEditing(shortcut: Shortcut): void {
    this.editingShortcutId.set(shortcut.id);
    this.tempShortcutValue.set(shortcut.value);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const editingId = this.editingShortcutId();
    if (!editingId) {
      return;
    }

    if (event.key === 'Escape') {
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

    if (event.key && !['Control', 'Alt', 'Shift', 'Meta', 'Escape'].includes(event.key)) {
      keys.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
    }

    if (keys.length > 0) {
      this.tempShortcutValue.set(keys.join('+'));
    }
  }

  saveShortcut(shortcutId: string): void {
    const newValue = this.tempShortcutValue();

    this.shortcuts.update((shortcuts) => shortcuts.map((s) => (s.id === shortcutId ? { ...s, value: newValue } : s)));

    this.editingShortcutId.set(null);
    this.tempShortcutValue.set('');

    this.onShortcutSaved(shortcutId, newValue);
  }

  onShortcutSaved(shortcutId: string, value: string): void {
    console.log(`Shortcut saved: ${shortcutId} = ${value}`);
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
