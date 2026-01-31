import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShortcutManagerService } from '@app/services/shortcut-manager.service';
import { Shortcut } from '@app/settings/settings-shortcuts/shortcut.model';
import { ShortcutInputComponent } from './shortcut-input/shortcut-input.component';

@Component({
  selector: 'app-settings-shortcuts',
  standalone: true,
  templateUrl: './settings-shortcuts.component.html',
  imports: [CommonModule, FormsModule, ShortcutInputComponent],
})
export class SettingsShortcutsComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);
  protected readonly shortcutManager = inject(ShortcutManagerService);

  ngOnInit(): void {
    this.shortcutManager.loadShortcuts();
  }

  get globalShortcuts() {
    return this.shortcutManager.globalShortcuts;
  }

  get internalShortcuts() {
    return this.shortcutManager.internalShortcuts;
  }

  async startEditing(shortcut: Shortcut): Promise<void> {
    await this.shortcutManager.startEditing(shortcut);
  }

  isEditing(shortcutId: string): boolean {
    return this.shortcutManager.isEditing(shortcutId);
  }

  hasValidationError(shortcut: Shortcut): boolean {
    return this.shortcutManager.hasValidationError(shortcut);
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
