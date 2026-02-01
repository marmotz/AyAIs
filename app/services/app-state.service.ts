import { BrowserWindow } from 'electron';

export class AppState {
  private static instance: AppState;
  private _window: BrowserWindow | null = null;
  private _isQuitting = false;

  private constructor() {}

  public get window(): BrowserWindow | null {
    return this._window;
  }

  public set window(value: BrowserWindow | null) {
    this._window = value;
  }

  public get isQuitting(): boolean {
    return this._isQuitting;
  }

  public set isQuitting(value: boolean) {
    this._isQuitting = value;
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  public reset(): void {
    this._window = null;
    this._isQuitting = false;
  }
}
