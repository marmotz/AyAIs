/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: '.',
  timeout: 60000,
  outputDir: './screenshots',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: 50,
    },
    trace: 'retain-on-failure',
  },
  expect: {
    toMatchSnapshot: { threshold: 0.2 },
  },
  fullyParallel: false,
  workers: 1,
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
module.exports = config;
