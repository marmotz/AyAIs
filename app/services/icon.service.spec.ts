import { nativeImage } from 'electron';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IconService } from './icon.service';

vi.mock('electron', () => ({
  nativeImage: {
    createFromPath: vi.fn(),
  },
}));

vi.mock('node:path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:path')>();
  return {
    ...actual,
    resolve: vi.fn(),
  };
});

describe('IconService', () => {
  const mockNativeImage = {
    resize: vi.fn(),
    setTemplateImage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nativeImage.createFromPath).mockReturnValue(mockNativeImage as any);
    vi.mocked(resolve).mockReturnValue('/mocked/path/to/icon.png');
  });

  describe('getIconPath', () => {
    it('should return the resolved icon path', () => {
      vi.mocked(resolve).mockReturnValue('/app/icon.png');

      const result = IconService.getIconPath();

      expect(resolve).toHaveBeenCalledWith(__dirname, '../icon.png');
      expect(result).toBe('/app/icon.png');
    });
  });

  describe('getTrayIcon', () => {
    it('should return standard icon on non-darwin platforms', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      });

      const result = IconService.getTrayIcon();

      expect(nativeImage.createFromPath).toHaveBeenCalledWith('/mocked/path/to/icon.png');
      expect(result).toBe(mockNativeImage);
      expect(mockNativeImage.resize).not.toHaveBeenCalled();

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('should return standard icon on linux', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });

      const result = IconService.getTrayIcon();

      expect(nativeImage.createFromPath).toHaveBeenCalledWith('/mocked/path/to/icon.png');
      expect(result).toBe(mockNativeImage);
      expect(mockNativeImage.resize).not.toHaveBeenCalled();

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('should return resized and template image on darwin (macOS)', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      });

      const resizedImage = { setTemplateImage: vi.fn() };
      vi.mocked(mockNativeImage.resize).mockReturnValue(resizedImage as any);

      const result = IconService.getTrayIcon();

      expect(nativeImage.createFromPath).toHaveBeenCalledWith('/mocked/path/to/icon.png');
      expect(mockNativeImage.resize).toHaveBeenCalledWith({ width: 16, height: 16 });
      expect(resizedImage.setTemplateImage).toHaveBeenCalledWith(true);
      expect(result).toBe(resizedImage);

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('should fallback to standard icon if darwin resize fails', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      });

      vi.mocked(mockNativeImage.resize).mockImplementation(() => {
        throw new Error('Resize failed');
      });

      const result = IconService.getTrayIcon();

      expect(nativeImage.createFromPath).toHaveBeenCalledWith('/mocked/path/to/icon.png');
      expect(result).toBe(mockNativeImage);

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('should fallback to standard icon if darwin createFromPath fails', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
      });

      vi.mocked(nativeImage.createFromPath).mockImplementation(() => {
        throw new Error('Create failed');
      });

      expect(() => IconService.getTrayIcon()).toThrow('Create failed');

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });
  });
});
