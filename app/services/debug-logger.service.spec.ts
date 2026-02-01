import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DebugLoggerService } from './debug-logger.service';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    appendFileSync: vi.fn(),
    unlinkSync: vi.fn(),
  };
});

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => path.join(os.tmpdir(), 'test')),
  },
}));

describe('DebugLoggerService', () => {
  let debugLogger: DebugLoggerService;

  beforeEach(() => {
    vi.clearAllMocks();
    debugLogger = new DebugLoggerService();
  });

  it('should create debug directory if it does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mkdirSpy = vi.spyOn(fs, 'mkdirSync');

    debugLogger.log('Test message');

    const expectedPath = path.join(os.tmpdir(), 'test', 'debugs');
    const actualPath = path.normalize(mkdirSpy.mock.calls[0][0] as string);

    expect(actualPath).toBe(expectedPath);
    expect(mkdirSpy).toHaveBeenCalledWith(expectedPath, { recursive: true });
  });

  it('should append log entry to file', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const appendSpy = vi.spyOn(fs, 'appendFileSync');

    debugLogger.log('Test message');

    expect(appendSpy).toHaveBeenCalled();
    const logContent = appendSpy.mock.calls[0][1] as string;
    expect(logContent).toContain('Test message');
    expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2}T.*] Test message\n/);
  });

  it('should clean old debug logs', () => {
    const mockFiles = ['debug-2023-01-01.log', 'debug-2023-12-31.log', 'other-file.txt'];
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(mockFiles as any);
    vi.spyOn(fs, 'statSync').mockReturnValue({
      mtimeMs: Date.now() - 8 * 24 * 60 * 60 * 1000,
    } as any);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync');

    debugLogger.cleanOldLogs();

    expect(unlinkSpy).toHaveBeenCalledTimes(2);
  });

  it('should not clean recent debug logs', () => {
    const mockFiles = ['debug-2023-12-31.log'];
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(mockFiles as any);
    vi.spyOn(fs, 'statSync').mockReturnValue({
      mtimeMs: Date.now() - 24 * 60 * 60 * 1000,
    } as any);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync');
    unlinkSpy.mockClear();

    debugLogger.cleanOldLogs();

    // Should not call unlinkSync for recent files
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('should handle log write errors gracefully', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {
      throw new Error('Write error');
    });

    expect(() => debugLogger.log('Test message')).not.toThrow();
  });
});
