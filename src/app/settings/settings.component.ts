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

  // Startup-related settings
  startupOnBoot = false;
  launchHidden = false;
  selectedTab: 'startup' | 'shortcuts' = 'startup';

  ngOnInit(): void {
    window.electronAPI
      .getAppConfig()
      .then((appConfig: AppConfig) => {
        this.startupOnBoot = appConfig.launchAtStartup;
        this.launchHidden = appConfig.launchHidden;
      })
      .catch(() => {});
  }

  setTab(tab: 'startup' | 'shortcuts') {
    this.selectedTab = tab;
  }

  onToggle(): void {
    const newConfig: Partial<AppConfig> = {
      launchAtStartup: this.startupOnBoot,
      launchHidden: this.launchHidden,
    };
    window.electronAPI.saveAppConfig(newConfig).catch(() => {});
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
