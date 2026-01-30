import { AppConfig, ShortcutConfig } from '@shared/types/app-config.interface';

const DEFAULT_SHORTCUT_CONFIG: ShortcutConfig = {
  globalShortcuts: {
    showHideApp: 'Super+I',
  },
  internalShortcuts: {
    openSettings: process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,',
    quitApp: 'Ctrl+X',
    previousService: 'Ctrl+Shift+Tab',
    nextService: 'Ctrl+Tab',
    services: {
      service1: 'Ctrl+1',
      service2: 'Ctrl+2',
      service3: 'Ctrl+3',
      service4: 'Ctrl+4',
      service5: 'Ctrl+5',
      service6: 'Ctrl+6',
      service7: 'Ctrl+7',
      service8: 'Ctrl+8',
      service9: 'Ctrl+9',
      service10: 'Ctrl+0',
    },
  },
};

export const DEFAULT_CONFIGURATION: AppConfig = {
  launchAtStartup: false,
  launchHidden: false,
  lastService: undefined,
  shortcuts: DEFAULT_SHORTCUT_CONFIG,
  position: {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  },
};
