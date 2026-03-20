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

  async createWebview(service: AIService, partitionKey?: string) {
    const webview: WebviewTag = document.createElement('webview') as any;
    webview.setAttribute('data-testid', `webview-${service.name.toLowerCase()}`);
    webview.style.display = 'flex';
    webview.partition = `persist:${partitionKey ?? service.name}`;
    webview.spellcheck = true;
    webview.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/142.0.0.0 Safari/537.36';

    webview.addEventListener('dom-ready', () => this.injectScript(webview, service));
    webview.addEventListener('did-navigate', () => this.injectScript(webview, service));
    webview.addEventListener('did-navigate-in-page', () => this.injectScript(webview, service));
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
    try {
      await webview.executeJavaScript(`
        (function() {
          if (window.__ayaScriptInjected) { return; }
          window.__ayaScriptInjected = true;

          var internalDomains = ${JSON.stringify(service.internalDomains)};
          var isMac = ${this.isMac};

          document.addEventListener('click', function(e) {
            var link = e.target.closest('a');

            if (link && link.href && link.href.startsWith('http')) {
              var url = new URL(link.href);
              var isInternal = internalDomains.indexOf(url.hostname) !== -1;

              if (!isInternal) {
                e.preventDefault();
                e.stopPropagation();
                console.log('AYAIS_FORCE_EXTERNAL_OPEN:' + url);
              }
            }
          }, true);

          document.addEventListener('keydown', function(e) {
            var keys = [];

            if (e.ctrlKey) { keys.push('Ctrl'); }
            if (e.altKey) { keys.push(isMac ? 'Opt' : 'Alt'); }
            if (e.shiftKey) { keys.push('Shift'); }
            if (e.metaKey) { keys.push(isMac ? 'Cmd' : 'Meta'); }

            var mainKey = e.key;
            if (e.code.startsWith('Digit')) { mainKey = e.code.replace('Digit', ''); }
            else if (e.code.startsWith('Key')) { mainKey = e.key.toUpperCase(); }
            else if (e.code.startsWith('Numpad')) { mainKey = 'Num' + e.key; }
            else if (e.code.startsWith('F') && e.code.length <= 3) { mainKey = e.code; }

            if (keys.length > 0 || ['Escape', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].indexOf(mainKey) !== -1) {
              if (mainKey && ['Control', 'Alt', 'Shift', 'Meta'].indexOf(mainKey) === -1) {
                keys.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey);
              }

              if (keys.length > 0) {
                console.log('AYAIS_SHORTCUT:' + keys.join('+'));
              }
            }
          }, true);
        })();
      `);
    } catch {
      // Webview may not be ready yet, script will be re-injected on next navigation event
    }
  }

  reloadWebview(webview: WebviewTag): void {
    if (webview) {
      webview.reload();
    }
  }

  private flushShortcut(): void {
    if (this.pendingShortcut) {
      const shortcutToSend = this.pendingShortcut;
      this.pendingShortcut = null;
      this.shortcutCapturedSubject.next(shortcutToSend);
    }
    this.debounceTimer = null;
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
