import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AIService, ConfiguredService } from '@app/ai-services/interfaces';
import { NavigationService } from '@app/services/navigation.service';
import type { AppConfig } from '@shared/types/app-config.interface';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarContextmenuComponent } from './sidebar-contextmenu/sidebar-contextmenu.component';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockRouter: Router;
  let mockNavigationService: NavigationService;

  const mockAppConfig: AppConfig = {
    position: { x: 100, y: 100, width: 800, height: 600 },
    lastService: 'default-chatgpt',
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
    configuredServices: [
      { id: 'default-chatgpt', serviceName: 'ChatGPT' },
      { id: 'default-claude', serviceName: 'Claude' },
      { id: 'default-gemini', serviceName: 'Gemini' },
    ],
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
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

    it('should load configured services on init', async () => {
      await component.ngOnInit();
      expect(component.configuredServices()).toEqual(mockAppConfig.configuredServices);
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

    it('should return service display name with shortcut when available', () => {
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };
      const title = component.getServiceTitle(service, 0);
      expect(title).toBe('ChatGPT (CmdOrCtrl+1)');
    });

    it('should return service display name without shortcut when not available', () => {
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };
      const title = component.getServiceTitle(service, 5);
      expect(title).toBe('ChatGPT');
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
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };
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

  describe('onServiceContextMenu', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should call contextMenu show with event', () => {
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };
      const mockEvent = new MouseEvent('contextmenu');
      const contextMenuComponent = { show: vi.fn() } as unknown as SidebarContextmenuComponent;
      vi.spyOn(component as any, 'contextMenu').mockReturnValue(contextMenuComponent);

      component.onServiceContextMenu(mockEvent, service);

      expect(contextMenuComponent.show).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('onContextMenuRefresh', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should emit serviceRefresh with context menu service', () => {
      const service: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };
      const emitSpy = vi.spyOn(component.serviceRefresh, 'emit');
      (component as any).contextMenuService = service;

      component.onContextMenuRefresh();

      expect(emitSpy).toHaveBeenCalledWith(service);
    });

    it('should not emit when no context menu service', () => {
      const emitSpy = vi.spyOn(component.serviceRefresh, 'emit');

      component.onContextMenuRefresh();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('onContextMenuRemove', () => {
    beforeEach(async () => {
      (window as any).electronAPI.saveAppConfig = vi.fn().mockResolvedValue(undefined);
      await component.ngOnInit();
    });

    it('should remove context menu service', () => {
      const service = component.configuredServices()[0];
      (component as any).contextMenuService = service;

      component.onContextMenuRemove();

      expect(component.configuredServices().find((p) => p.id === service.id)).toBeUndefined();
    });

    it('should not remove when no context menu service', () => {
      const initialLength = component.configuredServices().length;

      component.onContextMenuRemove();

      expect(component.configuredServices().length).toBe(initialLength);
    });
  });

  describe('removeService', () => {
    beforeEach(async () => {
      (window as any).electronAPI.saveAppConfig = vi.fn().mockResolvedValue(undefined);
      await component.ngOnInit();
    });

    it('should remove service from list', () => {
      const service = component.configuredServices()[0];
      component.removeService(service);

      expect(component.configuredServices().length).toBe(2);
      expect(component.configuredServices().find((p) => p.id === service.id)).toBeUndefined();
    });

    it('should save config after removing', async () => {
      const service = component.configuredServices()[0];
      component.removeService(service);

      await vi.runAllTimersAsync();

      expect(window.electronAPI.saveAppConfig).toHaveBeenCalledWith({
        configuredServices: component.configuredServices(),
      });
    });

    it('should select next service when removing selected service', async () => {
      const firstService = component.configuredServices()[0];
      component.selectedService.set(firstService);

      component.removeService(firstService);

      expect(component.selectedService()).toEqual(component.configuredServices()[0]);
    });

    it('should emit serviceSelected when removing currently selected service', async () => {
      const firstService = component.configuredServices()[0];
      component.selectedService.set(firstService);
      const emitSpy = vi.spyOn(component.serviceSelected, 'emit');

      component.removeService(firstService);

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('addService', () => {
    beforeEach(async () => {
      (window as any).electronAPI.saveAppConfig = vi.fn().mockResolvedValue(undefined);
      await component.ngOnInit();
    });

    it('should add service to list', () => {
      const service: AIService = {
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: 'assets/ai-services/chatgpt.svg',
        internalDomains: ['chat.openai.com'],
      };
      const initialLength = component.configuredServices().length;

      component.addService(service);

      expect(component.configuredServices().length).toBe(initialLength + 1);
      const added = component.configuredServices()[component.configuredServices().length - 1];
      expect(added.serviceName).toBe('ChatGPT');
      expect(added.id).toContain('chatgpt-');
    });

    it('should save config after adding', async () => {
      const service: AIService = {
        name: 'Claude',
        url: 'https://claude.ai',
        icon: 'assets/ai-services/claude.svg',
        internalDomains: ['claude.ai'],
      };

      component.addService(service);

      await vi.runAllTimersAsync();

      expect(window.electronAPI.saveAppConfig).toHaveBeenCalled();
    });

    it('should allow adding same service multiple times', () => {
      const service: AIService = {
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: 'assets/ai-services/chatgpt.svg',
        internalDomains: ['chat.openai.com'],
      };

      component.addService(service);
      component.addService(service);

      const chatgptServices = component.configuredServices().filter((p) => p.serviceName === 'ChatGPT');
      expect(chatgptServices.length).toBeGreaterThan(1);
      expect(chatgptServices[0].id).not.toBe(chatgptServices[1].id);
    });
  });

  describe('displayNames', () => {
    beforeEach(async () => {
      (window as any).electronAPI.saveAppConfig = vi.fn().mockResolvedValue(undefined);
      await component.ngOnInit();
    });

    it('should return service name for first instance', () => {
      const names = component.displayNames();
      const chatgpt = component.configuredServices().find((p) => p.serviceName === 'ChatGPT');
      expect(names.get(chatgpt!.id)).toBe('ChatGPT');
    });

    it('should return numbered name for duplicates', () => {
      const service: AIService = {
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: 'assets/ai-services/chatgpt.svg',
        internalDomains: ['chat.openai.com'],
      };
      component.addService(service);

      const names = component.displayNames();
      const chatgptServices = component.configuredServices().filter((p) => p.serviceName === 'ChatGPT');
      expect(names.get(chatgptServices[0].id)).toBe('ChatGPT');
      expect(names.get(chatgptServices[1].id)).toBe('ChatGPT 2');
    });
  });

  describe('onServiceDropped', () => {
    beforeEach(async () => {
      (window as any).electronAPI.saveAppConfig = vi.fn().mockResolvedValue(undefined);
      await component.ngOnInit();
    });

    it('should reorder services when dropped at different index', () => {
      const originalOrder = component.configuredServices().map((p) => p.id);
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
      } as CdkDragDrop<ConfiguredService[]>;

      component.onServiceDropped(event);

      expect(component.configuredServices()[0].id).toBe(originalOrder[1]);
      expect(component.configuredServices()[1].id).toBe(originalOrder[2]);
      expect(component.configuredServices()[2].id).toBe(originalOrder[0]);
    });

    it('should save configured services after drop', async () => {
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
      } as CdkDragDrop<ConfiguredService[]>;

      component.onServiceDropped(event);

      await vi.runAllTimersAsync();

      expect(window.electronAPI.saveAppConfig).toHaveBeenCalledWith({
        configuredServices: component.configuredServices(),
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
      } as CdkDragDrop<ConfiguredService[]>;

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
      } as CdkDragDrop<ConfiguredService[]>;

      component.onServiceDropped(event);

      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save configured services:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('addServiceDialog', () => {
    it('should open add service dialog', () => {
      component.openAddServiceDialog();
      expect(component.addServiceDialogVisible()).toBe(true);
    });
  });

  describe('getService', () => {
    it('should return AIService for known service', () => {
      const configuredService: ConfiguredService = { id: 'default-chatgpt', serviceName: 'ChatGPT' };
      const service = component.getService(configuredService);
      expect(service).toBeDefined();
      expect(service?.name).toBe('ChatGPT');
    });

    it('should return undefined for unknown service', () => {
      const configuredService: ConfiguredService = { id: 'unknown', serviceName: 'Unknown' };
      const service = component.getService(configuredService);
      expect(service).toBeUndefined();
    });
  });

  describe('configured services from config', () => {
    it('should load configured services on init', async () => {
      await component.ngOnInit();

      expect(component.configuredServices()[0].serviceName).toBe('ChatGPT');
      expect(component.configuredServices()[1].serviceName).toBe('Claude');
      expect(component.configuredServices()[2].serviceName).toBe('Gemini');
    });

    it('should handle empty configured services', async () => {
      const configWithEmpty = {
        ...mockAppConfig,
        configuredServices: [],
      };
      (window as any).electronAPI.getAppConfig = vi.fn().mockResolvedValue(configWithEmpty);

      await component.ngOnInit();

      expect(component.configuredServices().length).toBe(0);
    });
  });
});
