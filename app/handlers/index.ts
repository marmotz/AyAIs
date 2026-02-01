import { AutoUpdaterService } from '../services/auto-updater.service';
import { ConfigManagerService } from '../services/config-manager.service';
import { DebugLoggerService } from '../services/debug-logger.service';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { WindowManagerService } from '../services/window-manager.service';
import { setupConfigIPCHandlers } from './config-ipc-handlers';
import { setupDebugIPCHandlers } from './debug-ipc-handlers';
import { setupShortcutIPCHandlers } from './shortcut-ipc-handlers';
import { setupUpdateIPCHandlers } from './update-ipc-handlers';
import { setupWindowIPCHandlers } from './window-ipc-handlers';

export function setupIPCHandlers(
  configManager: ConfigManagerService,
  windowManager: WindowManagerService,
  shortcutManager: ShortcutManagerService,
  startupManager: StartupManagerService,
  debugLogger: DebugLoggerService,
  autoUpdater: AutoUpdaterService,
  serve: boolean
): void {
  setupConfigIPCHandlers(configManager, windowManager, shortcutManager, startupManager);
  setupShortcutIPCHandlers(shortcutManager);
  setupWindowIPCHandlers(windowManager);
  setupUpdateIPCHandlers(autoUpdater, windowManager);
  setupDebugIPCHandlers(debugLogger, startupManager, serve);
}

export { setupConfigIPCHandlers } from './config-ipc-handlers';
export { setupDebugIPCHandlers } from './debug-ipc-handlers';
export { setupShortcutIPCHandlers } from './shortcut-ipc-handlers';
export { setupUpdateIPCHandlers } from './update-ipc-handlers';
export { setupWindowIPCHandlers } from './window-ipc-handlers';
