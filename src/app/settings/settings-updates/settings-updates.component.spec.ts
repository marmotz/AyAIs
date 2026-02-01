import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { AppConfig } from '@shared/types/app-config.interface';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsUpdatesComponent } from './settings-updates.component';

describe('SettingsUpdatesComponent', () => {
  let component: SettingsUpdatesComponent;
  let fixture: ComponentFixture<SettingsUpdatesComponent>;

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
    updateChannel: 'stable',
  };

  beforeEach(async () => {
    (window as any).electronAPI = {
      getAppConfig: vi.fn().mockResolvedValue(mockAppConfig),
      saveAppConfig: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsUpdatesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsUpdatesComponent);
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
});
