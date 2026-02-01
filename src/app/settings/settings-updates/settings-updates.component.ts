import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfig, UpdateChannel } from '@shared/types/app-config.interface';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-settings-updates',
  standalone: true,
  templateUrl: './settings-updates.component.html',
  imports: [FormsModule, Select],
})
export class SettingsUpdatesComponent implements OnInit {
  updateChannel = signal<UpdateChannel>('stable');

  channels: { label: string; value: UpdateChannel }[] = [
    { label: 'Stable', value: 'stable' },
    { label: 'Beta', value: 'beta' },
  ];

  ngOnInit(): void {
    window.electronAPI
      .getAppConfig()
      .then((appConfig: AppConfig) => {
        this.updateChannel.set(appConfig.updateChannel);
      })
      .catch(() => {});
  }

  onChange(): void {
    const newConfig: Partial<AppConfig> = {
      updateChannel: this.updateChannel(),
    };
    window.electronAPI.saveAppConfig(newConfig).catch(() => {});
  }
}
