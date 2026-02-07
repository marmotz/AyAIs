import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Application State', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should load app and be ready for service selection', async () => {
    const chatgpt = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    const claude = firstWindow.locator('app-sidebar button img[alt="Claude"]');
    const gemini = firstWindow.locator('app-sidebar button img[alt="Gemini"]');

    await expect(chatgpt).toBeVisible({ timeout: 5000 });
    await expect(claude).toBeVisible({ timeout: 5000 });
    await expect(gemini).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to settings page', async () => {
    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForURL(/settings$/, { timeout: 5000 });

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

  test('should switch between services and settings', async () => {
    const geminiButton = firstWindow.locator('app-sidebar button img[alt="Gemini"]');
    await geminiButton.click();

    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForURL(/settings$/, { timeout: 5000 });

    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();
    await firstWindow.waitForURL(/app$/, { timeout: 5000 });

    const finalUrl = firstWindow.url();
    expect(finalUrl).toContain('/app');
    expect(finalUrl).not.toContain('/settings');
  });

  test.afterAll(async () => {
    await app.close();
  });
});
