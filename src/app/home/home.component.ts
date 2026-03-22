import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService, ConfiguredService } from '@app/ai-services/interfaces';
import { ConfigService } from '@app/services/config.service';
import { NavigationService } from '@app/services/navigation.service';
import { ShortcutActionEvent, ShortcutManagerService } from '@app/services/shortcut-manager.service';
import { WebviewService } from '@app/services/webview.service';
import { WhatsNewService } from '@app/services/whats-new.service';
import { SidebarComponent } from '@app/sidebar/sidebar.component';
import type { WebviewTag } from 'electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [SidebarComponent, RouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class Home {
  readonly webviewsContainer = viewChild.required<ElementRef>('webviewsContainer');
  protected readonly selectedService = signal<ConfiguredService | null>(null);
  private readonly navigationService = inject(NavigationService);
  protected readonly isAiServicesRoute = this.navigationService.isAiServicesRoute;
  private readonly webviewService = inject(WebviewService);
  private readonly router = inject(Router);
  private readonly shortcutManager = inject(ShortcutManagerService);
  private readonly whatsNewService = inject(WhatsNewService);
  private readonly configService = inject(ConfigService);
  private readonly configuredServices = this.configService.configuredServices;
  private webviews = new Map<string, any>();

  constructor() {
    void this.configService.loadConfig();
    this.loadLastService();

    window.electronAPI.onOpenSettings(() => {
      void this.router.navigate(['/app/settings']);
    });

    this.webviewService.shortcutCaptured.subscribe(async (shortcut) => {
      if (this.shortcutManager.canExecuteInternalShortcuts()) {
        const action = await this.shortcutManager.executeShortcut(shortcut);

        if (action) {
          await this.handleShortcutAction(action);
        }
      }
    });

    effect(() => {
      const selectedService = this.selectedService();
      const isAiServicesRoute = this.isAiServicesRoute();

      if (selectedService) {
        if (isAiServicesRoute) {
          const webview: WebviewTag = this.webviews.get(selectedService.id);
          this.showWebview(webview);
        } else {
          this.hideAllWebviews();
        }
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  async handleKeydown(event: KeyboardEvent): Promise<void> {
    const shortcut = this.shortcutManager.buildShortcutFromEvent(event);

    if (shortcut && this.shortcutManager.canExecuteInternalShortcuts()) {
      const action = await this.shortcutManager.executeShortcut(shortcut);

      if (action) {
        await this.handleShortcutAction(action);
      }
    }
  }

  hideAllWebviews() {
    this.webviews.forEach((webview: WebviewTag) => {
      this.hideWebview(webview);
    });
  }

  hideWebview(webview: WebviewTag) {
    webview.style.visibility = 'hidden';
    webview.style.height = '0';
    webview.style.width = '0';
  }

  public navigateToNextService() {
    const currentService = this.selectedService();
    if (!currentService) {
      return;
    }

    const services = this.configuredServices();
    const currentIndex = services.findIndex((p) => p.id === currentService.id);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex === services.length - 1 ? 0 : currentIndex + 1;
    void this.navigateToService(services[nextIndex]);
  }

  public navigateToPreviousService() {
    const currentService = this.selectedService();
    if (!currentService) {
      return;
    }

    const services = this.configuredServices();
    const currentIndex = services.findIndex((p) => p.id === currentService.id);
    if (currentIndex === -1) {
      return;
    }

    const previousIndex = currentIndex === 0 ? services.length - 1 : currentIndex - 1;
    void this.navigateToService(services[previousIndex]);
  }

  async onServiceSelected(configuredService: ConfiguredService) {
    this.selectedService.set(configuredService);
    const container = this.webviewsContainer()?.nativeElement as HTMLElement;

    this.hideAllWebviews();

    let webview: WebviewTag = this.webviews.get(configuredService.id);
    if (!webview) {
      const service = this.getService(configuredService);
      if (service) {
        webview = await this.webviewService.createWebview(service, configuredService.id);
        container?.appendChild(webview);
        this.webviews.set(configuredService.id, webview);
      }
    }

    if (webview) {
      this.showWebview(webview);
    }

    await window.electronAPI.saveLastService(configuredService.id);
  }

  onServiceRemoved(configuredService: ConfiguredService) {
    const webview: WebviewTag | undefined = this.webviews.get(configuredService.id);
    if (webview) {
      webview.remove();
      this.webviews.delete(configuredService.id);
    }

    if (this.selectedService()?.id === configuredService.id) {
      this.selectedService.set(null);
    }
  }

  public async refreshService(service?: ConfiguredService): Promise<void> {
    const serviceToRefresh = service || this.selectedService();
    if (!serviceToRefresh) {
      return;
    }

    const webview: WebviewTag = this.webviews.get(serviceToRefresh.id);
    if (webview) {
      this.webviewService.reloadWebview(webview);
      if (this.selectedService()?.id !== serviceToRefresh.id) {
        this.selectedService.set(serviceToRefresh);
      }
    }
  }

  showWebview(webview: WebviewTag) {
    webview.style.visibility = 'visible';
    webview.style.height = '100%';
    webview.style.width = '100%';
    webview.focus();
  }

  private getService(service: ConfiguredService): AIService | undefined {
    return AI_SERVICES.find((s) => s.name === service.serviceName);
  }

  private async handleShortcutAction(actionEvent: ShortcutActionEvent): Promise<void> {
    const { action, serviceIndex } = actionEvent;

    if (action === 'openSettings') {
      void this.router.navigate(['/app/settings']);
    } else if (action === 'quitApp') {
      await window.electronAPI.quitApp();
    } else if (action === 'nextService') {
      void this.router.navigate(['/app']);
      this.navigateToNextService();
      this.whatsNewService.close();
    } else if (action === 'previousService') {
      void this.router.navigate(['/app']);
      this.navigateToPreviousService();
      this.whatsNewService.close();
    } else if (action === 'refreshService') {
      await this.refreshService();
    } else if (action === 'selectService' && serviceIndex !== undefined) {
      const services = this.configuredServices();
      if (serviceIndex >= 0 && serviceIndex < services.length) {
        void this.router.navigate(['/app']);
        await this.onServiceSelected(services[serviceIndex]);
        this.whatsNewService.close();
      }
    }
  }

  private loadLastService() {
    window.electronAPI.getLastService().then(async (lastServiceId: string | undefined) => {
      if (lastServiceId) {
        const services = this.configuredServices();
        const service = services.find((p) => p.id === lastServiceId);
        if (service) {
          await this.onServiceSelected(service);
        }
      }
    });
  }

  private async navigateToService(service: ConfiguredService) {
    if (!this.isAiServicesRoute()) {
      await this.router.navigate(['/app']);
    }
    await this.onServiceSelected(service);
  }
}

