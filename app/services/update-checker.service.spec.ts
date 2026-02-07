import { BrowserWindow } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigManagerService } from './config-manager.service';
import { UpdateCheckerService } from './update-checker.service';

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '0.3.0'),
    isPackaged: true,
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

vi.mock('compare-versions', () => ({
  compareVersions: vi.fn((a: string, b: string) => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  }),
}));

vi.mock('./config-manager.service');

describe('UpdateCheckerService', () => {
  let service: UpdateCheckerService;
  let mockWindow: BrowserWindow;
  let mockConfigManager: ConfigManagerService;

  beforeEach(() => {
    mockConfigManager = {
      getConfig: vi.fn().mockReturnValue({
        updateChannel: 'stable',
      }),
    } as unknown as ConfigManagerService;

    service = new UpdateCheckerService(mockConfigManager);
    mockWindow = {
      webContents: {
        send: vi.fn(),
      },
    } as unknown as BrowserWindow;
  });

  afterEach(() => {
    service.destroy();
  });

  describe('setupAutoUpdater', () => {
    it('should set the current window', () => {
      service.setupAutoUpdater(mockWindow);
      expect(mockWindow.webContents.send).toBeDefined();
    });

    it('should start periodic update check', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      service.setupAutoUpdater(mockWindow);
      expect(setIntervalSpy).toHaveBeenCalled();
      setIntervalSpy.mockRestore();
    });
  });

  describe('getUpdateURL', () => {
    it('should return correct URL for Windows', () => {
      const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
      const url = service.getUpdateURL();
      expect(url).toBe('https://github.com/marmotz/AyAIs#windows');
      platformSpy.mockRestore();
    });

    it('should return correct URL for macOS', () => {
      const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
      const url = service.getUpdateURL();
      expect(url).toBe('https://github.com/marmotz/AyAIs#macos');
      platformSpy.mockRestore();
    });

    it('should return correct URL for Linux', () => {
      const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
      const url = service.getUpdateURL();
      expect(url).toBe('https://github.com/marmotz/AyAIs#linux');
      platformSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    it('should clear the update interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      service.setupAutoUpdater(mockWindow);
      service.destroy();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('fetchLatestRelease', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should detect stable releases by tag name when update channel is stable', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          published_at: '2025-01-15T10:00:00Z',
          body: 'Stable release notes',
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service['fetchLatestRelease']();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/marmotz/AyAIs/releases/latest',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'AyAIs-UpdateChecker',
          }),
        })
      );
      expect(result).toEqual({
        version: '1.0.0',
        releaseDate: '2025-01-15T10:00:00Z',
        releaseNotes: 'Stable release notes',
        prerelease: false,
      });
    });

    it('should use latest release API when update channel is beta', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            tag_name: 'v1.1.0-beta',
            published_at: '2025-01-20T10:00:00Z',
            body: 'Beta release notes',
            prerelease: true,
          },
        ],
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'beta' });

      const result = await service['fetchLatestRelease']();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/marmotz/AyAIs/releases',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'AyAIs-UpdateChecker',
          }),
        })
      );
      expect(result).toEqual({
        version: '1.1.0-beta',
        releaseDate: '2025-01-20T10:00:00Z',
        releaseNotes: 'Beta release notes',
        prerelease: true,
      });
    });

    it('should return null when no stable release is found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: '',
          published_at: '',
          body: '',
        }),
      });
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service['fetchLatestRelease']();

      expect(result).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      await expect(service['fetchLatestRelease']()).rejects.toThrow('Network error');
    });

    it('should handle API error responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      await expect(service['fetchLatestRelease']()).rejects.toThrow();
    });

    it('should strip "v" prefix from version numbers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v2.5.0',
          published_at: '2025-02-01T10:00:00Z',
          body: 'Version notes',
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service['fetchLatestRelease']();

      expect(result?.version).toBe('2.5.0');
    });

    it('should handle version without "v" prefix', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: '3.0.0',
          published_at: '2025-02-01T10:00:00Z',
          body: 'Version notes',
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service['fetchLatestRelease']();

      expect(result?.version).toBe('3.0.0');
    });

    it('should handle empty release body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          published_at: '2025-01-15T10:00:00Z',
          body: null,
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service['fetchLatestRelease']();

      expect(result?.releaseNotes).toBe('');
    });

    it('should handle prerelease flag correctly for stable channel', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          published_at: '2025-01-15T10:00:00Z',
          body: 'Stable release',
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service['fetchLatestRelease']();

      expect(result?.prerelease).toBe(false);
    });

    it('should handle prerelease flag correctly for beta channel', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            tag_name: 'v1.0.0-beta.1',
            published_at: '2025-01-15T10:00:00Z',
            body: 'Beta release',
            prerelease: true,
          },
        ],
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'beta' });

      const result = await service['fetchLatestRelease']();

      expect(result?.prerelease).toBe(true);
      expect(result?.version).toBe('1.0.0-beta.1');
    });

    it('should return null when beta channel has no releases', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'beta' });

      const result = await service['fetchLatestRelease']();

      expect(result).toBeNull();
    });
  });

  describe('isNewerVersion', () => {
    it('should return true when latest version is newer', () => {
      const result = service['isNewerVersion']('1.0.0');
      expect(result).toBe(true);
    });

    it('should return false when latest version is older', () => {
      const result = service['isNewerVersion']('0.1.0');
      expect(result).toBe(false);
    });

    it('should return false when versions are equal', () => {
      const result = service['isNewerVersion']('0.3.0');
      expect(result).toBe(false);
    });

    it('should handle invalid version strings gracefully', () => {
      const result = service['isNewerVersion']('invalid');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('checkForUpdates', () => {
    beforeEach(() => {
      service.setupAutoUpdater(mockWindow);
    });

    it('should send update_available event when newer version found', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          published_at: '2025-01-15T10:00:00Z',
          body: 'New release',
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service.checkForUpdates();

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'update_available',
        expect.objectContaining({
          version: '1.0.0',
        })
      );
      expect(result).not.toBeNull();
    });

    it('should send update_not_available event when no update', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v0.1.0',
          published_at: '2025-01-15T10:00:00Z',
          body: 'Old release',
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service.checkForUpdates();

      expect(mockWindow.webContents.send).toHaveBeenCalledWith('update_not_available');
      expect(result).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service.checkForUpdates();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should not send events when currentWindow is undefined', async () => {
      service.setupAutoUpdater(undefined);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0',
          published_at: '2025-01-15T10:00:00Z',
          body: 'New release',
          prerelease: false,
        }),
      });

      global.fetch = mockFetch;
      (mockConfigManager.getConfig as ReturnType<typeof vi.fn>).mockReturnValue({ updateChannel: 'stable' });

      const result = await service.checkForUpdates();

      expect(mockWindow.webContents.send).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });
});
