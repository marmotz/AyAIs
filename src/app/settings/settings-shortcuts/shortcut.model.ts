export interface Shortcut {
  id: string;
  label: string;
  value: string;
}

export const DEFAULT_SHORTCUTS = {
  globalShortcuts: [{ id: 'showHideApp', label: 'Show/Hide App' }],
  internalShortcuts: [
    { id: 'openSettings', label: 'Open Settings' },
    { id: 'quitApp', label: 'Quit App' },
    { id: 'previousService', label: 'Previous AI Service' },
    { id: 'nextService', label: 'Next AI Service' },
    { id: 'service1', label: 'Go to Service 1' },
    { id: 'service2', label: 'Go to Service 2' },
    { id: 'service3', label: 'Go to Service 3' },
    { id: 'service4', label: 'Go to Service 4' },
    { id: 'service5', label: 'Go to Service 5' },
    { id: 'service6', label: 'Go to Service 6' },
    { id: 'service7', label: 'Go to Service 7' },
    { id: 'service8', label: 'Go to Service 8' },
    { id: 'service9', label: 'Go to Service 9' },
    { id: 'service10', label: 'Go to Service 10' },
  ],
};
