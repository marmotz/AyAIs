import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Settings Navigation', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should navigate to settings page', async () => {
    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForTimeout(500);

    const url = firstWindow.url();
    expect(url).toContain('/settings');
  });

  test('should navigate back to home from settings', async () => {
    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForTimeout(500);

    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const url = firstWindow.url();
    expect(url).toContain('/app');
    expect(url).not.toContain('/settings');
  });

  test.afterAll(async () => {
    await app.close();
  });
});
