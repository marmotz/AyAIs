import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('AI Services Navigation', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should display all AI services in sidebar', async () => {
    const chatgpt = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    const claude = firstWindow.locator('app-sidebar button img[alt="Claude"]');
    const gemini = firstWindow.locator('app-sidebar button img[alt="Gemini"]');

    await expect(chatgpt).toBeVisible({ timeout: 5000 });
    await expect(claude).toBeVisible({ timeout: 5000 });
    await expect(gemini).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to ChatGPT service', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();

    const webview = firstWindow.locator('webview#webview-chatgpt');
    await expect(webview).toHaveCount(1, { timeout: 5000 });
  });

  test('should navigate to Claude service', async () => {
    const claudeButton = firstWindow.locator('app-sidebar button img[alt="Claude"]');
    await claudeButton.click();

    const webview = firstWindow.locator('webview#webview-claude');
    await expect(webview).toHaveCount(1, { timeout: 5000 });
  });

  test('should navigate to Gemini service', async () => {
    const geminiButton = firstWindow.locator('app-sidebar button img[alt="Gemini"]');
    await geminiButton.click();

    const webview = firstWindow.locator('webview#webview-gemini');
    await expect(webview).toHaveCount(1, { timeout: 5000 });
  });

  test('should switch between services', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    const claudeButton = firstWindow.locator('app-sidebar button img[alt="Claude"]');

    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    await claudeButton.click();
    await firstWindow.waitForTimeout(500);

    const webviews = firstWindow.locator('webview');
    await expect(webviews).toHaveCount(3, { timeout: 5000 });

    const chatgptWebview = firstWindow.locator('webview#webview-chatgpt');
    await expect(chatgptWebview).toHaveCSS('visibility', 'hidden');
    const claudeWebview = firstWindow.locator('webview#webview-claude');
    await expect(claudeWebview).toHaveCSS('visibility', 'visible');
  });

  test.afterAll(async () => {
    await app.close();
  });
});
