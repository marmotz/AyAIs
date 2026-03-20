import { AppConfig } from '@shared/types/app-config.interface';

export const MOCK_CONFIG: AppConfig = {
  launchAtStartup: false,
  launchHidden: false,
  lastService: 'default-chatgpt',
  position: {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  },
  shortcuts: {
    globalShortcuts: {
      showHideApp: process.platform === 'darwin' ? 'Meta+I' : 'Ctrl+Shift+I',
    },
    internalShortcuts: {
      openSettings: process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,',
      quitApp: 'Ctrl+Q',
      previousService: 'Ctrl+Shift+Tab',
      nextService: 'Ctrl+Tab',
      refreshService: 'Ctrl+R',
      services: {},
    },
  },
  updateChannel: 'stable',
  serviceOrder: [],
  configuredServices: [
    { id: 'default-chatgpt', serviceName: 'ChatGPT' },
    { id: 'default-claude', serviceName: 'Claude' },
    { id: 'default-gemini', serviceName: 'Gemini' },
  ],
};

export const MOCK_CONFIG_WITH_SERVICES: AppConfig = {
  ...MOCK_CONFIG,
  shortcuts: {
    ...MOCK_CONFIG.shortcuts,
    internalShortcuts: {
      ...MOCK_CONFIG.shortcuts.internalShortcuts,
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
  },
};
