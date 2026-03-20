import { AppConfig, ShortcutConfig } from '@shared/types/app-config.interface';

const DEFAULT_SHORTCUT_CONFIG: ShortcutConfig = {
  globalShortcuts: {
    showHideApp: process.platform === 'win32' ? 'Ctrl+Alt+I' : 'Meta+I',
  },
  internalShortcuts: {
    openSettings: process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,',
    quitApp: 'Ctrl+Q',
    previousService: 'Ctrl+Shift+Tab',
    nextService: 'Ctrl+Tab',
    refreshService: 'Ctrl+R',
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

const DEFAULT_CONFIGURED_SERVICES = [
  { id: 'default-chatgpt', serviceName: 'ChatGPT' },
  { id: 'default-claude', serviceName: 'Claude' },
  { id: 'default-gemini', serviceName: 'Gemini' },
];

export function getConfiguredServices(
  configuredServices: { id: string; serviceName: string }[] | undefined,
  serviceOrder: string[]
): { id: string; serviceName: string }[] {
  if (configuredServices?.length) {
    return configuredServices;
  }

  if (serviceOrder?.length) {
    return serviceOrder.map((name, index) => ({
      id: `migrated-${name.toLowerCase()}-${index}`,
      serviceName: name,
    }));
  }

  return [...DEFAULT_CONFIGURED_SERVICES];
}

export const DEFAULT_CONFIGURATION: AppConfig = {
  launchAtStartup: true,
  launchHidden: false,
  lastService: undefined,
  shortcuts: DEFAULT_SHORTCUT_CONFIG,
  position: {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  },
  updateChannel: 'stable',
  serviceOrder: [],
  configuredServices: [...DEFAULT_CONFIGURED_SERVICES],
};
