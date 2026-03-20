import { Component, inject } from '@angular/core';
import { WhatsNewService } from '@app/services/whats-new.service';
import { WhatsnewComponent } from '@app/whatsnew/whatsnew.component';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-sidebar-whatsnew-dialog',
  imports: [DialogModule, WhatsnewComponent],
  templateUrl: './sidebar-whatsnew-dialog.component.html',
})
export class SidebarWhatsnewDialogComponent {
  private readonly whatsNewService = inject(WhatsNewService);

  get visible(): boolean {
    return this.whatsNewService.isVisible();
  }

  close(): void {
    this.whatsNewService.close();
  }
}
