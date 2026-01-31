import { Component, inject, input, output } from '@angular/core';
import { ShortcutManagerService } from '@app/services/shortcut-manager.service';
import { InputText } from 'primeng/inputtext';
import { Shortcut } from '../shortcut.model';

@Component({
  selector: 'app-shortcut-input',
  standalone: true,
  imports: [InputText],
  templateUrl: './shortcut-input.component.html',
})
export class ShortcutInputComponent {
  private readonly shortcutManager = inject(ShortcutManagerService);

  readonly shortcut = input.required<Shortcut>();

  readonly startEditing = output<Shortcut>();

  getDisplayValue(): string {
    return this.shortcutManager.getDisplayValue(this.shortcut());
  }

  isEditing(): boolean {
    return this.shortcutManager.isEditing(this.shortcut().id);
  }

  hasValidationError(): boolean {
    return this.shortcutManager.hasValidationError(this.shortcut());
  }

  getValidationErrorMessage(): string {
    return this.shortcutManager.getValidationErrorMessage(this.shortcut());
  }
}
