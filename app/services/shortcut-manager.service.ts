import { AppConfig } from '@shared/types/app-config.interface';
import { globalShortcut } from 'electron';
import { ConfigManagerService } from './config-manager.service';
import { WindowManagerService } from './window-manager.service';

export class ShortcutManagerService {
  private appConfig: AppConfig;
  private windowManager: WindowManagerService;

  constructor(configManager: ConfigManagerService, windowManager: WindowManagerService) {
    this.appConfig = configManager.getConfig();
    this.windowManager = windowManager;

    this.updateConfig(configManager.getConfig());
  }

  public handleShortcut(shortcut: string): void {
    if (!this.windowManager.getWindow()) {
      return;
    }

    const config = this.appConfig.shortcuts;

    if (shortcut === config.globalShortcuts.showHideApp) {
      const win = this.windowManager.getWindow();
      if (win) {
        if (win.isVisible() && win.isFocused()) {
          this.windowManager.hideWindow();
        } else {
          this.windowManager.showWindow();
        }
      }
    }
  }

  public refreshShortcuts(): void {
    this.unregisterGlobalShortcuts();
    this.registerGlobalShortcuts();
  }

  public setupShortcuts(): void {
    this.registerGlobalShortcuts();
  }

  public updateConfig(appConfig: AppConfig): void {
    this.appConfig = appConfig;
  }

  public validateShortcut(
    shortcut: string,
    excludeId?: string
  ): {
    isValid: boolean;
    error?: 'INVALID_FORMAT' | 'INTERNAL_CONFLICT' | 'EXTERNAL_CONFLICT';
    conflictedShortcut?: string;
  } {
    if (!shortcut || shortcut.trim() === '') {
      return {
        isValid: true,
      };
    }

    try {
      const registered = globalShortcut.register(shortcut, () => {
        // Temporary empty callback for testing
      });

      if (!registered) {
        return {
          isValid: false,
          error: 'EXTERNAL_CONFLICT',
        };
      }

      globalShortcut.unregister(shortcut);
    } catch (error) {
      console.error('Invalid shortcut format:', shortcut, error);

      return {
        isValid: false,
        error: 'INVALID_FORMAT',
      };
    }

    if (shortcut === this.appConfig.shortcuts.globalShortcuts.showHideApp && excludeId !== 'showHideApp') {
      return {
        isValid: false,
        error: 'INTERNAL_CONFLICT',
        conflictedShortcut: 'showHideApp',
      };
    }

    return {
      isValid: true,
    };
  }

  private registerGlobalShortcuts(): void {
    const shortcut = this.appConfig.shortcuts.globalShortcuts.showHideApp;

    if (!shortcut) {
      return;
    }

    try {
      const registered = globalShortcut.register(shortcut, () => {
        this.handleShortcut(shortcut);
      });

      if (!registered) {
        console.warn(`Failed to register global shortcut: ${shortcut} (already in use by another application)`);
      }
    } catch (error) {
      console.error(`Invalid global shortcut format: ${shortcut}`, error);
    }
  }

  private unregisterGlobalShortcuts(): void {
    globalShortcut.unregister(this.appConfig.shortcuts.globalShortcuts.showHideApp);
  }
}
