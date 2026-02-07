import { app, globalShortcut } from 'electron';
import { ConfigManagerService } from '../services/config-manager.service';
import { UpdateCheckerService } from '../services/update-checker.service';
import { WindowManagerService } from '../services/window-manager.service';

export function registerAppEventListeners(
  windowManager: WindowManagerService,
  updateChecker: UpdateCheckerService,
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
      updateChecker.setupAutoUpdater(win);

      if (configManager.getConfig().launchHidden) {
        windowManager.hideWindow();
      }
    }
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    updateChecker.destroy();
  });
}
