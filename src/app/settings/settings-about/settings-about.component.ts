import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AppConfig, UpdateChannel } from '@shared/types/app-config.interface';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  prerelease: boolean;
}

@Component({
  selector: 'app-settings-about',
  standalone: true,
  templateUrl: './settings-about.component.html',
  imports: [FormsModule, Select, Button, FaIconComponent],
})
export class SettingsAboutComponent implements OnInit, OnDestroy {
  appVersion = signal<string>('');
  updateChannel = signal<UpdateChannel>('stable');
  isChecking = signal<boolean>(false);
  availableUpdate = signal<UpdateInfo | null>(null);
  channels: { label: string; value: UpdateChannel }[] = [
    { label: 'Stable', value: 'stable' },
    { label: 'Beta', value: 'beta' },
  ];
  private readonly messageService = inject(MessageService);

  async checkForUpdates(): Promise<void> {
    if (this.isChecking()) {
      return;
    }

    this.isChecking.set(true);
    this.availableUpdate.set(null);

    try {
      this.messageService.add({
        severity: 'info',
        summary: 'Checking for Updates',
        detail: 'Checking if a new version is available...',
        life: 3000,
      });

      await window.electronAPI.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      this.messageService.clear();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to check for updates. Please try again later.',
        life: 5000,
      });
      this.isChecking.set(false);
    }
  }

  loadAppConfig(): void {
    window.electronAPI
      .getAppConfig()
      .then((appConfig: AppConfig) => {
        this.updateChannel.set(appConfig.updateChannel);
      })
      .catch(() => {});
  }

  async loadAppVersion(): Promise<void> {
    try {
      const version = await window.electronAPI.getAppVersion();
      this.appVersion.set(version);
    } catch (error) {
      console.error('Failed to load app version:', error);
    }
  }

  ngOnDestroy(): void {
    // Note: IPC listeners in Electron cannot be easily removed
    // The listener will be garbage collected when component is destroyed
  }

  ngOnInit(): void {
    this.loadAppConfig();
    this.loadAppVersion();
    window.electronAPI.onUpdateNotAvailable(this.updateNotAvailableListener);
    window.electronAPI.onUpdateAvailable(this.updateAvailableListener);
  }

  onChange(): void {
    this.availableUpdate.set(null);
    const newConfig: Partial<AppConfig> = {
      updateChannel: this.updateChannel(),
    };
    window.electronAPI.saveAppConfig(newConfig).catch(() => {});
  }

  private readonly updateAvailableListener = (updateInfo: UpdateInfo): void => {
    this.availableUpdate.set(updateInfo);
    this.isChecking.set(false);
  };

  private readonly updateNotAvailableListener = (): void => {
    this.messageService.clear();
    this.messageService.add({
      severity: 'success',
      summary: 'Up to Date',
      detail: 'AyAIs is already up to date!',
      life: 3000,
    });
    this.isChecking.set(false);
  };
}
