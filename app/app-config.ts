export interface AppConfig {
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
