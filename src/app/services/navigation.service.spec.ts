import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let router: Router;
  let routerEventsSubject: Subject<NavigationEnd>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock window.electronAPI
    (window as any).electronAPI = {
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    routerEventsSubject = new Subject<NavigationEnd>();

    const routerMock = {
      events: routerEventsSubject.asObservable(),
    };

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        {
          provide: Router,
          useValue: routerMock,
        },
      ],
    });

    service = TestBed.inject(NavigationService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    // Clean up timers to prevent pending timers from firing after tests
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
    // Don't delete the mock - the setup file will maintain it
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAiServicesRoute', () => {
    it('should return true when current route is /app', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app', '/app'));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(true);
      expect(service.isSettingsRoute()).toBe(false);
    });

    it('should return false when current route is /app/settings', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app/settings', '/app/settings'));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(false);
    });

    it('should return false when current route is /other', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/other', '/other'));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(false);
    });

    it('should update when navigation changes', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/other', '/other'));

      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(false);

      routerEventsSubject.next(new NavigationEnd(2, '/app', '/app'));

      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(true);
    });
  });

  describe('isSettingsRoute', () => {
    it('should return true when current route is /app/settings', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app/settings', '/app/settings'));

      await TestBed.flushEffects();

      expect(service.isSettingsRoute()).toBe(true);
      expect(service.isAiServicesRoute()).toBe(false);
    });

    it('should return false when current route is /app', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app', '/app'));

      await TestBed.flushEffects();

      expect(service.isSettingsRoute()).toBe(false);
    });

    it('should return false when current route is /other', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/other', '/other'));

      await TestBed.flushEffects();

      expect(service.isSettingsRoute()).toBe(false);
    });

    it('should update when navigation changes', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app', '/app'));

      await TestBed.flushEffects();
      expect(service.isSettingsRoute()).toBe(false);

      routerEventsSubject.next(new NavigationEnd(2, '/app/settings', '/app/settings'));

      await TestBed.flushEffects();
      expect(service.isSettingsRoute()).toBe(true);
    });
  });

  describe('route transitions', () => {
    it('should handle transition from /app to /app/settings', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app', '/app'));

      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(true);
      expect(service.isSettingsRoute()).toBe(false);

      routerEventsSubject.next(new NavigationEnd(2, '/app/settings', '/app/settings'));

      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(false);
      expect(service.isSettingsRoute()).toBe(true);
    });

    it('should handle transition from /app/settings to /app', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app/settings', '/app/settings'));

      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(false);
      expect(service.isSettingsRoute()).toBe(true);

      routerEventsSubject.next(new NavigationEnd(2, '/app', '/app'));

      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(true);
      expect(service.isSettingsRoute()).toBe(false);
    });

    it('should return false for both when on unknown route', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/unknown/route', '/unknown/route'));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(false);
      expect(service.isSettingsRoute()).toBe(false);
    });
  });

  describe('reactivity', () => {
    it('should respond to multiple navigation events', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app', '/app'));
      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(true);

      routerEventsSubject.next(new NavigationEnd(2, '/app/settings', '/app/settings'));
      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(false);

      routerEventsSubject.next(new NavigationEnd(3, '/app', '/app'));
      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(true);

      routerEventsSubject.next(new NavigationEnd(4, '/app/settings', '/app/settings'));
      await TestBed.flushEffects();
      expect(service.isAiServicesRoute()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty URL', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '', ''));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(false);
      expect(service.isSettingsRoute()).toBe(false);
    });

    it('should handle root path', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/', '/'));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(false);
      expect(service.isSettingsRoute()).toBe(false);
    });

    it('should handle query parameters in URL', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app?param=value', '/app?param=value'));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(false);
      expect(service.isSettingsRoute()).toBe(false);
    });

    it('should handle trailing slashes', async () => {
      routerEventsSubject.next(new NavigationEnd(1, '/app/', '/app/'));

      await TestBed.flushEffects();

      expect(service.isAiServicesRoute()).toBe(false);
      expect(service.isSettingsRoute()).toBe(false);
    });
  });
});
