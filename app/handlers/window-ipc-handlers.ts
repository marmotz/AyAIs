import { app, ipcMain, shell } from 'electron';
import { WindowManagerService } from '../services/window-manager.service';

export function setupWindowIPCHandlers(windowManager: WindowManagerService): void {
  ipcMain.handle('quit-app', () => {
    windowManager.setQuitting(true);
    app.quit();
  });

  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
      return true;
    } catch (error) {
      console.error('Failed to open external URL', url, error);
      return false;
    }
  });

  ipcMain.handle('get-platform', () => {
    return process.platform;
  });

  ipcMain.on('dev-shortcut', () => {
    const win = windowManager.getWindow();
    if (win) {
      win.webContents.send('open-dev-page');
    }
  });
}
