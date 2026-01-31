import { TestBed } from '@angular/core/testing';
import { AIService } from '@app/ai-services/interfaces';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebviewService } from './webview.service';

describe('WebviewService', () => {
  let service: WebviewService;
  const mockElectronAPI = {
    openExternal: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    (window as any).electronAPI = {
      ...mockElectronAPI,
      getPlatform: () => Promise.resolve('linux'),
    };

    TestBed.configureTestingModule({
      providers: [WebviewService],
    });

    service = TestBed.inject(WebviewService);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create webview with correct attributes', async () => {
    const mockService: AIService = {
      name: 'TestService',
      url: 'https://example.com',
      icon: 'test-icon',
      internalDomains: ['example.com'],
    };

    const webview = await service.createWebview(mockService);

    expect(webview.style.display).toBe('flex');
    expect(webview.partition).toBe('persist:TestService');
    expect(webview.spellcheck).toBe(true);
    expect(webview.src).toBe('https://example.com');
  });

  it('should capture shortcuts from webview and emit them', async () => {
    const capturedShortcuts: string[] = [];
    service.shortcutCaptured.subscribe((shortcut) => {
      capturedShortcuts.push(shortcut);
    });

    const mockService: AIService = {
      name: 'TestService',
      url: 'https://example.com',
      icon: 'test-icon',
      internalDomains: ['example.com'],
    };

    const webview = await service.createWebview(mockService);

    const consoleMessageEvent = new Event('console-message');
    (consoleMessageEvent as any).message = 'AYAIS_SHORTCUT:Ctrl+Shift+A';

    webview.dispatchEvent(consoleMessageEvent);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(capturedShortcuts).toHaveLength(1);
    expect(capturedShortcuts[0]).toBe('Ctrl+Shift+A');
  });

  it('should debounce shortcut handling', async () => {
    const capturedShortcuts: string[] = [];
    service.shortcutCaptured.subscribe((shortcut) => {
      capturedShortcuts.push(shortcut);
    });

    const mockService: AIService = {
      name: 'TestService2',
      url: 'https://example2.com',
      icon: 'test-icon',
      internalDomains: ['example2.com'],
    };

    const webview = await service.createWebview(mockService);

    const consoleMessageEvent1 = new Event('console-message');
    (consoleMessageEvent1 as any).message = 'AYAIS_SHORTCUT:Ctrl+A';

    const consoleMessageEvent2 = new Event('console-message');
    (consoleMessageEvent2 as any).message = 'AYAIS_SHORTCUT:Ctrl+B';

    webview.dispatchEvent(consoleMessageEvent1);
    await new Promise((resolve) => setTimeout(resolve, 50));
    webview.dispatchEvent(consoleMessageEvent2);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(capturedShortcuts).toHaveLength(1);
    expect(capturedShortcuts[0]).toBe('Ctrl+A');
  });

  it('should handle multiple shortcuts when debounce period expires', async () => {
    const capturedShortcuts: string[] = [];
    service.shortcutCaptured.subscribe((shortcut) => {
      capturedShortcuts.push(shortcut);
    });

    const mockService: AIService = {
      name: 'TestService3',
      url: 'https://example3.com',
      icon: 'test-icon',
      internalDomains: ['example3.com'],
    };

    const webview = await service.createWebview(mockService);

    const consoleMessageEvent1 = new Event('console-message');
    (consoleMessageEvent1 as any).message = 'AYAIS_SHORTCUT:Ctrl+A';

    const consoleMessageEvent2 = new Event('console-message');
    (consoleMessageEvent2 as any).message = 'AYAIS_SHORTCUT:Ctrl+B';

    webview.dispatchEvent(consoleMessageEvent1);
    await new Promise((resolve) => setTimeout(resolve, 150));
    webview.dispatchEvent(consoleMessageEvent2);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(capturedShortcuts).toHaveLength(2);
    expect(capturedShortcuts[0]).toBe('Ctrl+A');
    expect(capturedShortcuts[1]).toBe('Ctrl+B');
  });
});
