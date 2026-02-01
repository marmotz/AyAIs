import { AppConfig } from '@shared/types/app-config.interface';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigManagerService } from './config-manager.service';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => path.join(os.tmpdir(), 'test')),
  },
}));

describe('ConfigManagerService', () => {
  let configManager: ConfigManagerService;
  const mockConfigPath = path.join(os.tmpdir(), 'test', 'config.json');

  beforeEach(() => {
    vi.clearAllMocks();
    configManager = new ConfigManagerService();
  });

  it('should load default configuration when config file does not exist', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('File not found');
    });

    const config = configManager.getConfig();

    expect(config).toBeDefined();
    expect(config.launchAtStartup).toBe(false);
    expect(config.launchHidden).toBe(false);
    expect(config.updateChannel).toBe('stable');
  });

  it('should load configuration from file when it exists', () => {
    const mockConfig: Partial<AppConfig> = {
      launchAtStartup: true,
      launchHidden: true,
      lastService: 'service1',
    };

    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig));

    configManager = new ConfigManagerService();
    const config = configManager.getConfig();

    expect(config.launchAtStartup).toBe(true);
    expect(config.launchHidden).toBe(true);
    expect(config.lastService).toBe('service1');
  });

  it('should merge configuration with defaults', () => {
    const mockConfig: Partial<AppConfig> = {
      launchAtStartup: true,
      position: {
        x: 100,
        y: 200,
        width: 800,
        height: 600,
      },
    };

    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig));

    configManager = new ConfigManagerService();
    const config = configManager.getConfig();

    expect(config.launchAtStartup).toBe(true);
    expect(config.position.x).toBe(100);
    expect(config.position.y).toBe(200);
  });

  it('should save configuration to file', () => {
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync');

    configManager.saveConfig();

    const expectedPath = path.normalize(mockConfigPath);
    const actualPath = path.normalize(writeFileSyncSpy.mock.calls[0][0] as string);

    expect(actualPath).toBe(expectedPath);
    expect(writeFileSyncSpy).toHaveBeenCalledWith(expectedPath, JSON.stringify(configManager.getConfig(), null, 2));
  });

  it('should update configuration', () => {
    const newConfig: Partial<AppConfig> = {
      launchAtStartup: true,
      launchHidden: false,
    };

    configManager.updateConfig(newConfig);
    const config = configManager.getConfig();

    expect(config.launchAtStartup).toBe(true);
    expect(config.launchHidden).toBe(false);
  });

  it('should update update channel', () => {
    const newConfig: Partial<AppConfig> = {
      updateChannel: 'beta',
    };

    configManager.updateConfig(newConfig);
    const config = configManager.getConfig();

    expect(config.updateChannel).toBe('beta');
  });

  it('should fallback to default update channel when not provided', () => {
    const mockConfig: Partial<AppConfig> = {
      launchAtStartup: true,
    };

    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockConfig));

    configManager = new ConfigManagerService();
    const config = configManager.getConfig();

    expect(config.updateChannel).toBe('stable');
  });
});
