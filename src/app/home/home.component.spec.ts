import { ViewportRuler } from '@angular/cdk/scrolling';
import { Component, computed, Input, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MOCK_CONFIG_WITH_SERVICES } from '@app-tests/test-config';
import { ConfiguredService } from '@app/ai-services/interfaces';
import { ConfigService } from '@app/services/config.service';
import { WhatsNewService } from '@app/services/whats-new.service';
import { SidebarComponent } from '@app/sidebar/sidebar.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from './home.component';

@Component({
  selector: 'fa-icon',
  template: '',
  standalone: true,
})
class MockFaIconComponent {
  @Input() icon: any;
  @Input() size: any;
  @Input() spin: any;
  @Input() pulse: any;
  @Input() border: any;
  @Input() pull: any;
  @Input() listItem: any;
  @Input() rotate: any;
  @Input() flip: any;
  @Input() stackItemSize: any;
  @Input() fullWidth: any;
  @Input() inverse: any;
  @Input() className: any;
  @Input() transform: any;
  @Input() mask: any;
  @Input() symbol: any;
  @Input() title: any;
  @Input() animation: any;
}

describe('Home', () => {

  let router: Router;
  let mockWhatsNewService: WhatsNewService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockWhatsNewService = {
      isVisible: vi.fn(() => false),
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    } as unknown as WhatsNewService;

    (window as any).electronAPI = {
      getLastService: vi.fn().mockResolvedValue(undefined),
      saveLastService: vi.fn(),
      openExternal: vi.fn(),
      onNavigateService: vi.fn(),
      onSelectService: vi.fn(),
      onOpenSettings: vi.fn(),
      getAppConfig: vi.fn().mockResolvedValue({ ...MOCK_CONFIG_WITH_SERVICES }),
      saveAppConfig: vi.fn().mockResolvedValue(undefined),
      quitApp: vi.fn().mockResolvedValue(undefined),
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });


    const configSignal = signal<any>({ ...MOCK_CONFIG_WITH_SERVICES });
    mockConfigService = {
      appConfig: configSignal,
      configuredServices: computed(() => configSignal()?.configuredServices ?? []),
      shortcuts: computed(() => configSignal()?.shortcuts),
      loadConfig: vi.fn().mockImplementation(async () => {
        const config = await (window as any).electronAPI.getAppConfig();
        configSignal.set(config);
      }),
      updateConfig: vi.fn().mockImplementation(async (partial) => {
        const current = configSignal();
        configSignal.set({ ...current, ...partial });
        await (window as any).electronAPI.saveAppConfig(partial);
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [Home, TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: WhatsNewService, useValue: mockWhatsNewService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: ViewportRuler,
          useValue: {
            getViewportRect: () => ({ top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 }),
            getViewportSize: () => ({ width: 1024, height: 768 }),
            getViewportScrollPosition: () => ({ top: 0, left: 0 }),
          },
        },
      ],
    })
      .overrideComponent(SidebarComponent, {
        remove: { imports: [FaIconComponent] },
        add: { imports: [MockFaIconComponent] },
      })
      .compileComponents();


    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    delete (window as any).electronAPI;
    vi.clearAllTimers();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Home);
    const home = fixture.componentInstance;
    expect(home).toBeTruthy();
  });

  it('should not execute internal shortcuts when editing a shortcut', async () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const spy = vi.spyOn(home, 'navigateToNextService' as any);

    await home.handleKeydown(new KeyboardEvent('keydown', { key: 'Q', ctrlKey: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should execute internal shortcuts when not editing', async () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const spy = vi.spyOn(home, 'navigateToNextService' as any);

    await home.handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', ctrlKey: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('should refresh current service when refresh shortcut is triggered', async () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const refreshSpy = vi.spyOn(home, 'refreshService' as any);

    await home.handleKeydown(new KeyboardEvent('keydown', { key: 'R', ctrlKey: true }));
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('should refresh service when serviceRefresh is called', async () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

    await home.onServiceSelected(service);
    const reloadIgnoringCacheSpy = vi.fn();
    home['webviews'].set('default-chatgpt', {
      executeJavaScript: vi.fn().mockResolvedValue(undefined),
      reloadIgnoringCache: reloadIgnoringCacheSpy,
    });

    await home.refreshService(service);

    expect(reloadIgnoringCacheSpy).toHaveBeenCalled();
  });

  it('should select service when refreshing a different service', async () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

    const reloadIgnoringCacheSpy = vi.fn();
    home['webviews'].set('default-chatgpt', {
      executeJavaScript: vi.fn().mockResolvedValue(undefined),
      reloadIgnoringCache: reloadIgnoringCacheSpy,
    });

    await home.refreshService(service);

    expect(reloadIgnoringCacheSpy).toHaveBeenCalled();
    expect((home as any).selectedService()).toBe(service);
  });

  it('should open dev tools for the selected webview', async () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

    const openDevToolsSpy = vi.fn();
    home['webviews'].set('default-chatgpt', { openDevTools: openDevToolsSpy });

    home.openServiceDevTools(service);

    expect(openDevToolsSpy).toHaveBeenCalled();
  });

  it('should not throw opening dev tools for an unknown service', () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const service: ConfiguredService = { id: 'unknown', serviceName: 'ChatGPT' };

    expect(() => home.openServiceDevTools(service)).not.toThrow();
  });

  describe('onServiceRemoved', () => {
    it('should remove webview from DOM and map', async () => {
      const home = TestBed.createComponent(Home).componentInstance;
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

      const removeSpy = vi.fn();
      home['webviews'].set('default-chatgpt', { remove: removeSpy });

      home.onServiceRemoved(service);

      expect(removeSpy).toHaveBeenCalled();
      expect(home['webviews'].has('default-chatgpt')).toBe(false);
    });

    it('should clear selectedService when removed service is selected', async () => {
      const home = TestBed.createComponent(Home).componentInstance;
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

      (home as any).selectedService.set(service);
      home['webviews'].set('default-chatgpt', { remove: vi.fn() });

      home.onServiceRemoved(service);

      expect((home as any).selectedService()).toBeNull();
    });

    it('should not clear selectedService when removed service is not selected', async () => {
      const home = TestBed.createComponent(Home).componentInstance;
      const removedService: ConfiguredService = { id: 'default-claude', serviceName: 'Claude' };
      const selectedService: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

      (home as any).selectedService.set(selectedService);
      home['webviews'].set('default-claude', { remove: vi.fn() });

      home.onServiceRemoved(removedService);

      expect((home as any).selectedService()).toBe(selectedService);
    });

    it('should handle removing service without webview gracefully', async () => {
      const home = TestBed.createComponent(Home).componentInstance;
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

      expect(() => home.onServiceRemoved(service)).not.toThrow();
    });
  });

  it('should navigate to next service correctly even after config update', async () => {
    const fixture = TestBed.createComponent(Home);
    const home = fixture.componentInstance;
    fixture.detectChanges();

    // Initial state: ChatGPT, Claude, Gemini
    const services = mockConfigService.configuredServices();
    await home.onServiceSelected(services[0]); // ChatGPT selected

    expect((home as any).selectedService()).toBe(services[0]);

    // Simulate adding a service via ConfigService
    const newService = { id: 'new-service', serviceName: 'New AI' };
    await mockConfigService.updateConfig({
      configuredServices: [...services, newService]
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Now navigate to next service
    home.navigateToNextService();

    fixture.detectChanges();
    await fixture.whenStable();

    // Next after ChatGPT (index 0) should be Claude (index 1)
    expect((home as any).selectedService()).toBe(services[1]);

    // Go to Gemini
    await home.onServiceSelected(services[2]);
    fixture.detectChanges();

    // Next after Gemini (index 2) should be New AI (index 3)
    home.navigateToNextService();
    fixture.detectChanges();
    await fixture.whenStable();

    expect((home as any).selectedService()).toBe(newService);
  });

});

