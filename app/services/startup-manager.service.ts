import { app } from 'electron';

export class StartupManagerService {
  public disable(): void {
    try {
      app.setLoginItemSettings({
        openAtLogin: false,
        args: [],
      });
    } catch (error) {
      console.error('Failed to disable startup:', error);
    }
  }

  public enable(): void {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        args: [],
      });
    } catch (error) {
      console.error('Failed to enable startup:', error);
    }
  }

  public isEnabled(): boolean {
    try {
      const loginItemSettings = app.getLoginItemSettings();

      return loginItemSettings.openAtLogin;
    } catch (error) {
      console.error('Failed to check startup status:', error);
      return false;
    }
  }

  public sync(shouldBeEnabled: boolean): void {
    try {
      const currentlyEnabled = this.isEnabled();

      if (currentlyEnabled && !shouldBeEnabled) {
        this.disable();
      } else if (!currentlyEnabled && shouldBeEnabled) {
        this.enable();
      }
    } catch (error) {
      console.error('Failed to sync startup settings:', error);
    }
  }
}
