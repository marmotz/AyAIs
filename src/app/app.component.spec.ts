import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DevShortcutsService } from '@app/services/dev-shortcuts.service';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app.component';

const mockElectronAPI = {
  getPlatform: () => Promise.resolve('linux'),
  logDebug: vi.fn().mockResolvedValue(undefined),
  isDevMode: vi.fn().mockResolvedValue(false),
  onOpenDevPage: vi.fn(),
  sendDevShortcut: vi.fn(),
  onUpdateAvailable: vi.fn(),
  onUpdateDownloaded: vi.fn(),
  notifyRendererReady: vi.fn(),
};

describe('AppComponent', () => {
  beforeEach(async () => {
    global.window = {
      ...global.window,
      electronAPI: mockElectronAPI,
    } as Window & typeof globalThis & { electronAPI: typeof mockElectronAPI };

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [App, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        ConfirmationService,
        {
          provide: MessageService,
          useValue: { add: vi.fn(), clear: vi.fn() },
        },
        {
          provide: DevShortcutsService,
          useValue: {},
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.isDevMode.mockReset();
    // Don't delete the mock - the setup file will maintain it
  });
});
