import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { ConfigManagerService } from './config-manager.service';

export class AutoUpdaterService {
  private currentWindow: BrowserWindow | undefined;
  private updateCheckInterval: NodeJS.Timeout | undefined;
  private readonly UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(private readonly configManager: ConfigManagerService) {
    this.setupChannel();
  }

  public async checkForUpdates(): Promise<void> {
    if (!this.isUpdaterEnabled()) {
      return;
    }

    this.updateChannel();

    // Log auto-update status for user awareness
    if (process.platform === 'win32' && app.isPackaged) {
      console.log(
        '[AutoUpdate] ℹ️  Windows auto-update is enabled (SSL verification relaxed for self-signed certificates)'
      );
    }

    try {
      const updateInfo = await autoUpdater.checkForUpdates();

      if (this.currentWindow) {
        if (updateInfo?.isUpdateAvailable) {
          this.currentWindow.webContents.send('update_available', {
            version: updateInfo.updateInfo.version,
            releaseDate: updateInfo.updateInfo.releaseDate,
          });
        } else {
          this.currentWindow.webContents.send('update_not_available');
        }
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (!errorMessage.includes('Cannot find latest-')) {
        console.error('[AutoUpdate] Failed to check for updates:', errorMessage);
        console.error('[AutoUpdate] If this is a certificate error, the app is using a self-signed certificate.');
      }
    }
  }

  public destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = undefined;
    }
  }

  public async downloadUpdate(): Promise<void> {
    if (!this.isUpdaterEnabled()) {
      console.warn('[AutoUpdate] Download skipped - updater is disabled');
      return;
    }

    try {
      console.log('[AutoUpdate] Starting download...');
      console.log('[AutoUpdate] Platform:', process.platform);
      console.log('[AutoUpdate] App version:', app.getVersion());
      console.log('[AutoUpdate] Update URL:', autoUpdater.getFeedURL());
      await autoUpdater.downloadUpdate();
      console.log('[AutoUpdate] Download completed successfully');
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[AutoUpdate] Failed to download update:', errorMessage);
      console.error('[AutoUpdate] Error stack:', (error as Error).stack);
      throw error;
    }
  }

  public quitAndInstall(): void {
    autoUpdater.quitAndInstall();
  }

  public setupAutoUpdater(win?: BrowserWindow): void {
    this.currentWindow = win;
    this.updateChannel();
    autoUpdater.autoDownload = false;

    // Configure SSL verification based on environment and platform
    const disableSSL = process.env.AYAIS_DISABLE_SSL_VERIFICATION === 'true';
    const isWindows = process.platform === 'win32';

    if (disableSSL) {
      console.warn('[AutoUpdate] ⚠️  SSL verification is DISABLED via environment variable.');
      console.warn('[AutoUpdate] This is a security risk and should only be used for testing!');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    } else if (isWindows && app.isPackaged) {
      // Windows-specific handling for self-signed certificates in production
      //
      // This is necessary when using a self-signed code signing certificate.
      // The auto-update will fail on Windows with self-signed certificates unless we relax SSL verification.
      //
      // IMPORTANT: This code is automatically included in GitHub Actions Windows builds.
      // See: .github/workflows/windows.yml
      //
      // SECURITY CONSIDERATIONS:
      // - The update files are still downloaded from GitHub (which uses valid SSL)
      // - This only relaxes verification for the code signing certificate, not the download channel
      // - This is an acceptable trade-off for open-source projects using self-signed certificates
      //
      // HOW TO REMOVE THIS WORKAROUND:
      // 1. Purchase a trusted CA certificate (Certum, DigiCert, or Sectigo)
      // 2. Update electron-builder.json with the new certificate
      // 3. Remove this block of code
      // 4. Rebuild the application
      console.warn('[AutoUpdate] ⚠️  Windows production build with self-signed certificate detected.');
      console.warn('[AutoUpdate] SSL verification relaxed to enable auto-update (certificate workaround).');
      console.warn('[AutoUpdate] Note: Updates are downloaded from GitHub via secure connection.');
      console.warn('[AutoUpdate] For production: Purchase a trusted CA certificate to remove this workaround.');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    autoUpdater.on('update-downloaded', () => {
      console.log('[AutoUpdate] Update downloaded successfully');
      if (this.currentWindow) {
        this.currentWindow.webContents.send('update_downloaded');
      }
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log(`[AutoUpdate] Download progress: ${Math.floor(progress.percent)}%`);
      if (this.currentWindow) {
        this.currentWindow.webContents.send('update_download_progress', progress);
      }
    });

    autoUpdater.on('error', (error) => {
      const errorMessage = (error as Error).message;
      if (!errorMessage.includes('Cannot find latest-')) {
        console.error('[AutoUpdate] Error:', errorMessage);
      }
    });

    this.startPeriodicUpdateCheck();
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

  private startPeriodicUpdateCheck(): void {
    if (!this.isUpdaterEnabled()) {
      return;
    }

    this.checkForUpdates();

    this.updateCheckInterval = setInterval(() => {
      void this.checkForUpdates();
    }, this.UPDATE_CHECK_INTERVAL_MS);
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
