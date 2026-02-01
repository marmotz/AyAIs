import { BrowserWindow } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from './app-state.service';

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
}));

describe('AppState', () => {
  let appState: AppState;

  beforeEach(() => {
    appState = AppState.getInstance();
    appState.reset();
  });

  it('should return singleton instance', () => {
    const instance1 = AppState.getInstance();
    const instance2 = AppState.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should have null window initially', () => {
    expect(appState.window).toBeNull();
  });

  it('should set and get window', () => {
    const mockWindow = {} as BrowserWindow;

    appState.window = mockWindow;

    expect(appState.window).toBe(mockWindow);
  });

  it('should have isQuitting false initially', () => {
    expect(appState.isQuitting).toBe(false);
  });

  it('should set isQuitting', () => {
    appState.isQuitting = true;

    expect(appState.isQuitting).toBe(true);
  });

  it('should reset state', () => {
    appState.window = {} as BrowserWindow;
    appState.isQuitting = true;
    appState.reset();

    expect(appState.window).toBeNull();
    expect(appState.isQuitting).toBe(false);
  });
});
