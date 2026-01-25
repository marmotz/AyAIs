import { Injectable } from '@angular/core';
import { AIService } from '@app/ai-services/interfaces';
import { WebviewTag } from 'electron';

@Injectable({
  providedIn: 'root',
})
export class WebviewService {
  async createWebview(service: AIService) {
    const webview: WebviewTag = document.createElement('webview') as any;
    webview.style.width = '100%';
    webview.style.height = '100%';
    webview.style.display = 'flex';
    webview.partition = `persist:${service.name}`;
    webview.spellcheck = true;
    webview.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/142.0.0.0 Safari/537.36';

    webview.addEventListener('dom-ready', () => this.injectScript(webview, service));
    webview.addEventListener('console-message', (e: any) => {
      const msg = e.message;
      if (msg.startsWith('AYAIS_FORCE_EXTERNAL_OPEN:')) {
        const url = msg.replace('AYAIS_FORCE_EXTERNAL_OPEN:', '');
        window.electronAPI.openExternal(url);
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
      }, true); // The “true” is crucial: we capture the event before anyone else
    `);
  }
}
