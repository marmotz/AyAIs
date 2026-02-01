import { inject, Injectable, signal } from '@angular/core';
import { MessageService } from 'primeng/api';

export type UpdateStatus = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error';

@Injectable({
  providedIn: 'root',
})
export class AutoUpdateService {
  public readonly updateStatus = signal<UpdateStatus>('idle');
  private readonly messageService = inject(MessageService);

  constructor() {
    this.initializeListeners();
  }

  public downloadUpdate(): void {
    this.updateStatus.set('downloading');
    window.electronAPI.startUpdateDownload();
  }

  public quitAndInstall(): void {
    window.electronAPI.quitAndInstall();
  }

  private initializeListeners(): void {
    if (!window.electronAPI) {
      return;
    }

    window.electronAPI.onUpdateAvailable(() => {
      console.log('Update available 🥳');

      this.updateStatus.set('available');
      this.showUpdateAvailableConfirmation();
    });

    window.electronAPI.onUpdateDownloaded(() => {
      this.updateStatus.set('downloaded');
      this.showUpdateDownloadedConfirmation();
    });
  }

  private showUpdateAvailableConfirmation(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Update Available',
      detail: 'A new version of AyAIs is available. Would you like to download it now?',
      sticky: true,
      data: {
        key: 'update-toast',
        primaryAction: {
          label: 'Download',
          icon: ['fas', 'download'],
          command: () => this.downloadUpdate(),
        },
        secondaryAction: {
          label: 'Ignore',
          icon: ['fas', 'times'],
          command: () => {
            this.updateStatus.set('idle');
            this.messageService.clear();
          },
        },
      },
    });
  }

  private showUpdateDownloadedConfirmation(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Update Ready to Install',
      detail: 'The update has been downloaded successfully. The application needs to restart to apply the update.',
      life: 0,
      key: 'update-toast',
      sticky: true,
      data: {
        primaryAction: {
          label: 'Restart & Install',
          icon: 'fa-refresh',
          command: () => this.quitAndInstall(),
        },
        secondaryAction: {
          label: 'Later',
          icon: 'fa-clock',
          command: () => {
            this.updateStatus.set('idle');
            this.messageService.clear('update-toast');
          },
        },
      },
    });
  }
}
