import { AppConfig } from '@shared/types/app-config.interface';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WindowManagerService } from './window-manager.service';

const mockWindow = {
  on: vi.fn(),
  loadURL: vi.fn(),
  setSkipTaskbar: vi.fn(),
  setVisibleOnAllWorkspaces: vi.fn(),
  setAlwaysOnTop: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  focus: vi.fn(),
  getBounds: vi.fn().mockReturnValue({ x: 100, y: 100, width: 800, height: 600 }),
  isVisible: vi.fn(() => false),
  webContents: {
    openDevTools: vi.fn(),
    on: vi.fn(),
  },
};

vi.mock('electron', () => ({
  BrowserWindow: class {
    constructor() {
      return mockWindow;
    }
  },
  screen: {
    getPrimaryDisplay: vi.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 },
    })),
  },
}));

vi.mock('electron-reloader', () => ({
  default: vi.fn(),
}));

vi.mock('electron-debug', () => ({
  default: vi.fn(),
}));

vi.mock('./icon.service', () => ({
  IconService: {
    getIconPath: vi.fn(() => '/path/to/icon.png'),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
}));

vi.mock('path', () => ({
  join: vi.fn((...args: string[]) => args.join('/')),
  resolve: vi.fn((path: string) => `/resolved/${path}`),
}));

describe('WindowManagerService', () => {
  let service: WindowManagerService;
  let mockAppConfig: AppConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.on = vi.fn();
    mockWindow.isVisible.mockReturnValue(false);

    mockAppConfig = {
      launchAtStartup: true,
      launchHidden: false,
      lastService: undefined,
      shortcuts: {
        globalShortcuts: {
          showHideApp: 'Ctrl+Alt+I',
        },
        internalShortcuts: {
          openSettings: 'Ctrl+,',
          quitApp: 'Ctrl+Q',
          previousService: 'Ctrl+Shift+Tab',
          nextService: 'Ctrl+Tab',
          refreshService: 'Ctrl+R',
          services: {
            service1: 'Ctrl+1',
            service2: 'Ctrl+2',
          },
        },
      },
      position: {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
      },
      updateChannel: 'stable' as const,
      serviceOrder: ['service1', 'service2'],
      configuredServices: [],
    };

    service = new WindowManagerService(mockAppConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createWindow', () => {
    it('should create a window with default bounds from config', () => {
      const window = service.createWindow();

      expect(window).toBeDefined();
      expect(window).toBe(mockWindow);
    });

    it('should use primary display size when config position is invalid', () => {
      const invalidConfig: AppConfig = {
        ...mockAppConfig,
        position: { x: 0, y: 0, width: 0, height: 0 },
      };
      const invalidService = new WindowManagerService(invalidConfig);

      invalidService.createWindow();

      expect(invalidService.getWindow()).toBeDefined();
    });

    it('should setup window events', () => {
      service.createWindow();

      expect(mockWindow.on).toHaveBeenCalledWith('move', expect.any(Function));
      expect(mockWindow.on).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockWindow.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWindow.on).toHaveBeenCalledWith('closed', expect.any(Function));
    });

    it('should load URL', () => {
      const originalArgs = process.argv;
      process.argv = ['node', 'main.js'];

      const nonServeService = new WindowManagerService(mockAppConfig);
      nonServeService.createWindow();

      expect(mockWindow.loadURL).toHaveBeenCalled();

      process.argv = originalArgs;
    });

    it('should block DevTools shortcuts in production mode', () => {
      const originalArgs = process.argv;
      process.argv = ['node', 'main.js'];

      const nonServeService = new WindowManagerService(mockAppConfig);
      nonServeService.createWindow();

      expect(mockWindow.webContents.on).toHaveBeenCalledWith('before-input-event', expect.any(Function));

      process.argv = originalArgs;
    });

    it('should not block DevTools shortcuts in dev mode', () => {
      const originalArgs = process.argv;
      process.argv = ['node', 'main.js', '--serve'];

      const serveService = new WindowManagerService(mockAppConfig);
      serveService.createWindow();

      const devToolsBlockCalls = mockWindow.webContents.on.mock.calls.filter(
        (call: any[]) => call[0] === 'before-input-event'
      );
      expect(devToolsBlockCalls.length).toBe(0);

      process.argv = originalArgs;
    });
  });

  describe('getWindow', () => {
    it('should return null when no window created', () => {
      expect(service.getWindow()).toBeNull();
    });

    it('should return the window after creation', () => {
      const createdWindow = service.createWindow();
      const retrievedWindow = service.getWindow();

      expect(retrievedWindow).toBe(createdWindow);
    });
  });

  describe('hideWindow', () => {
    beforeEach(() => {
      service.createWindow();
    });

    it('should hide window and set skipTaskbar on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      service.hideWindow();

      expect(mockWindow.setSkipTaskbar).toHaveBeenCalledWith(true);
      expect(mockWindow.hide).toHaveBeenCalled();

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should hide window and set additional properties on Linux', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      service.hideWindow();

      expect(mockWindow.setSkipTaskbar).toHaveBeenCalledWith(true);
      expect(mockWindow.setVisibleOnAllWorkspaces).toHaveBeenCalledWith(false);
      expect(mockWindow.setAlwaysOnTop).toHaveBeenCalledWith(false);
      expect(mockWindow.hide).toHaveBeenCalled();

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should do nothing when window is null', () => {
      (service as any).window = null;

      expect(() => service.hideWindow()).not.toThrow();
    });
  });

  describe('isVisible', () => {
    it('should return false when no window', () => {
      expect(service.isVisible()).toBe(false);
    });

    it('should return window isVisible when window exists', () => {
      service.createWindow();
      mockWindow.isVisible.mockReturnValue(true);

      expect(service.isVisible()).toBe(true);
    });
  });

  describe('showWindow', () => {
    beforeEach(() => {
      service.createWindow();
    });

    it('should show window and set skipTaskbar false on Windows', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      service.showWindow();

      expect(mockWindow.setSkipTaskbar).toHaveBeenCalledWith(false);
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.focus).toHaveBeenCalled();

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should show window and set additional properties on Linux', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      service.showWindow();

      expect(mockWindow.setSkipTaskbar).toHaveBeenCalledWith(false);
      expect(mockWindow.setVisibleOnAllWorkspaces).toHaveBeenCalledWith(true);
      expect(mockWindow.show).toHaveBeenCalled();
      expect(mockWindow.focus).toHaveBeenCalled();

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should do nothing when window is null', () => {
      (service as any).window = null;

      expect(() => service.showWindow()).not.toThrow();
    });
  });

  describe('toggleWindow', () => {
    it('should hide window when visible', () => {
      service.createWindow();
      mockWindow.isVisible.mockReturnValue(true);
      const hideSpy = vi.spyOn(service, 'hideWindow');

      service.toggleWindow();

      expect(hideSpy).toHaveBeenCalled();
    });

    it('should show window when not visible', () => {
      service.createWindow();
      mockWindow.isVisible.mockReturnValue(false);
      const showSpy = vi.spyOn(service, 'showWindow');

      service.toggleWindow();

      expect(showSpy).toHaveBeenCalled();
    });
  });

  describe('setQuitting', () => {
    it('should set isQuitting flag', () => {
      service.setQuitting(true);
      expect((service as any).isQuitting).toBe(true);

      service.setQuitting(false);
      expect((service as any).isQuitting).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update appConfig and save callback', () => {
      const newConfig: AppConfig = {
        ...mockAppConfig,
        launchAtStartup: false,
      };
      const mockCallback = vi.fn();

      service.updateConfig(newConfig, mockCallback);

      expect((service as any).appConfig).toBe(newConfig);
      expect((service as any).saveConfigCallback).toBe(mockCallback);
    });
  });

  describe('window events', () => {
    it('should save bounds on move', () => {
      const mockCallback = vi.fn();
      service.createWindow();
      service.updateConfig(mockAppConfig, mockCallback);

      const moveCallback = mockWindow.on.mock.calls.find((call: any[]) => call[0] === 'move')?.[1];
      if (moveCallback) {
        moveCallback();
      }

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should save bounds on resize', () => {
      const mockCallback = vi.fn();
      service.createWindow();
      service.updateConfig(mockAppConfig, mockCallback);

      const resizeCallback = mockWindow.on.mock.calls.find((call: any[]) => call[0] === 'resize')?.[1];
      if (resizeCallback) {
        resizeCallback();
      }

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should prevent close and hide when not quitting', () => {
      service.createWindow();

      const closeCallback = mockWindow.on.mock.calls.find((call: any[]) => call[0] === 'close')?.[1];
      const mockEvent = { preventDefault: vi.fn() };

      if (closeCallback) {
        closeCallback(mockEvent);
      }

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockWindow.hide).toHaveBeenCalled();
    });

    it('should allow close when quitting', () => {
      service.createWindow();
      service.setQuitting(true);

      const closeCallback = mockWindow.on.mock.calls.find((call: any[]) => call[0] === 'close')?.[1];
      const mockEvent = { preventDefault: vi.fn() };

      if (closeCallback) {
        closeCallback(mockEvent);
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should set window to null on closed', () => {
      service.createWindow();

      const closedCallback = mockWindow.on.mock.calls.find((call: any[]) => call[0] === 'closed')?.[1];
      if (closedCallback) {
        closedCallback();
      }

      expect(service.getWindow()).toBeNull();
    });
  });
});
