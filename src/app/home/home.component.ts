import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  ViewChild,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { NavigationService } from '@app/services/navigation.service';
import { ShortcutActionEvent, ShortcutManagerService } from '@app/services/shortcut-manager.service';
import { WebviewService } from '@app/services/webview.service';
import { SidebarComponent } from '@app/sidebar/sidebar.component';
import type { WebviewTag } from 'electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [SidebarComponent, CommonModule, RouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class Home {
  private readonly navigationService = inject(NavigationService);
  private readonly webviewService = inject(WebviewService);
  private readonly router = inject(Router);
  private readonly shortcutManager = inject(ShortcutManagerService);

  private services: AIService[] = AI_SERVICES;

  @ViewChild('webviewsContainer', { static: true }) webviewsContainer!: ElementRef;
  private webviews = new Map<string, any>();

  protected readonly selectedService = signal<AIService | null>(null);
  protected readonly isAiServicesRoute = this.navigationService.isAiServicesRoute;

  constructor() {
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
          const webview: WebviewTag = this.webviews.get(selectedService.name);
          this.showWebview(webview);
        } else {
          this.hideAllWebviews();
        }
      }
    });
  }

  async onServiceSelected(service: AIService) {
    this.selectedService.set(service);
    const container = this.webviewsContainer?.nativeElement as HTMLElement;

    this.hideAllWebviews();

    // Create or show a dedicated webview for this service
    let webview: WebviewTag = this.webviews.get(service.name);
    if (!webview) {
      webview = await this.webviewService.createWebview(service);
      container?.appendChild(webview);
      this.webviews.set(service.name, webview);
    }

    this.showWebview(webview);

    await window.electronAPI.saveLastService(service.name);
  }

  private async navigateToService(service: AIService) {
    // Navigate to /app if we're not already there
    if (!this.isAiServicesRoute()) {
      await this.router.navigate(['/app']);
    }
    await this.onServiceSelected(service);
  }

  hideWebview(webview: WebviewTag) {
    webview.style.visibility = 'hidden';
    webview.style.height = '0';
    webview.style.width = '0';
  }

  showWebview(webview: WebviewTag) {
    webview.style.visibility = 'visible';
    webview.style.height = '100%';
    webview.style.width = '100%';
    webview.focus();
  }

  hideAllWebviews() {
    this.webviews.forEach((webview: WebviewTag) => {
      this.hideWebview(webview);
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

  private async handleShortcutAction(actionEvent: ShortcutActionEvent): Promise<void> {
    const { action, serviceIndex } = actionEvent;

    if (action === 'openSettings') {
      void this.router.navigate(['/app/settings']);
    } else if (action === 'quitApp') {
      await window.electronAPI.quitApp();
    } else if (action === 'nextService') {
      void this.router.navigate(['/app']);
      this.navigateToNextService();
    } else if (action === 'previousService') {
      void this.router.navigate(['/app']);
      this.navigateToPreviousService();
    } else if (action === 'selectService' && serviceIndex !== undefined) {
      if (serviceIndex >= 0 && serviceIndex < this.services.length) {
        void this.router.navigate(['/app']);
        await this.onServiceSelected(this.services[serviceIndex]);
      }
    }
  }

  public navigateToNextService() {
    const currentService = this.selectedService();
    if (!currentService) {
      return;
    }

    const currentIndex = this.services.findIndex((s) => s.name === currentService.name);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex === this.services.length - 1 ? 0 : currentIndex + 1;
    void this.navigateToService(this.services[nextIndex]);
  }

  public navigateToPreviousService() {
    const currentService = this.selectedService();
    if (!currentService) {
      return;
    }

    const currentIndex = this.services.findIndex((s) => s.name === currentService.name);
    if (currentIndex === -1) {
      return;
    }

    const previousIndex = currentIndex === 0 ? this.services.length - 1 : currentIndex - 1;
    void this.navigateToService(this.services[previousIndex]);
  }

  private loadLastService() {
    window.electronAPI.getLastService().then(async (lastServiceName: string | undefined) => {
      if (lastServiceName) {
        const service = this.services.find((s) => s.name === lastServiceName);
        if (service) {
          await this.onServiceSelected(service);
        }
      }
    });
  }
}
