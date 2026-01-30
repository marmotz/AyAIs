import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfig } from '../../../../app/app-config';

@Component({
  selector: 'app-settings-startup',
  standalone: true,
  templateUrl: './settings-startup.component.html',
  imports: [FormsModule],
})
export class SettingsStartupComponent implements OnInit {
  startupOnBoot = signal(false);
  launchHidden = signal(false);

  ngOnInit(): void {
    window.electronAPI
      .getAppConfig()
      .then((appConfig: AppConfig) => {
        this.startupOnBoot.set(appConfig.launchAtStartup);
        this.launchHidden.set(appConfig.launchHidden);
      })
      .catch(() => {});
  }

  onToggle(): void {
    const newConfig: Partial<AppConfig> = {
      launchAtStartup: this.startupOnBoot(),
      launchHidden: this.launchHidden(),
    };
    window.electronAPI.saveAppConfig(newConfig).catch(() => {});
  }
}
