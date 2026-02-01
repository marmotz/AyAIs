import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Critical User Flows', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should complete full workflow: select service, navigate to settings, return to service', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForTimeout(500);

    const url = firstWindow.url();
    expect(url).toContain('/settings');

    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const finalUrl = firstWindow.url();
    expect(finalUrl).toContain('/app');
    expect(finalUrl).not.toContain('/settings');
  });

  test('should cycle through all AI services', async () => {
    const services = [
      firstWindow.locator('app-sidebar button img[alt="ChatGPT"]'),
      firstWindow.locator('app-sidebar button img[alt="Claude"]'),
      firstWindow.locator('app-sidebar button img[alt="Gemini"]'),
    ];

    for (const serviceButton of services) {
      await serviceButton.click();
      await firstWindow.waitForTimeout(500);
    }
  });

  test('should handle rapid service switching', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    const claudeButton = firstWindow.locator('app-sidebar button img[alt="Claude"]');
    const geminiButton = firstWindow.locator('app-sidebar button img[alt="Gemini"]');

    await chatgptButton.click();
    await claudeButton.click();
    await geminiButton.click();
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);
  });

  test('should handle service selection after settings visit', async () => {
    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForTimeout(500);

    const claudeButton = firstWindow.locator('app-sidebar button img[alt="Claude"]');
    await claudeButton.click();
    await firstWindow.waitForTimeout(500);

    const url = firstWindow.url();
    expect(url).toContain('/app');
    expect(url).not.toContain('/settings');
  });

  test.afterAll(async () => {
    await app.close();
  });
});
