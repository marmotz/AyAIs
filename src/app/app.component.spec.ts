import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  onUpdateAvailable: vi.fn((callback) => callback({ version: '0.4.0', releaseDate: '2025-01-15' })),
  onUpdateNotAvailable: vi.fn(),
  onUpdateDownloaded: vi.fn(),
  onUpdateDownloadProgress: vi.fn(),
  onUpdateDownloadFailed: vi.fn(),
  notifyRendererReady: vi.fn(),
};

describe('AppComponent', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let messageService: MessageService;

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
        MessageService,
        {
          provide: DevShortcutsService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    messageService = TestBed.inject(MessageService);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.isDevMode.mockReset();
    // Don't delete the mock - the setup file will maintain it
  });
});
