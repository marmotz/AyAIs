import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '@app/services/electron.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  imports: [CommonModule, FormsModule],
})
export class SettingsComponent implements OnInit {
  private electronService = inject(ElectronService);
  private router = inject(Router);

  // Startup-related settings
  startupOnBoot = false;
  launchMinimized = false;
  selectedTab: 'startup' | 'shortcuts' = 'startup';

  ngOnInit(): void {
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer
        ?.invoke('get-app-config')
        ?.then((cfg: any) => {
          if (cfg) {
            this.startupOnBoot = !!cfg.openOnStartup;
            this.launchMinimized = !!cfg.launchMinimized;
          }
        })
        .catch(() => {});
    }
  }

  setTab(tab: 'startup' | 'shortcuts') {
    this.selectedTab = tab;
  }

  onToggle(): void {
    // Persist changes whenever a toggle changes
    if (this.electronService?.ipcRenderer) {
      const cfg = {
        openOnStartup: this.startupOnBoot,
        launchMinimized: this.launchMinimized,
      };
      this.electronService.ipcRenderer.invoke('save-app-config', cfg).catch(() => {});
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
