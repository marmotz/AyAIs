import { AppConfig } from '@shared/types/app-config.interface';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  saveAppConfig: (config: Partial<AppConfig>) => ipcRenderer.invoke('save-app-config', config),
  getLastService: () => ipcRenderer.invoke('get-last-service'),
  saveLastService: (service: string) => ipcRenderer.invoke('save-last-service', service),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', () => callback());
  },
  quitApp: () => ipcRenderer.invoke('quit-app'),
  validateGlobalShortcut: (shortcut: string, excludeId?: string) =>
    ipcRenderer.invoke('validate-global-shortcut', shortcut, excludeId),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  unregisterGlobalShortcuts: () => ipcRenderer.invoke('unregister-global-shortcuts'),
  registerGlobalShortcuts: () => ipcRenderer.invoke('register-global-shortcuts'),
  logDebug: (message: string) => ipcRenderer.invoke('log-debug', message),
  isDevMode: () => ipcRenderer.invoke('is-dev-mode'),
  sendDevShortcut: () => ipcRenderer.send('dev-shortcut'),
  onOpenDevPage: (callback: () => void) => {
    ipcRenderer.on('open-dev-page', () => callback());
  },
  onUpdateAvailable: (
    callback: (updateInfo: { version: string; releaseDate: string; releaseNotes: string; prerelease: boolean }) => void
  ) => {
    ipcRenderer.on('update_available', (_event, updateInfo) => callback(updateInfo));
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update_not_available', () => callback());
  },
  openUpdateURL: () => ipcRenderer.send('open-update-url'),
  getUpdateURL: () => ipcRenderer.invoke('get-update-url'),
  simulateUpdateAvailable: () => ipcRenderer.send('simulate-update-available'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
});
