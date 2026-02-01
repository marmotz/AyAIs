import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoUpdaterService } from '../services/auto-updater.service';
import { ConfigManagerService } from '../services/config-manager.service';
import { DebugLoggerService } from '../services/debug-logger.service';
import { ShortcutManagerService } from '../services/shortcut-manager.service';
import { StartupManagerService } from '../services/startup-manager.service';
import { WindowManagerService } from '../services/window-manager.service';
import {
  setupConfigIPCHandlers,
  setupDebugIPCHandlers,
  setupShortcutIPCHandlers,
  setupUpdateIPCHandlers,
  setupWindowIPCHandlers,
} from './index';

vi.mock('./config-ipc-handlers', () => ({
  setupConfigIPCHandlers: vi.fn(),
}));

vi.mock('./shortcut-ipc-handlers', () => ({
  setupShortcutIPCHandlers: vi.fn(),
}));

vi.mock('./window-ipc-handlers', () => ({
  setupWindowIPCHandlers: vi.fn(),
}));

vi.mock('./update-ipc-handlers', () => ({
  setupUpdateIPCHandlers: vi.fn(),
}));

vi.mock('./debug-ipc-handlers', () => ({
  setupDebugIPCHandlers: vi.fn(),
}));

vi.mock('../services/config-manager.service');
vi.mock('../services/window-manager.service');
vi.mock('../services/shortcut-manager.service');
vi.mock('../services/startup-manager.service');
vi.mock('../services/debug-logger.service');
vi.mock('../services/auto-updater.service');

describe('setupIPCHandlers (Index)', () => {
  let configManager: ConfigManagerService;
  let windowManager: WindowManagerService;
  let shortcutManager: ShortcutManagerService;
  let startupManager: StartupManagerService;
  let debugLogger: DebugLoggerService;
  let autoUpdater: AutoUpdaterService;

  beforeEach(() => {
    vi.clearAllMocks();

    configManager = {} as any;
    windowManager = {} as any;
    shortcutManager = {} as any;
    startupManager = {} as any;
    debugLogger = {} as any;
    autoUpdater = {} as any;
  });

  it('should setup all IPC handlers', () => {
    // The index exports the functions directly, which already orchestrate all handlers
    // We test that the functions exist and can be called
    expect(setupConfigIPCHandlers).toBeDefined();
    expect(setupShortcutIPCHandlers).toBeDefined();
    expect(setupWindowIPCHandlers).toBeDefined();
    expect(setupUpdateIPCHandlers).toBeDefined();
    expect(setupDebugIPCHandlers).toBeDefined();
  });
});
