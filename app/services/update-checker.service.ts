import { compareVersions } from 'compare-versions';
import { app, BrowserWindow } from 'electron';
import { ConfigManagerService } from './config-manager.service';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  prerelease: boolean;
}

export class UpdateCheckerService {
  private currentWindow: BrowserWindow | undefined;
  private updateCheckInterval: NodeJS.Timeout | undefined;
  private readonly UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private readonly GITHUB_API_LATEST_URL = 'https://api.github.com/repos/marmotz/AyAIs/releases/latest';
  private readonly GITHUB_API_ALL_RELEASES_URL = 'https://api.github.com/repos/marmotz/AyAIs/releases';
  private readonly GITHUB_REPO_URL = 'https://github.com/marmotz/AyAIs';

  constructor(private readonly configManager: ConfigManagerService) {}

  public async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const updateInfo = await this.fetchLatestRelease();

      if (updateInfo && this.isNewerVersion(updateInfo.version)) {
        if (this.currentWindow) {
          this.currentWindow.webContents.send('update_available', updateInfo);
        }

        return updateInfo;
      }

      if (this.currentWindow) {
        this.currentWindow.webContents.send('update_not_available');
      }

      return null;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[UpdateChecker] Failed to check for updates:', errorMessage);

      return null;
    }
  }

  public destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = undefined;
    }
  }

  public getUpdateURL(): string {
    const platform = process.platform;
    let anchor = '';

    if (platform === 'win32') {
      anchor = '#windows';
    } else if (platform === 'darwin') {
      anchor = '#macos';
    } else if (platform === 'linux') {
      anchor = '#linux';
    }

    return `${this.GITHUB_REPO_URL}${anchor}`;
  }

  public setupAutoUpdater(win?: BrowserWindow): void {
    this.currentWindow = win;
    this.startPeriodicUpdateCheck();
  }

  private async fetchLatestBeta(): Promise<UpdateInfo | null> {
    const response = await fetch(this.GITHUB_API_ALL_RELEASES_URL, {
      headers: {
        'User-Agent': 'AyAIs-UpdateChecker',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const releases = await response.json();

    if (!releases || !Array.isArray(releases) || releases.length === 0) {
      console.log('[UpdateChecker] No releases found');
      return null;
    }

    const latestRelease = releases[0];

    return {
      version: latestRelease.tag_name.startsWith('v') ? latestRelease.tag_name.substring(1) : latestRelease.tag_name,
      releaseDate: latestRelease.published_at,
      releaseNotes: latestRelease.body || '',
      prerelease: latestRelease.prerelease || false,
    };
  }

  private async fetchLatestRelease(): Promise<UpdateInfo | null> {
    try {
      const config = this.configManager.getConfig();
      const isBetaChannel = config.updateChannel === 'beta';

      console.log(`[UpdateChecker] Checking ${config.updateChannel} channel for updates...`);

      if (isBetaChannel) {
        return await this.fetchLatestBeta();
      } else {
        return await this.fetchLatestStable();
      }
    } catch (error) {
      console.error('[UpdateChecker] Failed to fetch latest release:', error);

      throw error;
    }
  }

  private async fetchLatestStable(): Promise<UpdateInfo | null> {
    const response = await fetch(this.GITHUB_API_LATEST_URL, {
      headers: {
        'User-Agent': 'AyAIs-UpdateChecker',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const release = await response.json();

    if (!release || !release.tag_name) {
      console.log('[UpdateChecker] No release found');

      return null;
    }

    return {
      version: release.tag_name.startsWith('v') ? release.tag_name.substring(1) : release.tag_name,
      releaseDate: release.published_at,
      releaseNotes: release.body || '',
      prerelease: false,
    };
  }

  private isNewerVersion(latestVersion: string): boolean {
    const currentVersion = app.getVersion();
    try {
      return compareVersions(latestVersion, currentVersion) > 0;
    } catch (error) {
      console.error('[UpdateChecker] Error comparing versions:', error);

      return false;
    }
  }

  private startPeriodicUpdateCheck(): void {
    // check at launch
    void this.checkForUpdates();

    // check every UPDATE_CHECK_INTERVAL_MS
    this.updateCheckInterval = setInterval(() => {
      void this.checkForUpdates();
    }, this.UPDATE_CHECK_INTERVAL_MS);
  }
}
