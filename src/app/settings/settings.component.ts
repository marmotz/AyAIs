import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { SettingsShortcutsComponent } from './settings-shortcuts/settings-shortcuts.component';
import { SettingsStartupComponent } from './settings-startup/settings-startup.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  imports: [
    FormsModule,
    SettingsStartupComponent,
    SettingsShortcutsComponent,
    Card,
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
  ],
})
export class SettingsComponent {
  private router = inject(Router);
}
