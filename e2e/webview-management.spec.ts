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

  test('should hide webview when navigating to settings', async () => {
    const chatgptButton = firstWindow.getByTestId('sidebar-button-chatgpt');
    await chatgptButton.click();

    const webview = firstWindow.getByTestId('webview-chatgpt');
    await expect(webview).toHaveCount(1, { timeout: 3000 });

    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForTimeout(300);

    // Check webview is hidden (not waiting for content load)
    const webviewStyle = await webview.getAttribute('style');
    expect(webviewStyle).toContain('visibility: hidden');
    expect(webviewStyle).toContain('height: 0');
    expect(webviewStyle).toContain('width: 0');
  });

  test('should show webview when returning from settings', async () => {
    const chatgptButton = firstWindow.getByTestId('sidebar-button-chatgpt');
    await chatgptButton.click();

    const webview = firstWindow.getByTestId('webview-chatgpt');
    await expect(webview).toHaveCount(1, { timeout: 3000 });

    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForURL(/settings$/);

    await chatgptButton.click();
    await firstWindow.waitForURL(/app$/);

    const webviewStyle = await webview.getAttribute('style');
    expect(webviewStyle).toContain('visibility: visible');
    expect(webviewStyle).toContain('height: 100%');
    expect(webviewStyle).toContain('width: 100%');
  });

  test('should maintain separate webviews for different services', async () => {
    const chatgptButton = firstWindow.getByTestId('sidebar-button-chatgpt');
    const claudeButton = firstWindow.getByTestId('sidebar-button-claude');

    await chatgptButton.click();
    await claudeButton.click();
    await chatgptButton.click();

    const webviewClaude = firstWindow.getByTestId('webview-claude');
    await expect(webviewClaude).toHaveCount(1, { timeout: 3000 });
  });

  test.afterAll(async () => {
    await app.close();
  });
});
