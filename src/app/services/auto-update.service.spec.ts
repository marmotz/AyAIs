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

    const electronAPIMocks = {
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
      onUpdateAvailable: vi.fn((callback) => callback),
      onUpdateNotAvailable: vi.fn((callback) => callback),
      onUpdateDownloaded: vi.fn((callback) => callback),
      onUpdateDownloadProgress: vi.fn((callback) => callback),
      onUpdateDownloadFailed: vi.fn((callback) => callback),
      startUpdateDownload: vi.fn(),
      quitAndInstall: vi.fn(),
      simulateUpdateAvailable: vi.fn(),
      simulateUpdateDownloaded: vi.fn(),
      notifyRendererReady: vi.fn(),
    };

    global.window = {
      ...global.window,
      electronAPI: electronAPIMocks,
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

  it('should show download error toast when download fails', () => {
    const errorCallback = (global.window.electronAPI.onUpdateDownloadFailed as any).mock.calls[0][0];
    errorCallback('Network error');

    expect(service.updateStatus()).toBe('error');
    expect(mockMessageService.clear).toHaveBeenCalled();
    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Download Failed',
        detail: 'Failed to download the update: Network error',
      })
    );
  });

  it('should handle download progress updates', () => {
    const progressCallback = (global.window.electronAPI.onUpdateDownloadProgress as any).mock.calls[0][0];
    const mockProgress = {
      percent: 50,
      bytesPerSecond: 1000000,
      transferred: 50000000,
      total: 100000000,
    };

    progressCallback(mockProgress);

    expect(mockMessageService.clear).toHaveBeenCalled();
  });
});
