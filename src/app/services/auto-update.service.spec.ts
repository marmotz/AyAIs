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
        callback({ version: '0.4.0', releaseDate: '2025-01-15', releaseNotes: 'Test release' });
      }
    }),
    onUpdateNotAvailable: vi.fn(),
    openUpdateURL: vi.fn(),
    getUpdateURL: vi.fn().mockResolvedValue('https://github.com/marmotz/AyAIs#linux'),
    simulateUpdateAvailable: vi.fn(),
    checkForUpdates: vi.fn().mockResolvedValue(undefined),
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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial status as idle', () => {
    expect(service.updateStatus()).toBe('idle');
    expect(service.updateInfo()).toBe(null);
    expect(mockMessageService.add).not.toHaveBeenCalled();
  });

  it('should capture and store update info when update is available', () => {
    const mockUpdateInfo = {
      version: '0.4.0',
      releaseDate: '2025-01-15',
      releaseNotes: 'Test release',
      prerelease: false,
    };
    const availableCallback = (global.window.electronAPI.onUpdateAvailable as any).mock.calls[0][0];

    availableCallback(mockUpdateInfo);

    expect(service.updateInfo()).toEqual(mockUpdateInfo);
    expect(service.updateStatus()).toBe('available');
    expect(mockMessageService.add).toHaveBeenCalled();
  });

  it('should show update available confirmation when update is detected', () => {
    const mockUpdateInfo = {
      version: '0.4.0',
      releaseDate: '2025-01-15',
      releaseNotes: 'Test release',
      prerelease: false,
    };
    const availableCallback = (global.window.electronAPI.onUpdateAvailable as any).mock.calls[0][0];

    availableCallback(mockUpdateInfo);

    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Update Available',
        detail: expect.stringContaining('version 0.4.0'),
      })
    );
  });

  it('should open update URL', async () => {
    await service.openUpdateURL();

    expect(global.window.electronAPI.openUpdateURL).toHaveBeenCalled();
  });

  it('should handle update not available', () => {
    const notAvailableCallback = (global.window.electronAPI.onUpdateNotAvailable as any).mock.calls[0][0];

    notAvailableCallback();

    expect(service.updateStatus()).toBe('idle');
  });
});
