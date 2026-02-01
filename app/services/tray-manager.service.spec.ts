import { Menu, app } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrayManagerService } from './tray-manager.service';

let globalMockTray: any = null;

vi.mock('electron', () => {
  const MockTray = class {
    constructor() {
      globalMockTray = {
        setToolTip: vi.fn(),
        setContextMenu: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
      };
      return globalMockTray;
    }
  };

  return {
    Tray: MockTray,
    Menu: {
      buildFromTemplate: vi.fn(() => []),
    },
    app: {
      quit: vi.fn(),
    },
  };
});

vi.mock('./icon.service', () => ({
  IconService: {
    getTrayIcon: vi.fn(() => 'mock-icon'),
  },
}));

vi.mock('./window-manager.service', () => ({
  WindowManagerService: vi.fn().mockImplementation(() => ({
    showWindow: vi.fn(),
    getWindow: vi.fn(),
    isVisible: vi.fn(),
    hideWindow: vi.fn(),
    setQuitting: vi.fn(),
    toggleWindow: vi.fn(),
  })),
}));

describe('TrayManagerService', () => {
  let trayManager: TrayManagerService;
  let windowManager: any;

  beforeEach(() => {
    vi.clearAllMocks();

    windowManager = {
      showWindow: vi.fn(),
      getWindow: vi.fn(),
      isVisible: vi.fn(),
      hideWindow: vi.fn(),
      setQuitting: vi.fn(),
      toggleWindow: vi.fn(),
    };

    trayManager = new TrayManagerService(windowManager as any);
  });

  it('should setup tray with menu', () => {
    trayManager.setupTray();

    expect(Menu.buildFromTemplate).toHaveBeenCalledWith([
      {
        label: 'Show/Hide',
        click: expect.any(Function),
      },
      {
        label: 'Preferences',
        click: expect.any(Function),
      },
      {
        label: 'Quit',
        click: expect.any(Function),
      },
    ]);
    expect(globalMockTray.setToolTip).toHaveBeenCalledWith('AyAIs');
    expect(globalMockTray.setContextMenu).toHaveBeenCalledWith([]);
  });

  it('should call toggleWindow when Show/Hide is clicked', () => {
    trayManager.setupTray();

    const menuTemplate = (Menu.buildFromTemplate as any).mock.calls[0][0];
    menuTemplate[0].click();

    expect(windowManager.toggleWindow).toHaveBeenCalled();
  });

  it('should call onShowPreferences when preferences is clicked', () => {
    trayManager.setupTray();

    const menuTemplate = (Menu.buildFromTemplate as any).mock.calls[0][0];
    menuTemplate[1].click();

    expect(windowManager.showWindow).toHaveBeenCalled();
  });

  it('should call onQuit when quit is clicked', () => {
    trayManager.setupTray();

    const menuTemplate = (Menu.buildFromTemplate as any).mock.calls[0][0];
    menuTemplate[2].click();

    expect(windowManager.setQuitting).toHaveBeenCalledWith(true);
    expect(app.quit).toHaveBeenCalled();
  });

  it('should call toggleWindow when tray is clicked', () => {
    trayManager.setupTray();

    const clickHandler = globalMockTray.on.mock.calls[0][1];
    clickHandler();

    expect(windowManager.toggleWindow).toHaveBeenCalled();
  });
});
