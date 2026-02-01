import { app, Menu } from 'electron';
import { setupIPCHandlers } from '../handlers';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { ConfigManagerService } from '../services/config-manager.service';
import { DebugLoggerService } from '../services/debug-logger.service';
import { IconService } from '../services/icon.service';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { TrayManagerService } from '../services/tray-manager.service';
import { WindowManagerService } from '../services/window-manager.service';

export function initializeApp(
  configManager: ConfigManagerService,
  windowManager: WindowManagerService,
  shortcutManager: ShortcutManagerService,
  trayManager: TrayManagerService,
  autoUpdater: AutoUpdaterService,
  startupManager: StartupManagerService,
  debugLogger: DebugLoggerService,
  serve: boolean
): void {
  try {
    app.setAppUserModelId('dev.marmotz.ayais');
  } catch {
    // ignore
  }

  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(IconService.getIconPath());
    } catch {
      // ignore
    }
  }

  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  startupManager.sync(configManager.getConfig().launchAtStartup);

  setTimeout(async () => {
    const win = windowManager.createWindow();

    if (configManager.getConfig().launchHidden) {
      windowManager.hideWindow();
    }

    shortcutManager.setupShortcuts();
    autoUpdater.setupAutoUpdater(win);
    await autoUpdater.checkForUpdates();
  }, 400);

  Menu.setApplicationMenu(null);
  trayManager.setupTray();

  setupIPCHandlers(configManager, windowManager, shortcutManager, startupManager, debugLogger, autoUpdater, serve);
}
