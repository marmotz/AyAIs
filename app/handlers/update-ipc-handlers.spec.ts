import { ipcMain, shell } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateCheckerService } from '../services/update-checker.service';
import { WindowManagerService } from '../services/window-manager.service';
import { setupUpdateIPCHandlers } from './update-ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  shell: {
    openExternal: vi.fn(),
  },
}));

describe('setupUpdateIPCHandlers', () => {
  let mockUpdateChecker: UpdateCheckerService;
  let mockWindowManager: WindowManagerService;

  beforeEach(() => {
    mockUpdateChecker = {
      checkForUpdates: vi.fn().mockResolvedValue(null),
      getUpdateURL: vi.fn().mockReturnValue('https://github.com/marmotz/AyAIs#windows'),
    } as unknown as UpdateCheckerService;

    mockWindowManager = {
      getWindow: vi.fn().mockReturnValue({
        webContents: {
          send: vi.fn(),
        },
      }),
    } as unknown as WindowManagerService;

    vi.clearAllMocks();
  });

  it('should set up IPC handlers', () => {
    setupUpdateIPCHandlers(mockUpdateChecker, mockWindowManager);

    expect(ipcMain.handle).toHaveBeenCalledWith('check-for-updates', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('get-update-url', expect.any(Function));
    expect(ipcMain.on).toHaveBeenCalledWith('open-update-url', expect.any(Function));
    expect(ipcMain.on).toHaveBeenCalledWith('simulate-update-available', expect.any(Function));
  });

  it('should handle check-for-updates', async () => {
    setupUpdateIPCHandlers(mockUpdateChecker, mockWindowManager);

    const handleCalls = (ipcMain.handle as ReturnType<typeof vi.fn>).mock.calls;
    const checkForUpdatesHandler = handleCalls.find((call) => call[0] === 'check-for-updates');

    if (checkForUpdatesHandler) {
      await checkForUpdatesHandler[1]();
      expect(mockUpdateChecker.checkForUpdates).toHaveBeenCalled();
    }
  });

  it('should handle get-update-url', () => {
    setupUpdateIPCHandlers(mockUpdateChecker, mockWindowManager);

    const handleCalls = (ipcMain.handle as ReturnType<typeof vi.fn>).mock.calls;
    const getUpdateUrlHandler = handleCalls.find((call) => call[0] === 'get-update-url');

    if (getUpdateUrlHandler) {
      const url = getUpdateUrlHandler[1]();
      expect(url).toBe('https://github.com/marmotz/AyAIs#windows');
      expect(mockUpdateChecker.getUpdateURL).toHaveBeenCalled();
    }
  });

  it('should handle open-update-url', () => {
    setupUpdateIPCHandlers(mockUpdateChecker, mockWindowManager);

    const onCalls = (ipcMain.on as ReturnType<typeof vi.fn>).mock.calls;
    const openUpdateUrlHandler = onCalls.find((call) => call[0] === 'open-update-url');

    if (openUpdateUrlHandler) {
      openUpdateUrlHandler[1]();
      expect(mockUpdateChecker.getUpdateURL).toHaveBeenCalled();
      expect(shell.openExternal).toHaveBeenCalledWith('https://github.com/marmotz/AyAIs#windows');
    }
  });

  it('should handle simulate-update-available', () => {
    setupUpdateIPCHandlers(mockUpdateChecker, mockWindowManager);

    const onCalls = (ipcMain.on as ReturnType<typeof vi.fn>).mock.calls;
    const simulateHandler = onCalls.find((call) => call[0] === 'simulate-update-available');

    if (simulateHandler) {
      simulateHandler[1]();

      const mockWin = mockWindowManager.getWindow();
      if (mockWin) {
        expect(mockWin.webContents.send).toHaveBeenCalledWith('update_available', {
          version: '13.0.2',
          releaseDate: expect.any(String),
          releaseNotes: 'Simulated update',
        });
      }
    }
  });
});
