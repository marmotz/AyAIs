import { AppConfig } from '@shared/types/app-config.interface';

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getAppConfig: () => Promise<AppConfig>;
      saveAppConfig: (config: Partial<AppConfig>) => Promise<void>;
      getLastService: () => Promise<string | undefined>;
      saveLastService: (service: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onOpenSettings: (callback: () => void) => void;
      quitApp: () => Promise<void>;
      validateGlobalShortcut: (
        shortcut: string,
        excludeId?: string
      ) => Promise<{
        isValid: boolean;
        error?: 'INVALID_FORMAT' | 'INTERNAL_CONFLICT' | 'EXTERNAL_CONFLICT';
        conflictedShortcut?: string;
      }>;
      getPlatform: () => Promise<string>;
      unregisterGlobalShortcuts: () => Promise<void>;
      registerGlobalShortcuts: () => Promise<void>;
      logDebug: (message: string) => Promise<void>;
      isDevMode: () => Promise<boolean>;
      sendDevShortcut: () => void;
      onOpenDevPage: (callback: () => void) => void;
      onUpdateAvailable: (
        callback: (updateInfo: {
          version: string;
          releaseDate: string;
          releaseNotes: string;
          prerelease: boolean;
        }) => void
      ) => void;
      onUpdateNotAvailable: (callback: () => void) => void;
      openUpdateURL: () => void;
      getUpdateURL: () => Promise<string>;
      simulateUpdateAvailable: () => void;
      checkForUpdates: () => Promise<void>;
    };
  }
}
