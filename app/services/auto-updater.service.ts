import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { ConfigManagerService } from './config-manager.service';

export class AutoUpdaterService {
  private currentWindow: BrowserWindow | undefined;

  constructor(private readonly configManager: ConfigManagerService) {
    this.setupChannel();
  }

  public async checkForUpdates(): Promise<void> {
    if (!this.isUpdaterEnabled()) {
      return;
    }

    this.updateChannel();

    try {
      const updateInfo = await autoUpdater.checkForUpdates();

      if (this.currentWindow) {
        if (updateInfo?.isUpdateAvailable) {
          this.currentWindow.webContents.send('update_available');
        } else {
          this.currentWindow.webContents.send('update_not_available');
        }
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (!errorMessage.includes('Cannot find latest-')) {
        console.error('[AutoUpdate] Failed to check for updates:', errorMessage);
      }
    }
  }

  public async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('[AutoUpdate] Failed to download update:', (error as Error).message);
    }
  }

  public quitAndInstall(): void {
    autoUpdater.quitAndInstall();
  }

  public setupAutoUpdater(win?: BrowserWindow): void {
    this.currentWindow = win;
    this.updateChannel();
    autoUpdater.autoDownload = false;

    autoUpdater.on('update-downloaded', () => {
      if (this.currentWindow) {
        this.currentWindow.webContents.send('update_downloaded');
      }
    });

    autoUpdater.on('error', (error) => {
      const errorMessage = (error as Error).message;
      if (!errorMessage.includes('Cannot find latest-')) {
        console.error('[AutoUpdate] Error:', errorMessage);
      }
    });
  }

  private isUpdaterEnabled(): boolean {
    if (!app.isPackaged) {
      return false;
    }

    if (process.env.AYAIS_DISABLE_UPDATER === 'true') {
      return false;
    }

    return true;
  }

  private setupChannel(): void {
    this.updateChannel();
  }

  private updateChannel(): void {
    const config = this.configManager.getConfig();
    const channel = config.updateChannel;

    if (channel === 'beta') {
      autoUpdater.channel = 'beta';
    } else {
      autoUpdater.channel = 'latest';
    }
  }
}
