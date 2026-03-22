import { AppConfig } from '@shared/types/app-config.interface';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_CONFIGURATION, getConfiguredServices } from '../config/default-configuration';

export class ConfigManagerService {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    const userDataPath = app.getPath('userData');

    // S'assurer que le répertoire existe
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    this.configPath = path.join(userDataPath, 'config.json');
    this.config = this.loadConfig();
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error(`Failed to save config at ${this.configPath}:`, error);
      throw error;
    }
  }

  public updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.saveConfig();
  }

  private loadConfig(): AppConfig {
    let rawConfig = '{}';

    try {
      rawConfig = fs.readFileSync(this.configPath, 'utf8');
    } catch {
      return { ...DEFAULT_CONFIGURATION };
    }

    try {
      const partialConfig: Partial<AppConfig> = JSON.parse(rawConfig);
      const merged = this.mergeConfigs(DEFAULT_CONFIGURATION, partialConfig);

      merged.configuredServices = getConfiguredServices(partialConfig.configuredServices, merged.serviceOrder);

      return merged;
    } catch (error) {
      console.error('Failed to parse config:', error);
      return { ...DEFAULT_CONFIGURATION };
    }
  }

  private mergeConfigs(defaultConfig: AppConfig, partialConfig: Partial<AppConfig>): AppConfig {
    return {
      ...defaultConfig,
      ...(partialConfig ?? {}),
      position: {
        ...defaultConfig.position,
        ...(partialConfig?.position ?? {}),
      },
      configuredServices: partialConfig?.configuredServices?.length
        ? partialConfig.configuredServices
        : defaultConfig.configuredServices,
      shortcuts: {
        ...defaultConfig.shortcuts,
        ...(partialConfig?.shortcuts ?? {}),
        globalShortcuts: {
          ...defaultConfig.shortcuts.globalShortcuts,
          ...(partialConfig?.shortcuts?.globalShortcuts ?? {}),
        },
        internalShortcuts: {
          ...defaultConfig.shortcuts.internalShortcuts,
          ...(partialConfig?.shortcuts?.internalShortcuts ?? {}),
          services: {
            ...defaultConfig.shortcuts.internalShortcuts.services,
            ...(partialConfig?.shortcuts?.internalShortcuts?.services ?? {}),
          },
        },
      },
    };
  }
}
