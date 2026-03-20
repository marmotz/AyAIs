export interface ShortcutConfig {
  globalShortcuts: {
    showHideApp: string;
  };
  internalShortcuts: {
    openSettings: string;
    quitApp: string;
    previousService: string;
    nextService: string;
    refreshService: string;
    services: Record<string, string>;
  };
}

export type UpdateChannel = 'stable' | 'beta';

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
  updateChannel: UpdateChannel;
  serviceOrder: string[];
  configuredServices: { id: string; serviceName: string }[];
}
