import { afterEach, beforeEach, vi } from 'vitest';

const DEFAULT_ELECTRON_API_MOCK = {
  getPlatform: () => Promise.resolve('linux'),
  logDebug: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  // Set up a default mock for window.electronAPI to prevent errors in tests
  // that don't explicitly create their own mock (only in browser environment)
  if (typeof window !== 'undefined' && !(window as any).electronAPI) {
    (window as any).electronAPI = { ...DEFAULT_ELECTRON_API_MOCK };
  }
});

afterEach(() => {
  // Clear all timers to prevent callbacks from firing in subsequent tests
  vi.clearAllTimers();
  vi.runAllTimers();
  vi.clearAllTimers();

  // Restore a default mock after each test to prevent errors in subsequent tests
  // (only in browser environment)
  if (typeof window !== 'undefined') {
    (window as any).electronAPI = { ...DEFAULT_ELECTRON_API_MOCK };
  }
});
