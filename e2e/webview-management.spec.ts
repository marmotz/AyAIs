import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Webview Management', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should create webview when service is selected', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const webview = firstWindow.locator('webview');
    await expect(webview).toHaveCount(1, { timeout: 5000 });
  });

  test('should hide webview when navigating to settings', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const webview = firstWindow.locator('webview');
    await expect(webview).toHaveCount(1, { timeout: 5000 });

    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForTimeout(500);

    const webviewStyle = await webview.getAttribute('style');
    expect(webviewStyle).toContain('visibility: hidden');
    expect(webviewStyle).toContain('height: 0');
    expect(webviewStyle).toContain('width: 0');
  });

  test('should show webview when returning from settings', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const webview = firstWindow.locator('webview');
    await expect(webview).toHaveCount(1, { timeout: 5000 });

    const settingsButton = firstWindow.locator('app-sidebar button img[alt="Settings"]');
    await settingsButton.click();
    await firstWindow.waitForTimeout(500);

    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const webviewStyle = await webview.getAttribute('style');
    expect(webviewStyle).toContain('visibility: visible');
    expect(webviewStyle).toContain('height: 100%');
    expect(webviewStyle).toContain('width: 100%');
  });

  test('should maintain separate webviews for different services', async () => {
    const chatgptButton = firstWindow.locator('app-sidebar button img[alt="ChatGPT"]');
    const claudeButton = firstWindow.locator('app-sidebar button img[alt="Claude"]');

    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    await claudeButton.click();
    await firstWindow.waitForTimeout(500);

    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const webviews = firstWindow.locator('webview');
    const count = await webviews.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test.afterAll(async () => {
    await app.close();
  });
});
