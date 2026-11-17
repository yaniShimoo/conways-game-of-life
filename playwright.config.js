import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4173',
    channel: 'chrome',
    viewport: { width: 1440, height: 1100 },
    trace: 'retain-on-failure'
  },
  webServer: process.env.TEST_BASE_URL ? undefined : {
    command: 'node tools/serve.js',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
