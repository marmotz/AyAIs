import { expect, test } from '@playwright/test';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Shortcut Edge Cases', () => {
  let app: ElectronApplication;
  let firstWindow: Page;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [PATH.join(__dirname, '../dist/app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    firstWindow = await app.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
  });

  test('should handle rapid shortcut presses', async () => {
    await firstWindow.keyboard.press('Control+1');
    await firstWindow.keyboard.press('Control+2');
    await firstWindow.keyboard.press('Control+3');
    await firstWindow.waitForTimeout(500);
  });

  test('should handle shortcuts when no service is selected', async () => {
    const url = firstWindow.url();
    expect(url).toContain('/app');

    await firstWindow.keyboard.press('Control+Shift+Tab');
    await firstWindow.waitForTimeout(500);

    await firstWindow.keyboard.press('Control+Tab');
    await firstWindow.waitForTimeout(500);
  });

  test('should handle invalid service number shortcuts gracefully', async () => {
    for (let i = 4; i <= 9; i++) {
      await firstWindow.keyboard.press(`Control+${i}`);
      await firstWindow.waitForTimeout(200);
    }
  });

  test.afterAll(async () => {
    await app.close();
  });
});
