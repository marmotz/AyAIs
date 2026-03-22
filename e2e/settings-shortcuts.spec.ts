import { expect, test } from '@playwright/test';
import * as FS from 'fs';
import * as OS from 'os';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Settings Shortcuts', () => {
  let app: ElectronApplication;
  let firstWindow: Page;
  let userDataDir: string;

  async function clickOnShortcutsTab() {
    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForURL(/\/app\/settings$/);

    const shortcutsTab = firstWindow.locator('p-tab[value="shortcuts"]');
    try {
      await shortcutsTab.click({ timeout: 3000 });
    } catch {
      // Tab might already be selected, continue
    }
  }

  test.beforeAll(async () => {
    userDataDir = FS.mkdtempSync(PATH.join(OS.tmpdir(), 'ayais-test-shortcuts-'));
    app = await electron.launch({
      args: [
        PATH.join(__dirname, '../dist/app/main.js'),
        PATH.join(__dirname, '../app/package.json'),
        '--test',
        `--user-data-dir=${userDataDir}`,
      ],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');

    // Wait for sidebar button to be visible to ensure app is fully loaded
    const chatgpt = firstWindow.getByTestId('sidebar-button-default-chatgpt');
    await expect(chatgpt).toBeVisible({ timeout: 30000 });
  });

  test.beforeEach(async () => {
    // Reset to the main app page before each test
    const currentUrl = firstWindow.url();
    if (currentUrl.includes('/settings')) {
      const chatgptButton = firstWindow.getByTestId('sidebar-button-default-chatgpt');
      try {
        await chatgptButton.click({ timeout: 2000 });
        await firstWindow.waitForTimeout(500);
      } catch {
        // If chatgpt button not found or not clickable, continue
      }
    }
  });

  test('should navigate to settings shortcuts page', async () => {
    const settingsButton = firstWindow.getByTestId('sidebar-button-settings');
    await settingsButton.click();
    await firstWindow.waitForURL(/\/app\/settings$/);
  });

  test('should display shortcuts configuration tabs', async () => {
    await clickOnShortcutsTab();

    // Verify the shortcuts component is present and visible
    const shortcutsComponent = firstWindow.locator('app-settings-shortcuts');
    await expect(shortcutsComponent).toBeVisible({ timeout: 5000 });

    // Verify the global shortcuts section exists
    const textContent = await shortcutsComponent.textContent();
    expect(textContent).toContain('Show/Hide App');

    // Verify internal shortcuts exist in the component
    expect(textContent).toContain('Open Settings');
    expect(textContent).toContain('Quit App');
    expect(textContent).toContain('Refresh AI Service');

    // Verify service shortcuts exist (using labels not shortcut values)
    expect(textContent).toContain('Go to Service 1');
    expect(textContent).toContain('Go to Service 2');
    expect(textContent).toContain('Go to Service 3');
  });

  test('should allow starting shortcut editing', async () => {
    await clickOnShortcutsTab();

    // Click on the input field for Show/Hide App
    const showHideInput = firstWindow.locator('app-shortcut-input').first().locator('input[type="text"]');
    await showHideInput.click();

    // Verify that editing mode is active by checking for the help text
    const helpText = firstWindow.locator('text=Press Enter to save');
    await expect(helpText).toBeVisible({ timeout: 5000 });
  });

  test('should cancel editing when clicking outside', async () => {
    await clickOnShortcutsTab();

    // Click on the input field for Show/Hide App
    const showHideInput = firstWindow.locator('app-shortcut-input').first().locator('input[type="text"]');
    await showHideInput.click();

    const sidebar = firstWindow.locator('app-sidebar');
    await sidebar.click();

    // Verify that editing mode is cancelled by checking the help text is gone
    const helpText = firstWindow.locator('text=Press Enter to save');
    await expect(helpText).not.toBeVisible({ timeout: 5000 });
  });

  test.afterAll(async () => {
    await app.close();
    if (userDataDir && FS.existsSync(userDataDir)) {
      FS.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
