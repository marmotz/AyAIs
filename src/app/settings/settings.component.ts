import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { SettingsShortcutsComponent } from './settings-shortcuts/settings-shortcuts.component';
import { SettingsStartupComponent } from './settings-startup/settings-startup.component';
import { SettingsUpdatesComponent } from './settings-updates/settings-updates.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  imports: [
    FormsModule,
    SettingsStartupComponent,
    SettingsShortcutsComponent,
    SettingsUpdatesComponent,
    Card,
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
  ],
  host: {
    class: 'block h-full',
  },
})
export class SettingsComponent {}
