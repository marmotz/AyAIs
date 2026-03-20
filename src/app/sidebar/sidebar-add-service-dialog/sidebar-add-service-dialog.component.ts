import { Component, model, output } from '@angular/core';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-sidebar-add-service-dialog',
  imports: [DialogModule],
  templateUrl: './sidebar-add-service-dialog.component.html',
})
export class SidebarAddServiceDialogComponent {
  visible = model<boolean>(false);
  serviceAdded = output<AIService>();

  availableServices = [...AI_SERVICES].sort((a, b) => a.name.localeCompare(b.name));

  addService(service: AIService): void {
    this.serviceAdded.emit(service);
    this.visible.set(false);
  }

  close(): void {
    this.visible.set(false);
  }
}
