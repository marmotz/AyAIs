import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class DevShortcutsService {
  private readonly router = inject(Router);
  private isDevMode = false;

  constructor() {
    console.log('[DevShortcutsService] Constructor called');
    void this.checkDevMode();
  }

  private async checkDevMode(): Promise<void> {
    console.log('[DevShortcutsService] Checking dev mode...');
    if (!window.electronAPI) {
      console.log('[DevShortcutsService] No electronAPI found');
      return;
    }

    try {
      this.isDevMode = await window.electronAPI.isDevMode();
      console.log('[DevShortcutsService] Dev mode:', this.isDevMode);
      if (this.isDevMode) {
        this.setupListeners();
        window.electronAPI.onOpenDevPage(() => {
          console.log('[DevShortcutsService] Opening dev page');
          this.router.navigate(['/app/dev']);
        });
      }
    } catch (error) {
      console.error('[DevShortcutsService] Failed to check dev mode:', error);
    }
  }

  private setupListeners(): void {
    console.log('[DevShortcutsService] Setting up keyboard listener');
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'd') {
        const target = event.target as HTMLElement;
        const isValid = target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable;

        console.log('[DevShortcutsService] Ctrl+D detected, valid:', isValid, 'Tag:', target.tagName);

        if (isValid) {
          event.preventDefault();
          event.stopPropagation();
          console.log('[DevShortcutsService] Sending dev shortcut to main process');
          window.electronAPI.sendDevShortcut();
        }
      }
    });
  }
}
