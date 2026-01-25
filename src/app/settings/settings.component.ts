import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppConfig } from '../../../app/app-config';
import { SettingTabComponent } from './setting-tab/setting-tab.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  imports: [CommonModule, FormsModule, SettingTabComponent],
})
export class SettingsComponent implements OnInit {
  private router = inject(Router);

  private appConfig!: AppConfig;

  // Startup-related settings
  startupOnBoot = false;
  launchMinimized = false;
  selectedTab: 'startup' | 'shortcuts' = 'startup';

  ngOnInit(): void {
    window.electronAPI
      .getAppConfig()
      .then((appConfig: AppConfig) => {
        this.appConfig = appConfig;

        this.startupOnBoot = appConfig.openOnStartup;
        this.launchMinimized = appConfig.launchMinimized;
      })
      .catch(() => {});
  }

  setTab(tab: 'startup' | 'shortcuts') {
    this.selectedTab = tab;
  }

  onToggle(): void {
    const appConfig: AppConfig = {
      ...this.appConfig,
      openOnStartup: this.startupOnBoot,
      launchMinimized: this.launchMinimized,
    };
    window.electronAPI.saveAppConfig(appConfig).catch(() => {});
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
