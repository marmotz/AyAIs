import { app, Menu, Tray } from 'electron';
import { IconService } from './icon.service';
import { WindowManagerService } from './window-manager.service';

export class TrayManagerService {
  private tray: Tray | null = null;

  constructor(private windowManager: WindowManagerService) {}

  onQuit(): void {
    this.windowManager.setQuitting(true);
    app.quit();
  }

  onShowPreferences(): void {
    this.windowManager.showWindow();
    const win = this.windowManager.getWindow();
    if (win) {
      win.webContents.send('open-settings');
    }
  }

  public setupTray(): void {
    const trayMenu = Menu.buildFromTemplate([
      {
        label: 'Preferences',
        click: () => {
          this.onShowPreferences();
        },
      },
      {
        label: 'Quit',
        click: () => {
          this.onQuit();
        },
      },
    ]);

    this.tray = new Tray(IconService.getTrayIcon());
    this.tray.setToolTip('AyAIs');
    this.tray.setContextMenu(trayMenu);

    this.tray.on('click', () => {
      if (this.windowManager.isVisible()) {
        this.windowManager.hideWindow();
      } else {
        this.windowManager.showWindow();
      }
    });
  }
}
