export interface ShortcutConfig {
  globalShortcuts: {
    showHideApp: string;
  };
  internalShortcuts: {
    openSettings: string;
    quitApp: string;
    previousService: string;
    nextService: string;
    services: Record<string, string>;
  };
}

export interface AppConfig {
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lastService: string | undefined;
  launchAtStartup: boolean;
  launchHidden: boolean;
  shortcuts: ShortcutConfig;
}
