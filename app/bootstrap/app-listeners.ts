import { app, globalShortcut } from 'electron';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { ConfigManagerService } from '../services/config-manager.service';
import { WindowManagerService } from '../services/window-manager.service';

export function registerAppEventListeners(
  windowManager: WindowManagerService,
  autoUpdater: AutoUpdaterService,
  configManager: ConfigManagerService
): void {
  app.on('before-quit', () => {
    windowManager.setQuitting(true);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('second-instance', () => {
    windowManager.showWindow();
  });

  app.on('activate', () => {
    if (!windowManager.getWindow()) {
      const win = windowManager.createWindow();
      autoUpdater.setupAutoUpdater(win);

      if (configManager.getConfig().launchHidden) {
        windowManager.hideWindow();
      }
    }
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
