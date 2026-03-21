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
    const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    await chatgptButton.click();
    await firstWindow.waitForURL(/\/app$/);

    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForURL(/\/app\/settings$/);

    await chatgptButton.click();
    await firstWindow.waitForURL(/\/app$/);
  });

  test('should cycle through all AI services', async () => {
    const services = [
      firstWindow.getByTestId('sidebar-button-default-chatgpt'),
      firstWindow.getByTestId('sidebar-button-default-claude'),
      firstWindow.getByTestId('sidebar-button-default-gemini'),
    ];

    for (const serviceButton of services) {
      await serviceButton.click();
    }

    // Verify all webviews were created
    const webviews = firstWindow.locator('webview');
    await expect(webviews).toHaveCount(3);
  });

  test('should handle rapid service switching', async () => {
    const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    const claudeButton = firstWindow.getByTestId('sidebar-button-default-claude');
    const geminiButton = firstWindow.getByTestId('sidebar-button-default-gemini');

    await chatgptButton.click();
    await claudeButton.click();
    await geminiButton.click();
    await chatgptButton.click();
    await firstWindow.waitForTimeout(300);

    // Verify all webviews exist after rapid switching
    const webviews = firstWindow.locator('webview');
    await expect(webviews).toHaveCount(3);
  });

  test('should handle service selection after settings visit', async () => {
    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForTimeout(300);

    const claudeButton = firstWindow.getByTestId('sidebar-button-default-claude');
    await claudeButton.click();
    await firstWindow.waitForTimeout(300);

    const url = firstWindow.url();
    expect(url).toContain('/app');
    expect(url).not.toContain('/settings');
  });

  test.afterAll(async () => {
    await app.close();
  });
});
