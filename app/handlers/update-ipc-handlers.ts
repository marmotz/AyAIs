import { ipcMain } from 'electron';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { WindowManagerService } from '../services/window-manager.service';

export function setupUpdateIPCHandlers(autoUpdater: AutoUpdaterService, windowManager: WindowManagerService): void {
  ipcMain.on('start_download', () => {
    void autoUpdater.downloadUpdate();
  });

  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
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
