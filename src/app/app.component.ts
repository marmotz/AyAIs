import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AutoUpdateService } from '@app/services/auto-update.service';
import { DevShortcutsService } from '@app/services/dev-shortcuts.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faBug } from '@fortawesome/free-solid-svg-icons/faBug';
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faRefresh } from '@fortawesome/free-solid-svg-icons/faRefresh';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, Toast],
  providers: [DevShortcutsService],
})
export class App {
  private readonly fortAwesomeIconLibrary = inject(FaIconLibrary);

  constructor() {
    // init dev shortcuts if in dev mode
    void inject(DevShortcutsService);

    // init auto update listeners
    void inject(AutoUpdateService);

    // init font awesome icons
    this.fortAwesomeIconLibrary.addIcons(
      faArrowLeft,
      faBug,
      faClock,
      faDownload,
      faInfoCircle,
      faPlus,
      faRefresh,
      faRotateRight,
      faTimes,
      faTrash
    );
  }
}
