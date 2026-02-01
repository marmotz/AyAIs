import { nativeImage } from 'electron';
import { resolve } from 'node:path';

export class IconService {
  public static getIconPath(): string {
    return resolve(__dirname, '../icon.png');
  }

  public static getTrayIcon(): any {
    if (process.platform === 'darwin') {
      try {
        const base = nativeImage.createFromPath(this.getIconPath());
        const small = base.resize({ width: 16, height: 16 });
        small.setTemplateImage(true);

        return small;
      } catch {
        // fallback below
      }
    }

    return nativeImage.createFromPath(this.getIconPath());
  }
}
