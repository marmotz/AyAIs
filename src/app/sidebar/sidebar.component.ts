import { CommonModule } from '@angular/common';
import { Component, model, output } from '@angular/core';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  services: AIService[] = AI_SERVICES;

  serviceSelected = output<AIService>();
  selectedService = model<AIService | null>(null);

  onServiceClick(service: AIService) {
    this.selectedService.set(service);
    this.serviceSelected.emit(service);
  }
}
