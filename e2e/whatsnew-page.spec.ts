import { expect, test } from '@playwright/test';
import * as FS from 'fs';
import * as OS from 'os';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('WhatsNew Page', () => {
  let app: ElectronApplication;
  let firstWindow: Page;
  let userDataDir: string;

  test.beforeAll(async () => {
    userDataDir = FS.mkdtempSync(PATH.join(OS.tmpdir(), 'ayais-test-whatsnew-'));
    app = await electron.launch({
      args: [
        PATH.join(__dirname, '../dist/app/main.js'),
        PATH.join(__dirname, '../app/package.json'),
        `--user-data-dir=${userDataDir}`,
      ],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');

    // Wait for sidebar button to be visible to ensure app is fully loaded
    const chatgpt = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    await expect(chatgpt).toBeVisible({ timeout: 30000 });
  });

  test.afterEach(async () => {
    // Close dialog after each test to avoid accumulation
    const overlay = firstWindow.locator('.p-dialog-mask').first();
    try {
      await overlay.click({ position: { x: 10, y: 10 }, timeout: 1000 });
      await firstWindow.waitForTimeout(300);
    } catch {
      // Dialog might not be open, continue
    }
  });

  test('should display version information', async () => {
    const whatsnewButton = firstWindow.getByTestId('sidebar-button-whatsnew');
    await whatsnewButton.click();
    await firstWindow.waitForTimeout(500);

    // Look for version components
    const versionComponents = firstWindow.locator('app-version');
    const count = await versionComponents.count();

    // Should have at least one version displayed
    expect(count).toBeGreaterThan(0);
  });

  test('should display new features section', async () => {
    const whatsnewButton = firstWindow.getByTestId('sidebar-button-whatsnew');
    await whatsnewButton.click();
    await firstWindow.waitForTimeout(500);

    const newFeaturesComponents = firstWindow.locator('app-new-features');
    const count = await newFeaturesComponents.count();

    // Should have at least one new features section
    expect(count).toBeGreaterThan(0);
  });

  test('should display fixes section', async () => {
    const whatsnewButton = firstWindow.getByTestId('sidebar-button-whatsnew');
    await whatsnewButton.click();
    await firstWindow.waitForTimeout(500);

    const fixesComponents = firstWindow.locator('app-fixes');
    const count = await fixesComponents.count();

    // Should have at least one fixes section
    expect(count).toBeGreaterThan(0);
  });

  test('should close whats new modal when using keyboard shortcut to select service', async () => {
    const whatsnewButton = firstWindow.getByTestId('sidebar-button-whatsnew');
    await whatsnewButton.click();

    // Verify the modal is visible
    const dialog = firstWindow.locator('.p-dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Press keyboard shortcut to select ChatGPT service (Control+1)
    await firstWindow.keyboard.press('Control+1');

    // Verify the modal is no longer visible
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // Verify the service is selected
    const url = firstWindow.url();
    expect(url).toContain('/app');

    // Verify the chatgpt button is not grayscale and not opacity-50 (meaning it's selected)
    const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    const chatgptImg = chatgptButton.locator('img');
    const hasGrayscale = await chatgptImg.evaluate((el) => el.classList.contains('grayscale'));
    const hasOpacity = await chatgptImg.evaluate((el) => el.classList.contains('opacity-50'));
    expect(hasGrayscale).toBeFalsy();
    expect(hasOpacity).toBeFalsy();
  });

  test('should close whats new modal when using next service shortcut', async () => {
    const whatsnewButton = firstWindow.getByTestId('sidebar-button-whatsnew');
    await whatsnewButton.click();
    await firstWindow.waitForTimeout(500);

    // Verify the modal is visible
    const dialog = firstWindow.locator('.p-dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // First select a service
    await firstWindow.keyboard.press('Control+1');
    await firstWindow.waitForTimeout(500);

    // Open the modal again
    await whatsnewButton.click();
    await firstWindow.waitForTimeout(500);
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Press keyboard shortcut to go to next service (Control+Tab)
    await firstWindow.keyboard.press('Control+Tab');
    await firstWindow.waitForTimeout(500);

    // Verify the modal is no longer visible
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // Verify we're still on the app page
    const url = firstWindow.url();
    expect(url).toContain('/app');
  });

  test('should close whats new modal when using previous service shortcut', async () => {
    const whatsnewButton = firstWindow.getByTestId('sidebar-button-whatsnew');
    await whatsnewButton.click();
    await firstWindow.waitForTimeout(500);

    // Verify the modal is visible
    const dialog = firstWindow.locator('.p-dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // First select a service
    await firstWindow.keyboard.press('Control+2');
    await firstWindow.waitForTimeout(500);

    // Open the modal again
    await whatsnewButton.click();
    await firstWindow.waitForTimeout(500);
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Press keyboard shortcut to go to previous service (Control+Shift+Tab)
    await firstWindow.keyboard.press('Control+Shift+Tab');
    await firstWindow.waitForTimeout(500);

    // Verify the modal is no longer visible
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // Verify we're still on the app page
    const url = firstWindow.url();
    expect(url).toContain('/app');
  });

  test.afterAll(async () => {
    await app.close();
    if (userDataDir && FS.existsSync(userDataDir)) {
      FS.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
