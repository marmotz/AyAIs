import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService, ConfiguredService } from '@app/ai-services/interfaces';
import { ConfigService } from '@app/services/config.service';
import { NavigationService } from '@app/services/navigation.service';
import { WhatsNewService } from '@app/services/whats-new.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SidebarAddServiceDialogComponent } from './sidebar-add-service-dialog/sidebar-add-service-dialog.component';
import { SidebarContextmenuComponent } from './sidebar-contextmenu/sidebar-contextmenu.component';
import { SidebarWhatsnewDialogComponent } from './sidebar-whatsnew-dialog/sidebar-whatsnew-dialog.component';

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    FaIconComponent,
    SidebarContextmenuComponent,
    SidebarWhatsnewDialogComponent,
    SidebarAddServiceDialogComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly configService = inject(ConfigService);
  configuredServices = this.configService.configuredServices;
  appConfig = this.configService.appConfig;
  serviceSelected = output<ConfiguredService>();
  serviceRefresh = output<ConfiguredService>();
  serviceRemoved = output<ConfiguredService>();
  selectedService = model<ConfiguredService | null>(null);
  selectedIndex = computed(() => this.configuredServices().findIndex((p) => p.id === this.selectedService()?.id));
  addServiceDialogVisible = signal(false);
  displayNames = computed(() => {
    const configuredServices = this.configuredServices();
    const nameCounts = new Map<string, number>();
    const names = new Map<string, string>();

    for (const configuredService of configuredServices) {
      const count = (nameCounts.get(configuredService.serviceName) ?? 0) + 1;
      nameCounts.set(configuredService.serviceName, count);
      names.set(
        configuredService.id,
        count === 1 ? configuredService.serviceName : `${configuredService.serviceName} ${count}`
      );
    }

    return names;
  });
  private readonly navigation = inject(NavigationService);
  private readonly whatsNewService = inject(WhatsNewService);
  protected readonly isAiServicesRoute = this.navigation.isAiServicesRoute;
  protected readonly isSettingsRoute = this.navigation.isSettingsRoute;
  private readonly router = inject(Router);
  private readonly contextMenu = viewChild.required(SidebarContextmenuComponent);
  private readonly servicesContainer = viewChild.required<ElementRef>('servicesContainer');
  private contextMenuService: ConfiguredService | null = null;

  constructor() {
    effect(() => {
      this.selectedIndex();
      this.scrollToSelectedService();
    });
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.scrollToSelectedService();
  }

  addService(service: AIService) {
    const newService: ConfiguredService = {
      id: `${service.name.toLowerCase()}-${Date.now()}`,
      serviceName: service.name,
    };
    const list = [...this.configuredServices(), newService];
    this.selectedService.set(newService);
    this.serviceSelected.emit(newService);
    void this.configService.updateConfig({ configuredServices: list });
  }

  getQuitTitle(): string {
    const shortcut = this.appConfig()?.shortcuts?.internalShortcuts?.quitApp;
    if (shortcut) {
      return `Quit (${shortcut})`;
    }

    return 'Quit';
  }

  getService(service: ConfiguredService): AIService | undefined {
    return AI_SERVICES.find((s) => s.name === service.serviceName);
  }

  getServiceTitle(service: ConfiguredService, index: number): string {
    const displayName = this.displayNames().get(service.id) ?? service.serviceName;
    const shortcut = this.appConfig()?.shortcuts?.internalShortcuts?.services?.['service' + (index + 1)];
    if (shortcut) {
      return `${displayName} (${shortcut})`;
    }

    return displayName;
  }

  getSettingsTitle(): string {
    const shortcut = this.appConfig()?.shortcuts?.internalShortcuts?.openSettings;
    if (shortcut) {
      return `Settings (${shortcut})`;
    }

    return 'Settings';
  }

  onContextMenuRefresh() {
    if (this.contextMenuService) {
      this.serviceRefresh.emit(this.contextMenuService);
    }
  }

  onContextMenuRemove() {
    if (this.contextMenuService) {
      this.removeService(this.contextMenuService);
    }
  }

  async onServiceClick(service: ConfiguredService) {
    this.selectedService.set(service);
    this.serviceSelected.emit(service);
    await this.router.navigate(['/app']);
  }

  onServiceContextMenu(event: MouseEvent, service: ConfiguredService) {
    this.contextMenuService = service;
    this.contextMenu().show(event);
  }

  onServiceDropped(event: CdkDragDrop<ConfiguredService[]>) {
    if (event.previousIndex !== event.currentIndex) {
      const list = [...this.configuredServices()];
      const [moved] = list.splice(event.previousIndex, 1);
      list.splice(event.currentIndex, 0, moved);
      void this.configService.updateConfig({ configuredServices: list });
    }
  }

  openAddServiceDialog() {
    this.addServiceDialogVisible.set(true);
  }

  openWhatsNew() {
    this.whatsNewService.open();
  }

  async openAiServices() {
    await this.router.navigate(['/app']);
  }

  async openSettings() {
    await this.router.navigate(['/app/settings']);
  }

  async quitApp() {
    try {
      await window.electronAPI.quitApp();
    } catch (error) {
      console.error('Failed to quit app:', error);
    }
  }

  removeService(service: ConfiguredService) {
    const currentIndex = this.configuredServices().findIndex((p) => p.id === service.id);
    const list = this.configuredServices().filter((p) => p.id !== service.id);
    this.serviceRemoved.emit(service);

    if (this.selectedService()?.id === service.id) {
      const next = list[currentIndex] ?? list[currentIndex - 1] ?? null;
      this.selectedService.set(next);
      if (next) {
        this.serviceSelected.emit(next);
      }
    }

    void this.configService.updateConfig({ configuredServices: list });
  }

  private scrollToSelectedService() {
    const container = this.servicesContainer().nativeElement as HTMLElement;
    const service = this.selectedService();
    if (!service) {
      return;
    }

    const button = container.querySelector(`[data-testid="sidebar-button-${service.id}"]`);
    if (!button) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    if (buttonRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - buttonRect.top;
    } else if (buttonRect.bottom > containerRect.bottom) {
      container.scrollTop += buttonRect.bottom - containerRect.bottom;
    }
  }
}

