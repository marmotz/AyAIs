import { CommonModule } from '@angular/common';
import { Component, computed, inject, model, output } from '@angular/core';
import { Router } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { NavigationService } from '@app/services/navigation.service';
import '@fontsource/michroma';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly navigation = inject(NavigationService);
  protected readonly isAiServicesRoute = this.navigation.isAiServicesRoute;
  protected readonly isSettingsRoute = this.navigation.isSettingsRoute;

  services: AIService[] = AI_SERVICES;

  serviceSelected = output<AIService>();
  selectedService = model<AIService | null>(null);
  selectedIndex = computed(() => this.services.findIndex((s) => s === this.selectedService()));

  private router = inject(Router);

  onServiceClick(service: AIService) {
    this.selectedService.set(service);
    this.serviceSelected.emit(service);
    this.router.navigate(['/app']);
  }

  openSettings() {
    this.router.navigate(['/app/settings']);
  }
}
