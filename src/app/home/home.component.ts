import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, NO_ERRORS_SCHEMA, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { ElectronService } from '@app/services/electron.service';
import { NavigationService } from '@app/services/navigation.service';
import { SidebarComponent } from '@app/sidebar/sidebar.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [SidebarComponent, CommonModule, RouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class Home {
  private readonly electron = inject(ElectronService);
  private readonly navigation = inject(NavigationService);

  private services: AIService[] = AI_SERVICES;

  @ViewChild('webviewsContainer', { static: true }) webviewsContainer!: ElementRef;
  private webviews = new Map<string, any>();

  protected readonly selectedService = signal<AIService | null>(null);
  protected readonly isAiServicesRoute = this.navigation.isAiServicesRoute;

  constructor() {
    if (this.electron.isElectron) {
      this.electron.ipcRenderer.invoke('get-last-service').then((lastServiceName: string | null) => {
        if (lastServiceName) {
          const service = this.services.find((s) => s.name === lastServiceName);
          if (service) {
            this.onServiceSelected(service);
          }
        }
      });
    } else {
      console.log('Run in browser');
    }
  }

  onServiceSelected(service: AIService) {
    this.selectedService.set(service);
    const container = this.webviewsContainer?.nativeElement as HTMLElement;

    // Hide all existing webviews
    this.webviews.forEach((wv) => {
      wv.style.display = 'none';
    });

    // Create or show a dedicated webview for this service
    let wv = this.webviews.get(service.name);
    if (!wv) {
      wv = document.createElement('webview') as any;
      wv.style.width = '100%';
      wv.style.height = '100%';
      wv.style.display = 'flex';
      wv.src = service.url;
      wv.partition = `persist:${service.name}`;
      container?.appendChild(wv);
      this.webviews.set(service.name, wv);
    } else {
      wv.style.display = 'flex';
    }

    // Save selected service
    if (this.electron.isElectron) {
      this.electron.ipcRenderer.invoke('save-service', service.name);
    }
  }
}
