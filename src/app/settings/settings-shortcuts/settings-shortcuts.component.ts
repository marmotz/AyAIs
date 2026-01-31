import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShortcutManagerService } from '@app/services/shortcut-manager.service';
import { InputText } from 'primeng/inputtext';
import { Shortcut } from './shortcut.model';

@Component({
  selector: 'app-settings-shortcuts',
  standalone: true,
  templateUrl: './settings-shortcuts.component.html',
  imports: [CommonModule, FormsModule, InputText],
})
export class SettingsShortcutsComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly shortcutManager = inject(ShortcutManagerService);

  ngOnInit(): void {
    this.shortcutManager.loadShortcuts();
  }

  get globalShortcuts() {
    return this.shortcutManager.globalShortcuts;
  }

  get internalShortcuts() {
    return this.shortcutManager.internalShortcuts;
  }

  isEditing(shortcutId: string): boolean {
    return this.shortcutManager.isEditing(shortcutId);
  }

  getDisplayValue(shortcut: Shortcut): string {
    return this.shortcutManager.getDisplayValue(shortcut);
  }

  hasValidationError(shortcut: Shortcut): boolean {
    return this.shortcutManager.hasValidationError(shortcut);
  }

  getValidationErrorMessage(shortcut: Shortcut): string {
    return this.shortcutManager.getValidationErrorMessage(shortcut);
  }

  async startEditing(shortcut: Shortcut): Promise<void> {
    await this.shortcutManager.startEditing(shortcut);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    this.shortcutManager.handleEditingKeydown(event);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const editingId = this.shortcutManager.editingShortcutId();
    if (!editingId) {
      return;
    }

    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.shortcutManager.cancelEditing();
    }
  }
}
