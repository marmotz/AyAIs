import { inject, Injectable, signal } from '@angular/core';
import { MessageService } from 'primeng/api';

export type UpdateStatus = 'idle' | 'available';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
}

@Injectable({
  providedIn: 'root',
})
export class AutoUpdateService {
  public readonly updateStatus = signal<UpdateStatus>('idle');
  public readonly updateInfo = signal<UpdateInfo | null>(null);
  private readonly messageService = inject(MessageService);

  constructor() {
    this.initializeListeners();
  }

  public async openUpdateURL(): Promise<void> {
    await window.electronAPI.openUpdateURL();
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

    window.electronAPI.onUpdateNotAvailable(() => {
      this.updateStatus.set('idle');
    });
  }

  private showUpdateAvailableConfirmation(): void {
    const info = this.updateInfo();
    const versionText = info ? `version ${info.version}` : 'new version';
    this.messageService.clear();
    this.messageService.add({
      severity: 'success',
      summary: 'Update Available',
      detail: `A ${versionText} of AyAIs is available. Visit the GitHub repository to download the latest version.`,
      sticky: true,
    });
  }
}
