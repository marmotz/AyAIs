import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Global Shortcuts', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should show quit button with shortcut hint', async () => {
    const quitButton = firstWindow.locator('app-sidebar button img[alt="Quit"]');
    await expect(quitButton).toBeVisible({ timeout: 5000 });
  });

  test('should show settings button with shortcut hint', async () => {
    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await expect(settingsButton).toBeVisible({ timeout: 5000 });
  });

  test('should show service shortcuts hints in sidebar', async () => {
    const chatgpt = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    const claude = firstWindow.locator('app-sidebar button img[alt="Claude"]');
    const gemini = firstWindow.locator('app-sidebar button img[alt="Gemini"]');

    await expect(chatgpt).toBeVisible({ timeout: 5000 });
    await expect(claude).toBeVisible({ timeout: 5000 });
    await expect(gemini).toBeVisible({ timeout: 5000 });
  });

  test.afterAll(async () => {
    await app.close();
  });
});
