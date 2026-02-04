import { inject, Injectable, signal } from '@angular/core';
import { MessageService } from 'primeng/api';

export type UpdateStatus = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
}

export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class AutoUpdateService {
  public readonly updateStatus = signal<UpdateStatus>('idle');
  public readonly updateInfo = signal<UpdateInfo | null>(null);
  public readonly downloadProgress = signal<DownloadProgress | null>(null);
  private readonly messageService = inject(MessageService);
  private lastDisplayedPercent = 0;

  constructor() {
    this.initializeListeners();
  }

  public downloadUpdate(): void {
    this.messageService.clear();
    this.updateStatus.set('downloading');
    this.lastDisplayedPercent = 0;
    this.downloadProgress.set(null);
    window.electronAPI.startUpdateDownload();
  }

  public quitAndInstall(): void {
    window.electronAPI.quitAndInstall();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private initializeListeners(): void {
    if (!window.electronAPI) {
      return;
    }

    window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
      this.updateInfo.set(info);
      this.updateStatus.set('available');
      this.showUpdateAvailableConfirmation();
    });

    window.electronAPI.onUpdateDownloaded(() => {
      this.downloadProgress.set(null);
      this.updateStatus.set('downloaded');
      this.showUpdateDownloadedConfirmation();
    });

    window.electronAPI.onUpdateDownloadProgress((progress: DownloadProgress) => {
      console.log(`[AutoUpdate] Download progress: ${Math.floor(progress.percent)}%`);
      this.updateDownloadingProgress(progress);
    });

    window.electronAPI.onUpdateDownloadFailed((error: string) => {
      console.error('[AutoUpdate] Download failed:', error);
      this.downloadProgress.set(null);
      this.updateStatus.set('error');
      this.messageService.clear();
      this.showDownloadErrorToast(error);
    });

    window.electronAPI.notifyRendererReady();
  }

  private showDownloadErrorToast(error: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: `Failed to download the update: ${error}`,
      sticky: true,
      data: {
        key: 'download-error-toast',
        primaryAction: {
          label: 'Retry',
          icon: ['fas', 'redo'],
          command: () => this.downloadUpdate(),
        },
        secondaryAction: {
          label: 'Close',
          icon: ['fas', 'times'],
          command: () => {
            this.downloadProgress.set(null);
            this.updateStatus.set('idle');
            this.messageService.clear();
          },
        },
      },
    });
  }

  private showUpdateAvailableConfirmation(): void {
    const info = this.updateInfo();
    const versionText = info ? `version ${info.version}` : 'version';
    this.messageService.clear();
    this.messageService.add({
      severity: 'info',
      summary: 'Update Available',
      detail: `A new ${versionText} of AyAIs is available. Would you like to download it now?`,
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
            this.downloadProgress.set(null);
            this.updateStatus.set('idle');
            this.messageService.clear();
          },
        },
      },
    });
  }

  private showUpdateDownloadedConfirmation(): void {
    this.messageService.clear();
    this.messageService.add({
      severity: 'success',
      summary: 'Update Ready to Install',
      detail: 'The update has been downloaded successfully. The application needs to restart to apply the update.',
      life: 0,
      sticky: true,
      data: {
        key: 'downloaded-toast',
        primaryAction: {
          label: 'Restart & Install',
          icon: ['fas', 'refresh'],
          command: () => this.quitAndInstall(),
        },
        secondaryAction: {
          label: 'Later',
          icon: ['fas', 'clock'],
          command: () => {
            this.downloadProgress.set(null);
            this.updateStatus.set('idle');
            this.messageService.clear();
          },
        },
      },
    });
  }

  private updateDownloadingProgress(progress: DownloadProgress): void {
    this.downloadProgress.set(progress);
  }
}
