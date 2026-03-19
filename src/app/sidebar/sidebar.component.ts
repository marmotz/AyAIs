import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, model, output, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { orderServices } from '@app/ai-services/order-services';
import { NavigationService } from '@app/services/navigation.service';
import { WhatsNewService } from '@app/services/whats-new.service';
import { WhatsnewComponent } from '@app/whatsnew/whatsnew.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import type { AppConfig } from '@shared/types/app-config.interface';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, CdkDropList, CdkDrag, ContextMenu, DialogModule, WhatsnewComponent, FaIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  services = signal<AIService[]>([...AI_SERVICES]);
  appConfig = signal<AppConfig | null>(null);
  serviceSelected = output<AIService>();
  serviceRefresh = output<AIService>();
  selectedService = model<AIService | null>(null);
  selectedIndex = computed(() => this.services().findIndex((s) => s === this.selectedService()));
  readonly contextMenu = viewChild.required<ContextMenu>('contextMenu');
  contextMenuService: AIService | null = null;
  menuItems: MenuItem[] = [
    {
      label: 'Refresh',
      icon: 'fas rotate-right',
      command: () => {
        if (this.contextMenuService) {
          this.serviceRefresh.emit(this.contextMenuService);
        }
      },
    },
  ];
  private readonly whatsNewService = inject(WhatsNewService);
  private readonly navigation = inject(NavigationService);
  protected readonly isAiServicesRoute = this.navigation.isAiServicesRoute;
  protected readonly isSettingsRoute = this.navigation.isSettingsRoute;
  private router = inject(Router);

  get whatsNewVisible(): boolean {
    return this.whatsNewService.isVisible();
  }

  closeWhatsNew() {
    this.whatsNewService.close();
  }

  getQuitTitle(): string {
    const shortcut = this.appConfig()?.shortcuts?.internalShortcuts?.quitApp;
    if (shortcut) {
      return `Quit (${shortcut})`;
    }
    return 'Quit';
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

  async ngOnInit() {
    await this.loadAppConfig();
    this.applyServiceOrder();
  }

  async onServiceClick(service: AIService) {
    this.selectedService.set(service);
    this.serviceSelected.emit(service);
    await this.router.navigate(['/app']);
  }

  onServiceContextMenu(event: MouseEvent, service: AIService) {
    this.contextMenuService = service;
    this.contextMenu().target = event.currentTarget as HTMLElement;
    this.contextMenu().show(event);
  }

  onServiceDropped(event: CdkDragDrop<AIService[]>) {
    if (event.previousIndex !== event.currentIndex) {
      const list = [...this.services()];
      const [moved] = list.splice(event.previousIndex, 1);
      list.splice(event.currentIndex, 0, moved);
      this.services.set(list);
      void this.saveServiceOrder();
    }
  }

  async openAiServices() {
    await this.router.navigate(['/app']);
  }

  async openSettings() {
    await this.router.navigate(['/app/settings']);
  }

  openWhatsNew() {
    this.whatsNewService.open();
  }

  async quitApp() {
    try {
      await window.electronAPI.quitApp();
    } catch (error) {
      console.error('Failed to quit app:', error);
    }
  }

  private async loadAppConfig() {
    try {
      const config = await window.electronAPI.getAppConfig();
      this.appConfig.set(config);
    } catch (error) {
      console.error('Failed to load app config:', error);
    }
  }

  private applyServiceOrder() {
    const config = this.appConfig();
    if (!config?.serviceOrder?.length) {
      return;
    }

    this.services.set(orderServices(config.serviceOrder));
  }

  private async saveServiceOrder() {
    const order = this.services().map((s) => s.name);
    try {
      await window.electronAPI.saveAppConfig({ serviceOrder: order });
      const config = this.appConfig();
      if (config) {
        this.appConfig.set({ ...config, serviceOrder: order });
      }
    } catch (error) {
      console.error('Failed to save service order:', error);
    }
  }
}
