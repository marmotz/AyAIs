import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DevShortcutsService } from './dev-shortcuts.service';

describe('DevShortcutsService', () => {
  let service: DevShortcutsService;

  const mockElectronAPI = {
    isDevMode: vi.fn().mockResolvedValue(false),
    onOpenDevPage: vi.fn(),
    sendDevShortcut: vi.fn(),
    logDebug: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.useFakeTimers();

    global.window = {
      ...global.window,
      electronAPI: mockElectronAPI,
    } as Window & typeof globalThis & { electronAPI: typeof mockElectronAPI };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
    });
    service = TestBed.inject(DevShortcutsService);
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.clearAllTimers();
    vi.useRealTimers();

    vi.clearAllMocks();
    mockElectronAPI.isDevMode.mockReset();
    // Don't delete the mock - the setup file will maintain it
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
