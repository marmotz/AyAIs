declare module '*.css';
declare module '@fontsource/*' {}
declare module '@fontsource-variable/*' {}

export {};

interface AppConfig {
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lastService: string | undefined;
  openOnStartup: boolean;
  launchMinimized: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      getAppConfig: () => Promise<AppConfig>;
      saveAppConfig: (config: AppConfig) => Promise<void>;
      getLastService: () => Promise<string | undefined>;
      saveLastService: (service: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}
