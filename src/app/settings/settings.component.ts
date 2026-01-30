import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsShortcutsComponent } from './settings-shortcuts/settings-shortcuts.component';
import { SettingsStartupComponent } from './settings-startup/settings-startup.component';
import { SettingsTabComponent } from './settings-tab/settings-tab.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  imports: [FormsModule, SettingsTabComponent, SettingsStartupComponent, SettingsShortcutsComponent],
})
export class SettingsComponent {
  private router = inject(Router);

  selectedTab = 'startup';

  async goBack(): Promise<void> {
    await this.router.navigate(['/app']);
  }
}
