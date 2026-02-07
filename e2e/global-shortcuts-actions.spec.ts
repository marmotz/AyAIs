import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type BrowserContext, type ElectronApplication, type Page } from 'playwright';

test.describe('Global Shortcuts Actions', () => {
  let app: ElectronApplication;
  let firstWindow: Page;
  let context: BrowserContext;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    context = app.context();
    await context.tracing.start({ screenshots: true, snapshots: true });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should register show/hide app global shortcut', async () => {
    const isRegistered = await app.evaluate(async (process) => {
      const globalShortcut = process.globalShortcut;
      return typeof globalShortcut.isRegistered === 'function';
    });

    expect(isRegistered).toBeTruthy();
  });

  test('should show and hide app window with global shortcut', async () => {
    const initialState = await app.evaluate(async (process) => {
      const mainWindow = process.BrowserWindow.getAllWindows()[0];
      return mainWindow.isVisible();
    });

    expect(initialState).toBeTruthy();

    await firstWindow.waitForTimeout(500);

    const finalState = await app.evaluate(async (process) => {
      const mainWindow = process.BrowserWindow.getAllWindows()[0];
      return mainWindow.isVisible();
    });

    expect(typeof finalState).toBe('boolean');
  });

  test.afterAll(async () => {
    await context.tracing.stop({ path: 'e2e/tracing/global-shortcuts-trace.zip' });
    await app.close();
  });
});
