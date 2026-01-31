import { AppConfig } from '@shared/types/app-config.interface';

declare global {
  interface Window {
    electronAPI: {
      getAppConfig: () => Promise<AppConfig>;
      saveAppConfig: (config: Partial<AppConfig>) => Promise<void>;
      getLastService: () => Promise<string | undefined>;
      saveLastService: (service: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onNavigateService: (callback: (direction: 'next' | 'previous') => void) => void;
      onSelectService: (callback: (index: number) => void) => void;
      onOpenSettings: (callback: () => void) => void;
      disableShortcuts: () => Promise<void>;
      enableShortcuts: () => Promise<void>;
      quitApp: () => Promise<void>;
    };
  }
}
