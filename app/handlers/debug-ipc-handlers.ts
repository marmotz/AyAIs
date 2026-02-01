import { ipcMain } from 'electron';
import { DebugLoggerService } from '../services/debug-logger.service';
import { StartupManagerService } from '../services/startup-manager.service';

export function setupDebugIPCHandlers(
  debugLogger: DebugLoggerService,
  startupManager: StartupManagerService,
  serve: boolean
): void {
  ipcMain.handle('log-debug', async (_event, message: string) => {
    debugLogger.log(message);
  });

  ipcMain.handle('is-dev-mode', () => {
    return serve;
  });

  ipcMain.handle('is-startup-enabled', () => {
    try {
      return startupManager.isEnabled();
    } catch (error) {
      console.error('Failed to check startup status', error);
      return false;
    }
  });
}
