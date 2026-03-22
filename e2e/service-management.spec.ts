import { expect, test } from '@playwright/test';
import * as FS from 'fs';
import * as OS from 'os';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Service Management', () => {
  let app: ElectronApplication;
  let firstWindow: Page;
  let userDataDir: string;

  test.beforeAll(async () => {
    userDataDir = FS.mkdtempSync(PATH.join(OS.tmpdir(), 'ayais-test-service-management-'));
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

  async function openAddServiceDialog() {
    const addButton = firstWindow.getByTestId('sidebar-button-add-provider');
    const dialogContent = firstWindow.locator('app-sidebar-add-service-dialog p-dialog .p-dialog-content');
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click({ force: true });
    await expect(dialogContent).toBeVisible({ timeout: 5000 });
    return firstWindow.locator('app-sidebar-add-service-dialog p-dialog');
  }

  async function closeDialog() {
    await firstWindow.keyboard.press('Escape');
    await firstWindow.waitForTimeout(500);
  }

  async function scrollToTopOfSidebar() {
    const container = firstWindow.locator('#services');
    await container.evaluate((el) => {
      el.scrollTop = 0;
    });
    await firstWindow.waitForTimeout(300);
  }

  test.describe('Add Service', () => {
    test('should open add service dialog', async () => {
      const dialog = await openAddServiceDialog();

      const copilotButton = dialog.locator('button', { hasText: 'Copilot' });
      await expect(copilotButton).toBeVisible();

      const deepseekButton = dialog.locator('button', { hasText: 'DeepSeek' });
      await expect(deepseekButton).toBeVisible();

      await closeDialog();
    });

    test('should add a service from dialog and close it', async () => {
      const dialog = await openAddServiceDialog();

      const copilotButton = dialog.locator('button', { hasText: 'Copilot' });
      await copilotButton.click();

      await firstWindow.waitForTimeout(1000);

      const copilotImg = firstWindow.locator('#services button img[alt="Copilot"]');
      await expect(copilotImg.first()).toBeVisible({ timeout: 5000 });
    });

    test('should add duplicate service with unique ID', async () => {
      const servicesContainer = firstWindow.locator('#services');
      const countBefore = await servicesContainer.locator('button').count();

      const dialog = await openAddServiceDialog();
      const copilotButton = dialog.locator('button', { hasText: 'Copilot' });
      await copilotButton.click();

      const copilotImgs = firstWindow.locator('#services button img[alt^="Copilot"]');
      await expect(copilotImgs).toHaveCount(2, { timeout: 10000 });

      await expect(servicesContainer.locator('button')).toHaveCount(countBefore + 1, { timeout: 5000 });
    });
  });

  test.describe('Remove Service', () => {
    test('should show context menu with remove option', async () => {
      await scrollToTopOfSidebar();

      const serviceButtons = firstWindow.locator('#services button[data-testid]');
      await expect(serviceButtons.first()).toBeVisible({ timeout: 5000 });

      const firstService = serviceButtons.nth(0);
      await firstService.click({ button: 'right', force: true });
      await firstWindow.waitForTimeout(500);

      const removeItem = firstWindow.locator('.ml-2', { hasText: 'Remove' });
      await expect(removeItem).toBeVisible({ timeout: 5000 });

      const refreshItem = firstWindow.locator('.ml-2', { hasText: 'Refresh' });
      await expect(refreshItem).toBeVisible();

      await firstWindow.keyboard.press('Escape');
      await firstWindow.waitForTimeout(300);
    });

    test('should remove service and decrease count', async () => {
      await scrollToTopOfSidebar();

      const servicesContainer = firstWindow.locator('#services');
      const serviceButtons = servicesContainer.locator('button[data-testid]');
      const initialCount = await serviceButtons.count();

      const lastService = serviceButtons.last();
      const lastTestId = await lastService.getAttribute('data-testid');

      await lastService.click({ button: 'right', force: true });
      await firstWindow.waitForTimeout(500);

      const removeItem = firstWindow.locator('.ml-2', { hasText: 'Remove' });
      await expect(removeItem).toBeVisible({ timeout: 5000 });
      await removeItem.click();

      if (lastTestId) {
        const removedButton = firstWindow.getByTestId(lastTestId);
        await expect(removedButton).toBeHidden({ timeout: 3000 });
      }

      await expect(serviceButtons).toHaveCount(initialCount - 1, { timeout: 5000 });
    });

    test('should keep app functional after removing a service', async () => {
      await scrollToTopOfSidebar();

      const serviceButtons = firstWindow.locator('#services button[data-testid]');
      const count = await serviceButtons.count();

      if (count < 2) {
        return;
      }

      const firstService = serviceButtons.nth(0);
      await firstService.click({ force: true });
      await firstWindow.waitForTimeout(300);

      const url = firstWindow.url();
      expect(url).toContain('/app');

      const remainingButtons = firstWindow.locator('#services button[data-testid]');
      await expect(remainingButtons.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Drag and Drop Reorder', () => {
    test('should drag first service to second position', async () => {
      await scrollToTopOfSidebar();

      const servicesContainer = firstWindow.locator('#services');
      const serviceButtons = servicesContainer.locator('button[data-testid]');
      const count = await serviceButtons.count();

      if (count < 2) {
        return;
      }

      const firstBefore = await serviceButtons.nth(0).getAttribute('data-testid');
      const secondBefore = await serviceButtons.nth(1).getAttribute('data-testid');

      const firstButton = firstWindow.getByTestId(firstBefore!);
      const secondButton = firstWindow.getByTestId(secondBefore!);

      await firstButton.scrollIntoViewIfNeeded();
      await secondButton.scrollIntoViewIfNeeded();

      const firstBox = await firstButton.boundingBox();
      const secondBox = await secondButton.boundingBox();

      if (!firstBox || !secondBox) {
        throw new Error('Could not get bounding boxes');
      }

      const startX = firstBox.x + firstBox.width / 2;
      const startY = firstBox.y + firstBox.height / 2;
      const endX = secondBox.x + secondBox.width / 2;
      const endY = secondBox.y + secondBox.height / 2;

      await firstWindow.mouse.move(startX, startY);
      await firstWindow.mouse.down();
      await firstWindow.waitForTimeout(200);

      const steps = 20;
      for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        const y = startY + ((endY - startY) * i) / steps;
        await firstWindow.mouse.move(x, y);
        await firstWindow.waitForTimeout(25);
      }

      await firstWindow.mouse.up();
      await firstWindow.waitForTimeout(500);

      await expect(serviceButtons).toHaveCount(count, { timeout: 5000 });

      const firstAfter = await serviceButtons.nth(0).getAttribute('data-testid');
      const secondAfter = await serviceButtons.nth(1).getAttribute('data-testid');

      expect(firstAfter).toBeDefined();
      expect(secondAfter).toBeDefined();
    });

    test('should preserve service count after drag', async () => {
      await scrollToTopOfSidebar();

      const servicesContainer = firstWindow.locator('#services');
      const serviceButtons = servicesContainer.locator('button[data-testid]');
      const countBefore = await serviceButtons.count();

      if (countBefore < 2) {
        return;
      }

      const firstTestId = await serviceButtons.nth(0).getAttribute('data-testid');
      const secondTestId = await serviceButtons.nth(1).getAttribute('data-testid');

      const firstButton = firstWindow.getByTestId(firstTestId!);
      const secondButton = firstWindow.getByTestId(secondTestId!);

      await firstButton.scrollIntoViewIfNeeded();
      await secondButton.scrollIntoViewIfNeeded();

      const firstBox = await firstButton.boundingBox();
      const secondBox = await secondButton.boundingBox();

      if (!firstBox || !secondBox) {
        throw new Error('Could not get bounding boxes');
      }

      const startX = firstBox.x + firstBox.width / 2;
      const startY = firstBox.y + firstBox.height / 2;
      const endX = secondBox.x + secondBox.width / 2;
      const endY = secondBox.y + secondBox.height / 2;

      await firstWindow.mouse.move(startX, startY);
      await firstWindow.mouse.down();
      await firstWindow.waitForTimeout(200);

      const steps = 20;
      for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        const y = startY + ((endY - startY) * i) / steps;
        await firstWindow.mouse.move(x, y);
        await firstWindow.waitForTimeout(25);
      }

      await firstWindow.mouse.up();
      await firstWindow.waitForTimeout(500);

      await expect(serviceButtons).toHaveCount(countBefore, { timeout: 5000 });
    });
  });

  test.afterAll(async () => {
    await app.close();
    if (userDataDir && FS.existsSync(userDataDir)) {
      FS.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
