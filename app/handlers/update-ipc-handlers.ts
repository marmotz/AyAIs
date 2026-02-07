import { ipcMain, shell } from 'electron';
import { UpdateCheckerService } from '../services/update-checker.service';
import { WindowManagerService } from '../services/window-manager.service';

export function setupUpdateIPCHandlers(updateChecker: UpdateCheckerService, windowManager: WindowManagerService): void {
  ipcMain.handle('check-for-updates', async () => {
    await updateChecker.checkForUpdates();
  });

  ipcMain.handle('get-update-url', () => {
    return updateChecker.getUpdateURL();
  });

  ipcMain.on('open-update-url', async () => {
    const updateUrl = updateChecker.getUpdateURL();
    await shell.openExternal(updateUrl);
  });

  ipcMain.on('simulate-update-available', () => {
    console.log('Simulate an "update available" event');

    const win = windowManager.getWindow();
    if (win) {
      win.webContents.send('update_available', {
        version: '13.0.2',
        releaseDate: new Date().toISOString(),
        releaseNotes: 'Simulated update',
      });
    }
  });
}
