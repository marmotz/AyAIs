import { ViewportRuler } from '@angular/cdk/scrolling';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MOCK_CONFIG_WITH_SERVICES } from '@app-tests/test-config';
import { ConfiguredService } from '@app/ai-services/interfaces';
import { WhatsNewService } from '@app/services/whats-new.service';
import { TranslateModule } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from './home.component';

describe('Home', () => {
  let router: Router;
  let mockWhatsNewService: WhatsNewService;

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
      quitApp: vi.fn().mockResolvedValue(undefined),
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [Home, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: WhatsNewService, useValue: mockWhatsNewService },
        {
          provide: ViewportRuler,
          useValue: {
            getViewportRect: () => ({ top: 0, left: 0, bottom: 768, right: 1024, height: 768, width: 1024 }),
            getViewportSize: () => ({ width: 1024, height: 768 }),
            getViewportScrollPosition: () => ({ top: 0, left: 0 }),
          },
        },
      ],
    }).compileComponents();

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
    const reloadSpy = vi.fn();
    home['webviews'].set('default-chatgpt', { reload: reloadSpy });

    await home.refreshService(service);

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should select service when refreshing a different service', async () => {
    const home = TestBed.createComponent(Home).componentInstance;
    const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };

    const reloadSpy = vi.fn();
    home['webviews'].set('default-chatgpt', { reload: reloadSpy });

    await home.refreshService(service);

    expect(reloadSpy).toHaveBeenCalled();
    expect((home as any).selectedService()).toBe(service);
  });
});
