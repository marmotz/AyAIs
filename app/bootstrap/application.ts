import { app } from 'electron';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { ConfigManagerService } from '../services/config-manager.service';
import { DebugLoggerService } from '../services/debug-logger.service';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { TrayManagerService } from '../services/tray-manager.service';
import { WindowManagerService } from '../services/window-manager.service';
import { initializeApp } from './app-initializer';
import { registerAppEventListeners } from './app-listeners';

export function bootstrapApplication(serve: boolean): void {
  const configManager = new ConfigManagerService();
  const debugLogger = new DebugLoggerService();
  const startupManager = new StartupManagerService();
  const windowManager = new WindowManagerService(configManager.getConfig());
  const shortcutManager = new ShortcutManagerService(configManager.getConfig(), windowManager);
  const trayManager = new TrayManagerService(windowManager);
  const autoUpdater = new AutoUpdaterService(configManager);

  app.on('ready', () => {
    initializeApp(
      configManager,
      windowManager,
      shortcutManager,
      trayManager,
      autoUpdater,
      startupManager,
      debugLogger,
      serve
    );
  });

  registerAppEventListeners(windowManager, autoUpdater, configManager);
}
