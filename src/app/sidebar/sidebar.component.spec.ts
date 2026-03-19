import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';
import { NavigationService } from '@app/services/navigation.service';
import { WhatsNewService } from '@app/services/whats-new.service';
import type { AppConfig } from '@shared/types/app-config.interface';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockRouter: Router;
  let mockNavigationService: NavigationService;
  let mockWhatsNewService: WhatsNewService;

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
        refreshService: 'CmdOrCtrl+R',
        services: {
          service1: 'CmdOrCtrl+1',
          service2: 'CmdOrCtrl+2',
          service3: 'CmdOrCtrl+3',
        },
      },
    },
    updateChannel: 'stable',
    serviceOrder: [],
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    mockRouter = {
      navigate: vi.fn(),
    } as unknown as Router;

    mockNavigationService = {
      isAiServicesRoute: vi.fn(() => true),
      isSettingsRoute: vi.fn(() => false),
    } as unknown as NavigationService;

    mockWhatsNewService = {
      isVisible: vi.fn(() => false),
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    } as unknown as WhatsNewService;

    (window as any).electronAPI = {
      getAppConfig: vi.fn().mockResolvedValue(mockAppConfig),
      quitApp: vi.fn().mockResolvedValue(undefined),
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: WhatsNewService, useValue: mockWhatsNewService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Run all timers including future ones to clean up debounced debug logs
    vi.runAllTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
    // Don't delete the mock - the setup file will maintain it
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
      expect(mockWhatsNewService.open).toHaveBeenCalled();
    });

    it('should close whats new modal', () => {
      component.closeWhatsNew();
      expect(mockWhatsNewService.close).toHaveBeenCalled();
    });

    it('should return visibility status', () => {
      vi.mocked(mockWhatsNewService.isVisible).mockReturnValue(true);
      expect(component.whatsNewVisible).toBe(true);
    });
  });

  describe('onServiceContextMenu', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should set contextMenuService and show context menu', () => {
      const service: AIService = {
        name: 'chatgpt',
        icon: 'path/to/icon.png',
        url: 'https://example.com',
        internalDomains: ['chatgpt.com'],
      };
      const mockEvent = new MouseEvent('contextmenu');
      const showSpy = vi.fn();
      vi.spyOn(component.contextMenu(), 'show').mockImplementation(showSpy);

      component.onServiceContextMenu(mockEvent, service);

      expect(component.contextMenuService).toBe(service);
      expect(showSpy).toHaveBeenCalledWith(mockEvent);
      expect(component.contextMenu().target).toBe(mockEvent.currentTarget);
    });
  });

  describe('serviceRefresh output', () => {
    it('should emit serviceRefresh when menu item command is called', () => {
      const service: AIService = {
        name: 'chatgpt',
        icon: 'path/to/icon.png',
        url: 'https://example.com',
        internalDomains: ['chatgpt.com'],
      };
      const emitSpy = vi.spyOn(component.serviceRefresh, 'emit');
      component.contextMenuService = service;

      component.menuItems[0].command!({} as any);

      expect(emitSpy).toHaveBeenCalledWith(service);
    });
  });

  describe('onServiceDropped', () => {
    beforeEach(async () => {
      (window as any).electronAPI.saveAppConfig = vi.fn().mockResolvedValue(undefined);
      await component.ngOnInit();
    });

    it('should reorder services when dropped at different index', () => {
      const originalOrder = component.services().map((s) => s.name);
      const event = {
        previousIndex: 0,
        currentIndex: 2,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop'),
      } as CdkDragDrop<AIService[]>;

      component.onServiceDropped(event);

      expect(component.services()[0].name).toBe(originalOrder[1]);
      expect(component.services()[1].name).toBe(originalOrder[2]);
      expect(component.services()[2].name).toBe(originalOrder[0]);
    });

    it('should save service order after drop', async () => {
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop'),
      } as CdkDragDrop<AIService[]>;

      component.onServiceDropped(event);

      await vi.runAllTimersAsync();

      expect(window.electronAPI.saveAppConfig).toHaveBeenCalledWith({
        serviceOrder: component.services().map((s) => s.name),
      });
    });

    it('should not save when dropped at same index', () => {
      const event = {
        previousIndex: 1,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop'),
      } as CdkDragDrop<AIService[]>;

      component.onServiceDropped(event);

      expect(window.electronAPI.saveAppConfig).not.toHaveBeenCalled();
    });

    it('should handle save error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (window as any).electronAPI.saveAppConfig = vi.fn().mockRejectedValue(new Error('Save failed'));

      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop'),
      } as CdkDragDrop<AIService[]>;

      component.onServiceDropped(event);

      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save service order:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('service order from config', () => {
    it('should apply saved service order on init', async () => {
      const orderedConfig: AppConfig = {
        ...mockAppConfig,
        serviceOrder: ['Gemini', 'ChatGPT', 'Claude'],
      };
      (window as any).electronAPI.getAppConfig = vi.fn().mockResolvedValue(orderedConfig);

      await component.ngOnInit();

      expect(component.services()[0].name).toBe('Gemini');
      expect(component.services()[1].name).toBe('ChatGPT');
      expect(component.services()[2].name).toBe('Claude');
    });

    it('should append unknown services from saved order', async () => {
      const orderedConfig: AppConfig = {
        ...mockAppConfig,
        serviceOrder: ['Claude'],
      };
      (window as any).electronAPI.getAppConfig = vi.fn().mockResolvedValue(orderedConfig);

      await component.ngOnInit();

      expect(component.services()[0].name).toBe('Claude');
      expect(component.services().length).toBe(AI_SERVICES.length);
    });

    it('should keep default order when serviceOrder is empty', async () => {
      const configWithEmptyOrder: AppConfig = {
        ...mockAppConfig,
        serviceOrder: [],
      };
      (window as any).electronAPI.getAppConfig = vi.fn().mockResolvedValue(configWithEmptyOrder);

      await component.ngOnInit();

      expect(component.services()[0].name).toBe('ChatGPT');
      expect(component.services()[1].name).toBe('Claude');
      expect(component.services()[2].name).toBe('Gemini');
    });
  });
});
