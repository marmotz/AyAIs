import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { AppConfig } from '@shared/types/app-config.interface';
import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsAboutComponent } from './settings-about.component';

describe('SettingsUpdatesComponent', () => {
  let component: SettingsAboutComponent;
  let fixture: ComponentFixture<SettingsAboutComponent>;
  let mockMessageService: any;

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
  };

  beforeEach(async () => {
    mockMessageService = {
      add: vi.fn(),
      clear: vi.fn(),
    };

    (window as any).electronAPI = {
      getAppConfig: vi.fn().mockResolvedValue(mockAppConfig),
      saveAppConfig: vi.fn().mockResolvedValue(undefined),
      getAppVersion: vi.fn().mockResolvedValue('0.3.0-beta.1'),
      checkForUpdates: vi.fn().mockResolvedValue(undefined),
      onUpdateNotAvailable: vi.fn(),
      onUpdateAvailable: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsAboutComponent],
      providers: [{ provide: MessageService, useValue: mockMessageService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsAboutComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with stable channel', async () => {
    await component.ngOnInit();
    expect(component.updateChannel()).toBe('stable');
  });

  it('should have two channels available', () => {
    expect(component.channels.length).toBe(2);
    expect(component.channels[0].value).toBe('stable');
    expect(component.channels[1].value).toBe('beta');
  });

  it('should load app version on init', async () => {
    await component.ngOnInit();
    expect(component.appVersion()).toBe('0.3.0-beta.1');
    expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
  });

  it('should check for updates and show info message', async () => {
    await component.checkForUpdates();

    expect(component.isChecking()).toBe(true);
    expect(window.electronAPI.checkForUpdates).toHaveBeenCalled();
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Checking for Updates',
      detail: 'Checking if a new version is available...',
      life: 3000,
    });
  });

  it('should listen for update not available events', () => {
    const onNotAvailableSpy = vi.spyOn(window.electronAPI, 'onUpdateNotAvailable');
    const onAvailableSpy = vi.spyOn(window.electronAPI, 'onUpdateAvailable');

    component.ngOnInit();

    expect(onNotAvailableSpy).toHaveBeenCalledWith(expect.any(Function));
    expect(onAvailableSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should show up to date message when update not available', () => {
    component.ngOnInit();

    const listener = vi.mocked(window.electronAPI.onUpdateNotAvailable).mock.calls[0]?.[0];
    if (listener) {
      listener();
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Up to Date',
        detail: 'AyAIs is already up to date!',
        life: 3000,
      });
      expect(component.isChecking()).toBe(false);
    }
  });

  it('should clean up listener on destroy', () => {
    component.ngOnInit();
    const onSpy = vi.spyOn(window.electronAPI, 'onUpdateNotAvailable');

    component.ngOnDestroy();

    expect(onSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should not check for updates if already checking', async () => {
    component.isChecking.set(true);
    await component.checkForUpdates();

    expect(window.electronAPI.checkForUpdates).not.toHaveBeenCalled();
  });

  it('should handle error when checking for updates', async () => {
    (window as any).electronAPI.checkForUpdates = vi.fn().mockRejectedValue(new Error('Network error'));

    await component.checkForUpdates();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(component.isChecking()).toBe(false);
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to check for updates. Please try again later.',
      life: 5000,
    });
  });

  it('should display update info when update is available', () => {
    component.ngOnInit();

    const mockUpdateInfo = {
      version: '1.0.0',
      releaseDate: '2025-01-15T10:00:00Z',
      releaseNotes: 'Bug fixes and performance improvements',
      prerelease: false,
    };

    const listener = vi.mocked(window.electronAPI.onUpdateAvailable).mock.calls[0]?.[0];
    if (listener) {
      listener(mockUpdateInfo);
      expect(component.availableUpdate()).toEqual(mockUpdateInfo);
      expect(component.isChecking()).toBe(false);
    }
  });
});
