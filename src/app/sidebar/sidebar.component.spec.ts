import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AIService, ConfiguredService } from '@app/ai-services/interfaces';
import { ConfigService } from '@app/services/config.service';
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
  let mockConfigService: any;

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
      saveAppConfig: vi.fn().mockResolvedValue(undefined),
      quitApp: vi.fn().mockResolvedValue(undefined),
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    const configSignal = signal<any>({ ...mockAppConfig });
    mockConfigService = {
      appConfig: configSignal,
      configuredServices: computed(() => configSignal()?.configuredServices ?? []),
      shortcuts: computed(() => configSignal()?.shortcuts),
      updateConfig: vi.fn().mockImplementation(async (partial) => {
        const current = configSignal();
        configSignal.set({ ...current, ...partial });
      }),
      loadConfig: vi.fn().mockResolvedValue(undefined),
    };


    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: ConfigService, useValue: mockConfigService },
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

  describe('initialization', () => {
    it('should have app config from service', () => {
      expect(component.appConfig()).toEqual(mockAppConfig);
    });

    it('should have configured services from service', () => {
      expect(component.configuredServices()).toEqual(mockAppConfig.configuredServices);
    });
  });

  describe('getServiceTitle', () => {
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
    it('should return settings title with shortcut when available', () => {
      const title = component.getSettingsTitle();
      expect(title).toBe('Settings (CmdOrCtrl+,)');
    });

    it('should return settings title without shortcut when not available', () => {
      mockConfigService.appConfig.set(null);
      const title = component.getSettingsTitle();
      expect(title).toBe('Settings');
    });
  });

  describe('onServiceClick', () => {
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
    it('should return quit title with shortcut when available', () => {
      const title = component.getQuitTitle();
      expect(title).toBe('Quit (CmdOrCtrl+Q)');
    });

    it('should return quit title without shortcut when not available', () => {
      mockConfigService.appConfig.set(null);
      const title = component.getQuitTitle();
      expect(title).toBe('Quit');
    });
  });

  describe('onServiceContextMenu', () => {
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
    it('should remove service from list', () => {
      const service = component.configuredServices()[0];
      component.removeService(service);

      expect(component.configuredServices().length).toBe(2);
      expect(component.configuredServices().find((p) => p.id === service.id)).toBeUndefined();
    });

    it('should update config after removing', async () => {
      const service = component.configuredServices()[0];
      const initialServices = [...component.configuredServices()];
      component.removeService(service);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        configuredServices: expect.arrayContaining([initialServices[1], initialServices[2]]),
      });
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        configuredServices: expect.not.arrayContaining([service]),
      });
    });

    it('should select next service when removing selected service', async () => {
      const firstService = component.configuredServices()[0];
      const secondService = component.configuredServices()[1];
      component.selectedService.set(firstService);

      component.removeService(firstService);

      expect(component.selectedService()).toEqual(secondService);
    });

    it('should select previous service when removing last selected service', async () => {
      const lastService = component.configuredServices()[2];
      const secondService = component.configuredServices()[1];
      component.selectedService.set(lastService);

      component.removeService(lastService);

      expect(component.selectedService()).toEqual(secondService);
    });

    it('should select null when removing the only service', async () => {
      mockConfigService.appConfig.set({
        ...mockAppConfig,
        configuredServices: [{ id: 'default-chatgpt', serviceName: 'ChatGPT' }],
      });

      const onlyService = component.configuredServices()[0];
      component.selectedService.set(onlyService);

      component.removeService(onlyService);

      expect(component.selectedService()).toBeNull();
    });

    it('should emit serviceSelected when removing currently selected service', async () => {
      const firstService = component.configuredServices()[0];
      component.selectedService.set(firstService);
      const emitSpy = vi.spyOn(component.serviceSelected, 'emit');

      component.removeService(firstService);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit serviceRemoved with removed service', () => {
      const service = component.configuredServices()[0];
      const emitSpy = vi.spyOn(component.serviceRemoved, 'emit');

      component.removeService(service);

      expect(emitSpy).toHaveBeenCalledWith(service);
    });
  });

  describe('addService', () => {
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

    it('should update config after adding', async () => {
      const service: AIService = {
        name: 'Claude',
        url: 'https://claude.ai',
        icon: 'assets/ai-services/claude.svg',
        internalDomains: ['claude.ai'],
      };

      component.addService(service);

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
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

    it('should select the newly added service', () => {
      const service: AIService = {
        name: 'Gemini',
        url: 'https://gemini.google.com',
        icon: 'assets/ai-services/gemini.svg',
        internalDomains: ['gemini.google.com'],
      };

      component.addService(service);

      expect(component.selectedService()?.serviceName).toBe('Gemini');
    });

    it('should emit serviceSelected when adding a service', () => {
      const service: AIService = {
        name: 'Gemini',
        url: 'https://gemini.google.com',
        icon: 'assets/ai-services/gemini.svg',
        internalDomains: ['gemini.google.com'],
      };
      const emitSpy = vi.spyOn(component.serviceSelected, 'emit');

      component.addService(service);

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ serviceName: 'Gemini' }));
    });
  });

  describe('displayNames', () => {
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

    it('should update configured services after drop', async () => {
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

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
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

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
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

  describe('scrollToSelectedService', () => {
    it('should not throw when no service is selected', () => {
      component.selectedService.set(null);
      expect(() => (component as any).scrollToSelectedService()).not.toThrow();
    });

    it('should scroll down when button is below container', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'getBoundingClientRect', {
        value: () => ({ top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 100 }),
      });

      const button = document.createElement('button');
      button.setAttribute('data-testid', 'sidebar-button-default-chatgpt');
      Object.defineProperty(button, 'getBoundingClientRect', {
        value: () => ({ top: 150, bottom: 214, left: 0, right: 100, width: 100, height: 64 }),
      });
      container.appendChild(button);

      vi.spyOn(component as any, 'servicesContainer').mockReturnValue({ nativeElement: container });
      component.selectedService.set(component.configuredServices()[0]);
      container.scrollTop = 0;

      (component as any).scrollToSelectedService();

      expect(container.scrollTop).toBe(114);
    });

    it('should scroll up when button is above container', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'getBoundingClientRect', {
        value: () => ({ top: 100, bottom: 200, left: 0, right: 100, width: 100, height: 100 }),
      });

      const button = document.createElement('button');
      button.setAttribute('data-testid', 'sidebar-button-default-chatgpt');
      Object.defineProperty(button, 'getBoundingClientRect', {
        value: () => ({ top: 50, bottom: 114, left: 0, right: 100, width: 100, height: 64 }),
      });
      container.appendChild(button);

      vi.spyOn(component as any, 'servicesContainer').mockReturnValue({ nativeElement: container });
      component.selectedService.set(component.configuredServices()[0]);
      container.scrollTop = 50;

      (component as any).scrollToSelectedService();

      expect(container.scrollTop).toBe(0);
    });

    it('should not scroll when button is already visible', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'getBoundingClientRect', {
        value: () => ({ top: 0, bottom: 200, left: 0, right: 100, width: 100, height: 200 }),
      });

      const button = document.createElement('button');
      button.setAttribute('data-testid', 'sidebar-button-default-chatgpt');
      Object.defineProperty(button, 'getBoundingClientRect', {
        value: () => ({ top: 50, bottom: 114, left: 0, right: 100, width: 100, height: 64 }),
      });
      container.appendChild(button);

      vi.spyOn(component as any, 'servicesContainer').mockReturnValue({ nativeElement: container });
      component.selectedService.set(component.configuredServices()[0]);
      container.scrollTop = 30;

      (component as any).scrollToSelectedService();

      expect(container.scrollTop).toBe(30);
    });
  });
});

