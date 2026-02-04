import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AutoUpdateService } from '@app/services/auto-update.service';
import { DevShortcutsService } from '@app/services/dev-shortcuts.service';
import { FaIconComponent, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faRefresh } from '@fortawesome/free-solid-svg-icons/faRefresh';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { PrimeTemplate } from 'primeng/api';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { DownloadProgressComponent } from './shared/components/download-progress/download-progress.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [CommonModule, RouterOutlet, Toast, Button, FaIconComponent, PrimeTemplate, DownloadProgressComponent],
  providers: [DevShortcutsService],
})
export class App {
  private readonly fortAwesomeIconlibrary = inject(FaIconLibrary);

  constructor() {
    // init dev shortcuts if in dev mode
    void inject(DevShortcutsService);

    // init auto update listeners
    void inject(AutoUpdateService);

    // init font awesome icons
    this.fortAwesomeIconlibrary.addIcons(faRefresh, faArrowLeft, faDownload, faTimes, faClock);
  }
}
