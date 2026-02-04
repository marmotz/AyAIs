import { Injectable } from '@angular/core';
import { AIService } from '@app/ai-services/interfaces';
import { WebviewTag } from 'electron';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebviewService {
  private isMac = false;

  private shortcutCapturedSubject = new Subject<string>();
  readonly shortcutCaptured = this.shortcutCapturedSubject.asObservable();

  private pendingShortcut: string | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 100;

  constructor() {
    void this.initializePlatform();
  }

  private flushShortcut(): void {
    if (this.pendingShortcut) {
      const shortcutToSend = this.pendingShortcut;
      this.pendingShortcut = null;
      this.shortcutCapturedSubject.next(shortcutToSend);
    }
    this.debounceTimer = null;
  }

  async createWebview(service: AIService) {
    const webview: WebviewTag = document.createElement('webview') as any;
    webview.id = `webview-${service.name.toLowerCase()}`;
    webview.style.display = 'flex';
    webview.partition = `persist:${service.name}`;
    webview.spellcheck = true;
    webview.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/142.0.0.0 Safari/537.36';

    webview.addEventListener('dom-ready', () => this.injectScript(webview, service));
    webview.addEventListener('console-message', async (e: any) => {
      const msg = e.message;
      if (msg.startsWith('AYAIS_')) {
        await window.electronAPI.logDebug(`webview message: ${e.message}`);
      }

      if (msg.startsWith('AYAIS_FORCE_EXTERNAL_OPEN:')) {
        const url = msg.replace('AYAIS_FORCE_EXTERNAL_OPEN:', '');
        await window.electronAPI.openExternal(url);
      } else if (msg.startsWith('AYAIS_SHORTCUT:')) {
        const shortcut = msg.replace('AYAIS_SHORTCUT:', '');
        this.handleShortcutFromWebview(shortcut);
      }
    });

    webview.src = service.url;

    return webview;
  }

  async injectScript(webview: WebviewTag, service: AIService) {
    await webview.executeJavaScript(`
      document.addEventListener('click', (e) => {
        // We search if the clicked element is a link or inside a link
        const link = e.target.closest('a');

        if (link && link.href && link.href.startsWith('http')) {
          const url = new URL(link.href);
          const currentOrigin = window.location.origin;

        // Compute whether the clicked link is internal to the current AI service
        const internalDomains = ${JSON.stringify(service.internalDomains)};
        const isInternal = internalDomains.includes(url.hostname);

        // If it is not internal and not the same origin, intercept
        if (!isInternal) {
            e.preventDefault();
            e.stopPropagation();

            // We send the URL to the outside world via the console
            // This is the most reliable way for Electron to hear it
            console.log('AYAIS_FORCE_EXTERNAL_OPEN:' + url);
          }
        }
      }, true); // The "true" is crucial: we capture the event before anyone else

      // Capture keyboard shortcuts to prevent them from being handled by the webview
      document.addEventListener('keydown', (e) => {
        const keys = [];
        const isMac = ${this.isMac};

        if (e.ctrlKey) {
          keys.push('Ctrl');
        }
        if (e.altKey) {
          keys.push(isMac ? 'Opt' : 'Alt');
        }
        if (e.shiftKey) {
          keys.push('Shift');
        }
        if (e.metaKey) {
          keys.push(isMac ? 'Cmd' : 'Meta');
        }

        // Get the main key
        let mainKey = e.key;
        if (e.code.startsWith('Digit')) {
          mainKey = e.code.replace('Digit', '');
        } else if (e.code.startsWith('Key')) {
          mainKey = e.key.toUpperCase();
        } else if (e.code.startsWith('Numpad')) {
          mainKey = 'Num' + e.key;
        } else if (e.code.startsWith('F') && e.code.length <= 3) {
          mainKey = e.code;
        }

        // Only process if we have modifier keys or special keys
        if (keys.length > 0 || ['Escape', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(mainKey)) {
          if (mainKey && !['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
            keys.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);
          }

          if (keys.length > 0) {
            const shortcut = keys.join('+');

            // Send the shortcut to the main process
            console.log('AYAIS_SHORTCUT:' + shortcut);
          }
        }
      }, true);
    `);
  }

  private handleShortcutFromWebview(shortcut: string) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (!this.pendingShortcut) {
      this.pendingShortcut = shortcut;
    }

    this.debounceTimer = setTimeout(() => this.flushShortcut(), this.DEBOUNCE_MS);
  }

  private async initializePlatform(): Promise<void> {
    const platform = await window.electronAPI.getPlatform();
    this.isMac = platform === 'darwin';
  }
}
