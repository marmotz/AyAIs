import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdateService } from './auto-update.service';

describe('AutoUpdateService', () => {
  let service: AutoUpdateService;
  let mockMessageService: any;

  beforeEach(() => {
    mockMessageService = {
      add: vi.fn(),
      clear: vi.fn(),
    };

    global.window = {
      ...global.window,
      electronAPI: {
        getPlatform: () => Promise.resolve('linux'),
        logDebug: vi.fn().mockResolvedValue(undefined),
        onUpdateAvailable: vi.fn(),
        onUpdateDownloaded: vi.fn(),
        startUpdateDownload: vi.fn(),
        quitAndInstall: vi.fn(),
        simulateUpdateAvailable: vi.fn(),
        simulateUpdateDownloaded: vi.fn(),
      },
    } as any;

    TestBed.configureTestingModule({
      providers: [AutoUpdateService, { provide: MessageService, useValue: mockMessageService }],
    });

    service = TestBed.inject(AutoUpdateService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Don't delete the mock - the setup file will maintain it
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial status as idle', () => {
    expect(service.updateStatus()).toBe('idle');
  });
});
