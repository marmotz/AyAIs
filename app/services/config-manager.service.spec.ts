import { AppConfig } from '@shared/types/app-config.interface';
import * as fs from 'fs';
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
    getPath: vi.fn(() => '/tmp/test'),
  },
}));

describe('ConfigManagerService', () => {
  let configManager: ConfigManagerService;
  const mockConfigPath = '/tmp/test/config.json';

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

    expect(writeFileSyncSpy).toHaveBeenCalledWith(mockConfigPath, JSON.stringify(configManager.getConfig(), null, 2));
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
});
