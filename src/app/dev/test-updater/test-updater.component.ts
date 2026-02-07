import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AutoUpdateService } from '@app/services/auto-update.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-test-updater',
  templateUrl: './test-updater.component.html',
  imports: [CardModule, ButtonModule, FaIconComponent],
  host: {
    class: 'block h-full',
  },
})
export class TestUpdaterComponent {
  public readonly autoUpdateService = inject(AutoUpdateService);
  private readonly router = inject(Router);

  goBack(): void {
    void this.router.navigate(['/app/dev']);
  }

  simulateUpdateAvailable(): void {
    if (window.electronAPI) {
      window.electronAPI.simulateUpdateAvailable();
    }
  }

  async checkForUpdates(): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.checkForUpdates();
    }
  }
}
