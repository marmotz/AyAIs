import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, NO_ERRORS_SCHEMA, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { NavigationService } from '@app/services/navigation.service';
import { WebviewService } from '@app/services/webview.service';
import { SidebarComponent } from '@app/sidebar/sidebar.component';
import { WebviewTag } from 'electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [SidebarComponent, CommonModule, RouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class Home {
  private readonly navigationService = inject(NavigationService);
  private readonly webviewService = inject(WebviewService);

  private services: AIService[] = AI_SERVICES;

  @ViewChild('webviewsContainer', { static: true }) webviewsContainer!: ElementRef;
  private webviews = new Map<string, any>();

  protected readonly selectedService = signal<AIService | null>(null);
  protected readonly isAiServicesRoute = this.navigationService.isAiServicesRoute;

  constructor() {
    window.electronAPI.getLastService().then(async (lastServiceName: string | undefined) => {
      if (lastServiceName) {
        const service = this.services.find((s) => s.name === lastServiceName);
        if (service) {
          await this.onServiceSelected(service);
        }
      }
    });
  }

  async onServiceSelected(service: AIService) {
    this.selectedService.set(service);
    const container = this.webviewsContainer?.nativeElement as HTMLElement;

    // Hide all existing webviews
    this.webviews.forEach((webview: WebviewTag) => {
      webview.classList.add('invisible', 'size-0');
    });

    // Create or show a dedicated webview for this service
    let webview: WebviewTag = this.webviews.get(service.name);
    if (!webview) {
      webview = await this.webviewService.createWebview(service);
      container?.appendChild(webview);
      this.webviews.set(service.name, webview);
    } else {
      webview.classList.remove('invisible', 'size-0');
    }

    webview.focus();

    await window.electronAPI.saveLastService(service.name);
  }
}
