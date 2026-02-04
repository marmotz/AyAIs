import { ipcMain } from 'electron';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { WindowManagerService } from '../services/window-manager.service';

export function setupUpdateIPCHandlers(autoUpdater: AutoUpdaterService, windowManager: WindowManagerService): void {
  ipcMain.handle('check-for-updates', async () => {
    await autoUpdater.checkForUpdates();
  });

  ipcMain.on('start_download', async () => {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[UpdateIPC] Failed to download update:', errorMessage);
      const win = windowManager.getWindow();
      if (win) {
        win.webContents.send('update_download_failed', errorMessage);
      }
    }
  });

  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('renderer-ready', async () => {
    await autoUpdater.checkForUpdates();
  });

  ipcMain.on('simulate-update-available', () => {
    console.log('Simulate an "update available" event');

    const win = windowManager.getWindow();
    if (win) {
      win.webContents.send('update_available');
    }
  });

  ipcMain.on('simulate-update-downloaded', () => {
    console.log('Simulate an "update downloaded" event');

    const win = windowManager.getWindow();
    if (win) {
      win.webContents.send('update_downloaded');
    }
  });
}
