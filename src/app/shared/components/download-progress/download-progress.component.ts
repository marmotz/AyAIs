import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AutoUpdateService } from '@app/services/auto-update.service';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-download-progress',
  imports: [CommonModule, ProgressBar],
  templateUrl: './download-progress.component.html',
})
export class DownloadProgressComponent {
  private readonly autoUpdateService = inject(AutoUpdateService);
  protected readonly progress = this.autoUpdateService.downloadProgress;

  public formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
