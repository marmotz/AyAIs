import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('WhatsNew Page', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
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

  test.afterAll(async () => {
    await app.close();
  });
});
