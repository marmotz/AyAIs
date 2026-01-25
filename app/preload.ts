import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  getLastService: () => ipcRenderer.invoke('get-last-service'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  saveAppConfig: (config: any) => ipcRenderer.invoke('save-app-config', config),
  saveLastService: (service: string) => ipcRenderer.invoke('save-last-service', service),
});
