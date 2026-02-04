import { AppConfig } from '@shared/types/app-config.interface';
import { ipcMain, app } from 'electron';
import { ConfigManagerService } from '../services/config-manager.service';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { WindowManagerService } from '../services/window-manager.service';

export function setupConfigIPCHandlers(
  configManager: ConfigManagerService,
  windowManager: WindowManagerService,
  shortcutManager: ShortcutManagerService,
  startupManager: StartupManagerService
): void {
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-last-service', () => {
    try {
      return configManager.getConfig().lastService;
    } catch {
      return null;
    }
  });

  ipcMain.handle('save-last-service', (_event, serviceName) => {
    try {
      const config = configManager.getConfig();
      config.lastService = serviceName;
      configManager.updateConfig(config);
    } catch (error) {
      console.error('Failed to save service', error);
    }
  });

  ipcMain.handle('get-app-config', () => {
    return configManager.getConfig();
  });

  ipcMain.handle('save-app-config', (_event, newAppConfig: Partial<AppConfig>) => {
    try {
      const currentConfig = configManager.getConfig();
      const mergedConfig = {
        ...currentConfig,
        ...newAppConfig,
      };
      configManager.updateConfig(mergedConfig);

      if (newAppConfig.shortcuts) {
        shortcutManager.updateConfig(mergedConfig);
        shortcutManager.refreshShortcuts();
      }

      if (newAppConfig.launchAtStartup !== undefined) {
        startupManager.sync(newAppConfig.launchAtStartup);
      }

      windowManager.updateConfig(mergedConfig, () => configManager.saveConfig());
    } catch (error) {
      console.error('Failed to save app config', error);
    }
  });
}
