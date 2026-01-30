export {};

interface AppConfig {
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lastService: string | undefined;
  launchAtStartup: boolean;
  launchHidden: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      getAppConfig: () => Promise<AppConfig>;
      saveAppConfig: (config: Partial<AppConfig>) => Promise<void>;
      getLastService: () => Promise<string | undefined>;
      saveLastService: (service: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onNavigateService: (callback: (direction: 'next' | 'previous') => void) => void;
    };
  }
}
