import { expect, test } from '@playwright/test';
import * as FS from 'fs';
import * as OS from 'os';
import * as PATH from 'path';
import { BrowserContext, _electron as electron, ElectronApplication, Page } from 'playwright';

test.describe('Application Launch', () => {
  let app: ElectronApplication;
  let firstWindow: Page;
  let context: BrowserContext;
  let userDataDir: string;

  test.beforeAll(async () => {
    userDataDir = FS.mkdtempSync(PATH.join(OS.tmpdir(), 'ayais-test-app-launch-'));
    app = await electron.launch({
      args: [
        PATH.join(__dirname, '../dist/app/main.js'),
        PATH.join(__dirname, '../app/package.json'),
        '--test',
        `--user-data-dir=${userDataDir}`,
      ],
    });
    context = app.context();
    await context.tracing.start({ screenshots: true, snapshots: true });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');

    // Wait for sidebar button to be visible to ensure app is fully loaded
    const chatgpt = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    await expect(chatgpt).toBeVisible({ timeout: 30000 });
  });

  test('Launch electron app', async () => {
    const windowState: { isVisible: boolean; isDevToolsOpened: boolean; isCrashed: boolean } = await app.evaluate(
      async (process) => {
        const mainWindow = process.BrowserWindow.getAllWindows()[0];

        const getState = () => ({
          isVisible: mainWindow.isVisible(),
          isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
          isCrashed: mainWindow.webContents.isCrashed(),
        });

        return new Promise((resolve) => {
          if (mainWindow.isVisible()) {
            resolve(getState());
          } else {
            mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
          }
        });
      }
    );

    expect(windowState.isVisible).toBeTruthy();
    expect(windowState.isCrashed).toBeFalsy();
  });

  test.afterAll(async () => {
    await context.tracing.stop({ path: 'e2e/tracing/trace.zip' });
    await app.close();
    if (userDataDir && FS.existsSync(userDataDir)) {
      FS.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
