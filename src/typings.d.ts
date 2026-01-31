import { AppConfig } from '@shared/types/app-config.interface';

declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}
