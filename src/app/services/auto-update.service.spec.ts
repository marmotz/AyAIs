import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdateService } from './auto-update.service';

describe('AutoUpdateService', () => {
  let service: AutoUpdateService;
  let mockMessageService: any;

  const createMockElectronAPI = (callOnUpdateImmediately = false) => ({
    getPlatform: () => Promise.resolve('linux'),
    logDebug: vi.fn().mockResolvedValue(undefined),
    onUpdateAvailable: vi.fn((callback) => {
      if (callOnUpdateImmediately) {
        callback({ version: '0.4.0', releaseDate: '2025-01-15' });
      }
    }),
    onUpdateNotAvailable: vi.fn(),
    onUpdateDownloaded: vi.fn(),
    onUpdateDownloadProgress: vi.fn(),
    onUpdateDownloadFailed: vi.fn(),
    startUpdateDownload: vi.fn(),
    quitAndInstall: vi.fn(),
    simulateUpdateAvailable: vi.fn(),
    simulateUpdateDownloaded: vi.fn(),
    notifyRendererReady: vi.fn(),
  });

  beforeEach(() => {
    mockMessageService = {
      add: vi.fn(),
      clear: vi.fn(),
    };

    global.window = {
      ...global.window,
      electronAPI: createMockElectronAPI(false),
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
    expect(service.updateInfo()).toBe(null);
    expect(mockMessageService.add).not.toHaveBeenCalled();
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

  it('should capture and store update info when update is available', () => {
    const mockUpdateInfo = { version: '0.4.0', releaseDate: '2025-01-15' };
    const availableCallback = (global.window.electronAPI.onUpdateAvailable as any).mock.calls[0][0];

    availableCallback(mockUpdateInfo);

    expect(service.updateInfo()).toEqual(mockUpdateInfo);
    expect(service.updateStatus()).toBe('available');
    expect(mockMessageService.add).toHaveBeenCalled();
  });

  it('should clear download progress when download completes', () => {
    const mockProgress = { percent: 100, bytesPerSecond: 0, transferred: 100000000, total: 100000000 };
    const progressCallback = (global.window.electronAPI.onUpdateDownloadProgress as any).mock.calls[0][0];
    const downloadedCallback = (global.window.electronAPI.onUpdateDownloaded as any).mock.calls[0][0];

    progressCallback(mockProgress);
    expect(service.downloadProgress()).toEqual(mockProgress);

    downloadedCallback();
    expect(service.downloadProgress()).toBe(null);
    expect(service.updateStatus()).toBe('downloaded');
  });

  it('should clear download progress when download fails', () => {
    const mockProgress = { percent: 50, bytesPerSecond: 1000000, transferred: 50000000, total: 100000000 };
    const progressCallback = (global.window.electronAPI.onUpdateDownloadProgress as any).mock.calls[0][0];
    const errorCallback = (global.window.electronAPI.onUpdateDownloadFailed as any).mock.calls[0][0];

    progressCallback(mockProgress);
    expect(service.downloadProgress()).toEqual(mockProgress);

    errorCallback('Network error');
    expect(service.downloadProgress()).toBe(null);
    expect(service.updateStatus()).toBe('error');
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

    expect(service.downloadProgress()).toEqual(mockProgress);
  });
});
