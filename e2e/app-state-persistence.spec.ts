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
    const chatgpt = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    const claude = firstWindow.getByTestId('sidebar-button-default-claude');
    const gemini = firstWindow.getByTestId('sidebar-button-default-gemini');

    await expect(chatgpt).toBeVisible({ timeout: 5000 });
    await expect(claude).toBeVisible({ timeout: 5000 });
    await expect(gemini).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to settings page', async () => {
    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForURL(/\/app\/settings$/, { timeout: 5000 });

    const url = firstWindow.url();
    expect(url).toContain('/app/settings');
  });

  test('should navigate back to home from settings', async () => {
    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForTimeout(500);

    const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(500);

    const url = firstWindow.url();
    expect(url).toContain('/app');
    expect(url).not.toContain('/settings');
  });

  test('should switch between services and settings', async () => {
    const geminiButton = firstWindow.getByTestId('sidebar-button-default-gemini');
    await geminiButton.click();

    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForURL(/\/app\/settings$/, { timeout: 5000 });

    const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    await chatgptButton.click();
    await firstWindow.waitForURL(/\/app$/, { timeout: 5000 });

    const finalUrl = firstWindow.url();
    expect(finalUrl).toContain('/app');
    expect(finalUrl).not.toContain('/settings');
  });

  test.afterAll(async () => {
    await app.close();
  });
});
