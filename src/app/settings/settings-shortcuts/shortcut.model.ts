export interface Shortcut {
  id: string;
  label: string;
  value: string;
}

export interface ShortcutConfig {
  previousService: Shortcut;
  nextService: Shortcut;
  services: Shortcut[];
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  previousService: {
    id: 'previousService',
    label: 'Previous AI Service',
    value: 'Ctrl+Shift+Tab',
  },
  nextService: {
    id: 'nextService',
    label: 'Next AI Service',
    value: 'Ctrl+Tab',
  },
  services: [
    { id: 'service1', label: 'Go to Service 1', value: 'Ctrl+1' },
    { id: 'service2', label: 'Go to Service 2', value: 'Ctrl+2' },
    { id: 'service3', label: 'Go to Service 3', value: 'Ctrl+3' },
    { id: 'service4', label: 'Go to Service 4', value: 'Ctrl+4' },
    { id: 'service5', label: 'Go to Service 5', value: 'Ctrl+5' },
    { id: 'service6', label: 'Go to Service 6', value: 'Ctrl+6' },
    { id: 'service7', label: 'Go to Service 7', value: 'Ctrl+7' },
    { id: 'service8', label: 'Go to Service 8', value: 'Ctrl+8' },
    { id: 'service9', label: 'Go to Service 9', value: 'Ctrl+9' },
    { id: 'service10', label: 'Go to Service 10', value: 'Ctrl+0' },
  ],
};
