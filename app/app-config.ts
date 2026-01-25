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
}
