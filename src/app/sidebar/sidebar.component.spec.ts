import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AIService } from '@app/ai-services/interfaces';
import { NavigationService } from '@app/services/navigation.service';
import type { AppConfig } from '@shared/types/app-config.interface';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockRouter: Router;
  let mockNavigationService: NavigationService;

  const mockAppConfig: AppConfig = {
    position: { x: 100, y: 100, width: 800, height: 600 },
    lastService: 'chatgpt',
    launchAtStartup: true,
    launchHidden: false,
    shortcuts: {
      globalShortcuts: {
        showHideApp: 'CmdOrCtrl+Shift+A',
      },
      internalShortcuts: {
        openSettings: 'CmdOrCtrl+,',
        quitApp: 'CmdOrCtrl+Q',
        previousService: 'CmdOrCtrl+Left',
        nextService: 'CmdOrCtrl+Right',
        services: {
          service1: 'CmdOrCtrl+1',
          service2: 'CmdOrCtrl+2',
          service3: 'CmdOrCtrl+3',
        },
      },
    },
  };

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn(),
    } as unknown as Router;

    mockNavigationService = {
      isAiServicesRoute: vi.fn(() => true),
      isSettingsRoute: vi.fn(() => false),
    } as unknown as NavigationService;

    (window as any).electronAPI = {
      getAppConfig: vi.fn().mockResolvedValue(mockAppConfig),
      quitApp: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: NavigationService, useValue: mockNavigationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load app config on init', async () => {
      await component.ngOnInit();
      expect(window.electronAPI.getAppConfig).toHaveBeenCalled();
      expect(component.appConfig()).toEqual(mockAppConfig);
    });

    it('should handle errors when loading app config', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (window as any).electronAPI.getAppConfig = vi.fn().mockRejectedValue(new Error('Failed to load'));

      await component.ngOnInit();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load app config:', expect.any(Error));
      expect(component.appConfig()).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getServiceTitle', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should return service name with shortcut when available', () => {
      const service: AIService = {
        name: 'chatgpt',
        icon: 'path/to/icon.png',
        url: 'https://example.com',
        internalDomains: ['chatgpt.com'],
      };
      const title = component.getServiceTitle(service, 0);
      expect(title).toBe('chatgpt (CmdOrCtrl+1)');
    });

    it('should return service name without shortcut when not available', () => {
      const service: AIService = {
        name: 'unknown',
        icon: 'path/to/icon.png',
        url: 'https://example.com',
        internalDomains: ['example.com'],
      };
      const title = component.getServiceTitle(service, 5);
      expect(title).toBe('unknown');
    });
  });

  describe('getSettingsTitle', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should return settings title with shortcut when available', () => {
      const title = component.getSettingsTitle();
      expect(title).toBe('Settings (CmdOrCtrl+,)');
    });

    it('should return settings title without shortcut when not available', () => {
      component.appConfig.set(null);
      const title = component.getSettingsTitle();
      expect(title).toBe('Settings');
    });
  });

  describe('onServiceClick', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should set selected service and emit event', async () => {
      const service: AIService = {
        name: 'chatgpt',
        icon: 'path/to/icon.png',
        url: 'https://example.com',
        internalDomains: ['chatgpt.com'],
      };
      const emitSpy = vi.spyOn(component.serviceSelected, 'emit');

      await component.onServiceClick(service);

      expect(component.selectedService()).toBe(service);
      expect(emitSpy).toHaveBeenCalledWith(service);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app']);
    });
  });

  describe('openSettings', () => {
    it('should navigate to settings route', async () => {
      await component.openSettings();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/settings']);
    });
  });

  describe('openAiServices', () => {
    it('should navigate to app route', async () => {
      await component.openAiServices();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app']);
    });
  });

  describe('quitApp', () => {
    it('should call electronAPI quitApp', async () => {
      await component.quitApp();
      expect(window.electronAPI.quitApp).toHaveBeenCalled();
    });

    it('should handle errors when quitting app', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (window as any).electronAPI.quitApp = vi.fn().mockRejectedValue(new Error('Failed to quit'));

      await component.quitApp();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to quit app:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getQuitTitle', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should return quit title with shortcut when available', () => {
      const title = component.getQuitTitle();
      expect(title).toBe('Quit (CmdOrCtrl+Q)');
    });

    it('should return quit title without shortcut when not available', () => {
      component.appConfig.set(null);
      const title = component.getQuitTitle();
      expect(title).toBe('Quit');
    });
  });

  describe('openWhatsNew', () => {
    it('should open whats new modal', () => {
      component.openWhatsNew();
      expect(component.whatsNewVisible()).toBe(true);
    });

    it('should close whats new modal when setting signal to false', () => {
      component.whatsNewVisible.set(true);
      component.whatsNewVisible.set(false);
      expect(component.whatsNewVisible()).toBe(false);
    });
  });
});
