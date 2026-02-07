import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DevShortcutsService } from './dev-shortcuts.service';

describe('DevShortcutsService', () => {
  let service: DevShortcutsService;
  let router: Router;
  let mockElectronAPI: any;
  let originalAddEventListener: typeof document.addEventListener;
  let keyboardEventCallback: any;

  beforeEach(() => {
    vi.useFakeTimers();

    originalAddEventListener = document.addEventListener;
    mockElectronAPI = {
      isDevMode: vi.fn().mockResolvedValue(false),
      onOpenDevPage: vi.fn(),
      sendDevShortcut: vi.fn(),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    global.window = {
      ...global.window,
      electronAPI: mockElectronAPI,
    } as Window & typeof globalThis & { electronAPI: typeof mockElectronAPI };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(DevShortcutsService);
    router = TestBed.inject(Router);

    document.addEventListener = vi.fn((event, callback) => {
      if (event === 'keydown') {
        keyboardEventCallback = callback;
      }
      return originalAddEventListener.call(document, event, callback);
    }) as any;
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    mockElectronAPI.isDevMode.mockReset();
    document.addEventListener = originalAddEventListener;
    keyboardEventCallback = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('dev mode detection', () => {
    it('should check dev mode on initialization', async () => {
      expect(mockElectronAPI.isDevMode).toHaveBeenCalled();
    });

    it('should not set up listeners when not in dev mode', async () => {
      mockElectronAPI.isDevMode.mockResolvedValueOnce(false);
      const newService = TestBed.inject(DevShortcutsService);

      await vi.advanceTimersByTimeAsync(0);

      expect(mockElectronAPI.onOpenDevPage).not.toHaveBeenCalled();
    });

    it('should handle missing electronAPI gracefully', async () => {
      (window as any).electronAPI = null;

      const newService = TestBed.inject(DevShortcutsService);

      await vi.advanceTimersByTimeAsync(0);

      expect(newService).toBeTruthy();
    });

    it('should handle isDevMode errors gracefully', async () => {
      mockElectronAPI.isDevMode.mockRejectedValueOnce(new Error('Failed to check'));

      const newService = TestBed.inject(DevShortcutsService);

      await vi.advanceTimersByTimeAsync(0);

      expect(newService).toBeTruthy();
      expect(mockElectronAPI.onOpenDevPage).not.toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts in dev mode', () => {
    it('should set up keyboard listener in dev mode', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: Router,
            useValue: {
              navigate: vi.fn(),
            },
          },
        ],
      });

      const devModeMockElectronAPI = {
        isDevMode: vi.fn().mockResolvedValue(true),
        onOpenDevPage: vi.fn(),
        sendDevShortcut: vi.fn(),
        logDebug: vi.fn().mockResolvedValue(undefined),
      };

      global.window = {
        ...global.window,
        electronAPI: devModeMockElectronAPI,
      } as Window & typeof globalThis & { electronAPI: typeof devModeMockElectronAPI };

      const devService = TestBed.inject(DevShortcutsService);
      await vi.advanceTimersByTimeAsync(0);

      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should trigger dev shortcut on Ctrl+D when not in input', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: Router,
            useValue: {
              navigate: vi.fn(),
            },
          },
        ],
      });

      const devModeMockElectronAPI = {
        isDevMode: vi.fn().mockResolvedValue(true),
        onOpenDevPage: vi.fn(),
        sendDevShortcut: vi.fn(),
        logDebug: vi.fn().mockResolvedValue(undefined),
      };

      global.window = {
        ...global.window,
        electronAPI: devModeMockElectronAPI,
      } as Window & typeof globalThis & { electronAPI: typeof devModeMockElectronAPI };

      let devKeyboardEventCallback: any;
      document.addEventListener = vi.fn((event, callback) => {
        if (event === 'keydown') {
          devKeyboardEventCallback = callback;
        }
        return originalAddEventListener.call(document, event, callback);
      }) as any;

      const devService = TestBed.inject(DevShortcutsService);
      await vi.advanceTimersByTimeAsync(0);

      const mockDiv = document.createElement('div');
      document.body.appendChild(mockDiv);

      const mockEvent = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
      });
      Object.defineProperty(mockEvent, 'target', { value: mockDiv, configurable: true });
      const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');

      if (devKeyboardEventCallback) {
        devKeyboardEventCallback(mockEvent);
      }

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(devModeMockElectronAPI.sendDevShortcut).toHaveBeenCalled();

      document.body.removeChild(mockDiv);
      document.addEventListener = originalAddEventListener;
    });
  });

  describe('onOpenDevPage callback', () => {
    it('should navigate to dev page when callback is triggered', async () => {
      mockElectronAPI.isDevMode.mockResolvedValueOnce(true);
      const navigateSpy = vi.spyOn(router, 'navigate');

      let capturedCallback: any;
      mockElectronAPI.onOpenDevPage.mockImplementation((callback: any) => {
        capturedCallback = callback;
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: Router,
            useValue: {
              navigate: navigateSpy,
            },
          },
        ],
      });

      mockElectronAPI.onOpenDevPage.mockClear();
      mockElectronAPI.onOpenDevPage.mockImplementation((callback: any) => {
        capturedCallback = callback;
      });

      const newService = TestBed.inject(DevShortcutsService);
      await vi.advanceTimersByTimeAsync(0);

      if (capturedCallback) {
        capturedCallback();
      }

      expect(navigateSpy).toHaveBeenCalledWith(['/app/dev']);
    });
  });
});
