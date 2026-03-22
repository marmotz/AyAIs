import { expect, test } from '@playwright/test';
import * as FS from 'fs';
import * as OS from 'os';
import * as PATH from 'path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

test.describe('Shortcut Edge Cases', () => {
  let app: ElectronApplication;
  let firstWindow: Page;
  let userDataDir: string;

  test.beforeAll(async () => {
    userDataDir = FS.mkdtempSync(PATH.join(OS.tmpdir(), 'ayais-test-shortcut-edge-cases-'));
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
    if (userDataDir && FS.existsSync(userDataDir)) {
      FS.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
