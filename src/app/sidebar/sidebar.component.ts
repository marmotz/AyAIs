import { CommonModule } from '@angular/common';
import { Component, computed, inject, model, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { NavigationService } from '@app/services/navigation.service';
import { WhatsnewComponent } from '@app/whatsnew/whatsnew.component';
import type { AppConfig } from '@shared/types/app-config.interface';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, DialogModule, WhatsnewComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly navigation = inject(NavigationService);
  protected readonly isAiServicesRoute = this.navigation.isAiServicesRoute;
  protected readonly isSettingsRoute = this.navigation.isSettingsRoute;

  services: AIService[] = AI_SERVICES;
  appConfig = signal<AppConfig | null>(null);
  whatsNewVisible = signal(false);

  serviceSelected = output<AIService>();
  selectedService = model<AIService | null>(null);
  selectedIndex = computed(() => this.services.findIndex((s) => s === this.selectedService()));

  private router = inject(Router);

  async ngOnInit() {
    await this.loadAppConfig();
  }

  private async loadAppConfig() {
    try {
      const config = await window.electronAPI.getAppConfig();
      this.appConfig.set(config);
    } catch (error) {
      console.error('Failed to load app config:', error);
    }
  }

  async onServiceClick(service: AIService) {
    this.selectedService.set(service);
    this.serviceSelected.emit(service);
    await this.router.navigate(['/app']);
  }

  async openSettings() {
    await this.router.navigate(['/app/settings']);
  }

  async openAiServices() {
    await this.router.navigate(['/app']);
  }

  async quitApp() {
    try {
      await window.electronAPI.quitApp();
    } catch (error) {
      console.error('Failed to quit app:', error);
    }
  }

  openWhatsNew() {
    this.whatsNewVisible.set(true);
  }

  getServiceTitle(service: AIService, index: number): string {
    const shortcut = this.appConfig()?.shortcuts?.internalShortcuts?.services?.['service' + (index + 1)];
    if (shortcut) {
      return `${service.name} (${shortcut})`;
    }
    return service.name;
  }

  getSettingsTitle(): string {
    const shortcut = this.appConfig()?.shortcuts?.internalShortcuts?.openSettings;
    if (shortcut) {
      return `Settings (${shortcut})`;
    }
    return 'Settings';
  }

  getQuitTitle(): string {
    const shortcut = this.appConfig()?.shortcuts?.internalShortcuts?.quitApp;
    if (shortcut) {
      return `Quit (${shortcut})`;
    }
    return 'Quit';
  }
}
