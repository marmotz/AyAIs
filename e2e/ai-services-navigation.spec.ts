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
    const chatgpt = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    const claude = firstWindow.getByTestId('sidebar-button-default-claude');
    const gemini = firstWindow.getByTestId('sidebar-button-default-gemini');

    await expect(chatgpt).toBeVisible({ timeout: 5000 });
    await expect(claude).toBeVisible({ timeout: 5000 });
    await expect(gemini).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to ChatGPT service', async () => {
    const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    await chatgptButton.click();
    await firstWindow.waitForTimeout(300);

    // Verify webview element exists and has correct src attribute
    const webview = firstWindow.getByTestId('webview-chatgpt');
    const count = await webview.count();
    expect(count).toBe(1);

    // Check that the webview has the src attribute set (without waiting for load)
    const hasSrc = await webview.getAttribute('src');
    // ChatGPT may redirect to chatgpt.com or chat.openai.com
    const isValidChatGPT = hasSrc?.includes('chat.openai.com') || hasSrc?.includes('chatgpt.com');
    expect(isValidChatGPT).toBe(true);
  });

  test('should navigate to Claude service', async () => {
    const claudeButton = firstWindow.getByTestId('sidebar-button-default-claude');
    await claudeButton.click();
    await firstWindow.waitForTimeout(300);

    const webview = firstWindow.getByTestId('webview-claude');
    const count = await webview.count();
    expect(count).toBe(1);

    // Check that the webview has the src attribute set
    const hasSrc = await webview.getAttribute('src');
    expect(hasSrc).toContain('claude.ai');
  });

  test('should navigate to Gemini service', async () => {
    const geminiButton = firstWindow.getByTestId('sidebar-button-default-gemini');
    await geminiButton.click();
    await firstWindow.waitForTimeout(300);

    const webview = firstWindow.getByTestId('webview-gemini');
    const count = await webview.count();
    expect(count).toBe(1);

    // Check that the webview has the src attribute set
    const hasSrc = await webview.getAttribute('src');
    expect(hasSrc).toContain('gemini.google.com');
  });

  test('should switch between services', async () => {
    const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    const claudeButton = firstWindow.getByTestId('sidebar-button-default-claude');

    await chatgptButton.click();
    await firstWindow.waitForTimeout(300);

    await claudeButton.click();
    await firstWindow.waitForTimeout(300);

    // Verify both webviews exist and are properly configured
    const chatgptWebview = firstWindow.getByTestId('webview-chatgpt');
    const claudeWebview = firstWindow.getByTestId('webview-claude');

    expect(await chatgptWebview.count()).toBe(1);
    expect(await claudeWebview.count()).toBe(1);

    // Verify the Claude webview is visible and ChatGPT is hidden
    const claudeStyles = await claudeWebview.evaluate((el: any) => ({
      visibility: el.style.visibility,
      height: el.style.height,
      width: el.style.width,
    }));

    const chatgptStyles = await chatgptWebview.evaluate((el: any) => ({
      visibility: el.style.visibility,
      height: el.style.height,
      width: el.style.width,
    }));

    expect(claudeStyles.visibility).toBe('visible');
    expect(claudeStyles.height).toBe('100%');
    expect(claudeStyles.width).toBe('100%');
    expect(chatgptStyles.visibility).toBe('hidden');
  });

  test.afterAll(async () => {
    await app.close();
  });
});
