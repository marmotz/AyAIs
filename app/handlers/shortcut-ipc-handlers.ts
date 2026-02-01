import { ipcMain } from 'electron';
import { ShortcutManagerService } from '../services/shortcut-manager.service';

export function setupShortcutIPCHandlers(shortcutManager: ShortcutManagerService): void {
  ipcMain.handle('validate-global-shortcut', async (_event, shortcut: string, excludeId?: string) => {
    try {
      return shortcutManager.validateShortcut(shortcut, excludeId);
    } catch (error) {
      console.error('Failed to validate shortcut', shortcut, error);
      return {
        isValid: false,
        error: 'INVALID_FORMAT' as const,
      };
    }
  });

  ipcMain.handle('handle-shortcut', async (_event, shortcut: string) => {
    try {
      shortcutManager.handleShortcut(shortcut);
    } catch (error) {
      console.error('Failed to handle shortcut', shortcut, error);
    }
  });

  ipcMain.handle('unregister-global-shortcuts', () => {
    shortcutManager.refreshShortcuts();
  });

  ipcMain.handle('register-global-shortcuts', () => {
    shortcutManager.refreshShortcuts();
  });
}
