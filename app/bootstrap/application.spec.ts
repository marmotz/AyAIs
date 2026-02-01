import { app } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapApplication } from './application';

// Mock all services and dependencies
vi.mock('electron', () => ({
  app: {
    on: vi.fn(),
  },
}));

vi.mock('../services/config-manager.service');
vi.mock('../services/debug-logger.service');
vi.mock('../services/startup-manager.service');
vi.mock('../services/window-manager.service');
vi.mock('../services/shortcut-manager.service');
vi.mock('../services/tray-manager.service');
vi.mock('../services/auto-updater.service');
vi.mock('./app-initializer');
vi.mock('./app-listeners');

describe('Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create all services and register listeners', () => {
    bootstrapApplication(false);

    expect(app.on).toHaveBeenCalledWith('ready', expect.any(Function));
  });
});
