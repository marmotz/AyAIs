import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from './home.component';

describe('Home', () => {
  beforeEach(async () => {
    (window as any).electronAPI = {
      getLastService: vi.fn().mockResolvedValue(undefined),
      saveLastService: vi.fn(),
      openExternal: vi.fn(),
      onNavigateService: vi.fn(),
      onSelectService: vi.fn(),
      onOpenSettings: vi.fn(),
      getAppConfig: vi.fn().mockResolvedValue({
        shortcuts: {
          globalShortcuts: {
            showHideApp: 'Meta+I',
          },
          internalShortcuts: {
            openSettings: 'Ctrl+,',
            quitApp: 'Ctrl+X',
            previousService: 'Ctrl+Shift+Tab',
            nextService: 'Ctrl+Tab',
            services: {
              service1: 'Ctrl+1',
              service2: 'Ctrl+2',
            },
          },
        },
      }),
      quitApp: vi.fn().mockResolvedValue(undefined),
      getPlatform: () => Promise.resolve('linux'),
    };

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [Home, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    delete (window as any).electronAPI;
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
});
