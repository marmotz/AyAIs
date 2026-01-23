import { CommonModule } from '@angular/common';
import { Component, output } from '@angular/core';

export interface AIService {
  name: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  services: AIService[] = [
    { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🤖' },
    { name: 'Claude', url: 'https://claude.ai', icon: '🧠' },
    { name: 'Gemini', url: 'https://gemini.google.com', icon: '✨' },
  ];

  selectedService: AIService | null = null;

  serviceSelected = output<AIService>();

  onServiceClick(service: AIService) {
    this.selectedService = service;
    this.serviceSelected.emit(service);
  }
}
