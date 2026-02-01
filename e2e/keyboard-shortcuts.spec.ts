import { test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Keyboard Shortcuts', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should select first service with Ctrl+1', async () => {
    await firstWindow.keyboard.press('Control+1');
    await firstWindow.waitForTimeout(500);
  });

  test('should select second service with Ctrl+2', async () => {
    await firstWindow.keyboard.press('Control+2');
    await firstWindow.waitForTimeout(500);
  });

  test('should select third service with Ctrl+3', async () => {
    await firstWindow.keyboard.press('Control+3');
    await firstWindow.waitForTimeout(500);
  });

  test.afterAll(async () => {
    await app.close();
  });
});
