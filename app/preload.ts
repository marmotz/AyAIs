import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig } from './app-config';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  saveAppConfig: (config: Partial<AppConfig>) => ipcRenderer.invoke('save-app-config', config),
  getLastService: () => ipcRenderer.invoke('get-last-service'),
  saveLastService: (service: string) => ipcRenderer.invoke('save-last-service', service),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onNavigateService: (callback: (direction: 'next' | 'previous') => void) => {
    ipcRenderer.on('navigate-service', (_event, direction) => callback(direction));
  },
  onSelectService: (callback: (index: number) => void) => {
    ipcRenderer.on('select-service', (_event, index) => callback(index));
  },
});
