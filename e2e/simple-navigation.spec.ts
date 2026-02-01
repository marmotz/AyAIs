import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Simple Navigation', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should display sidebar', async () => {
    const sidebar = firstWindow.locator('app-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should display ChatGPT button', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await expect(chatgptButton).toBeVisible();
  });

  test('should click ChatGPT button', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);
  });

  test.afterAll(async () => {
    await app.close();
  });
});
