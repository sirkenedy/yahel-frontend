import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // WebKit needs a recent macOS or Linux. It always runs in CI; locally, opt in with E2E_WEBKIT=1.
    ...(process.env.CI || process.env.E2E_WEBKIT ? [{ name: 'mobile-safari', use: { ...devices['iPhone 14'] } }] : []),
  ],
  webServer: [
    {
      command: 'pnpm --filter @yahel/shell preview',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @yahel/website preview',
      url: 'http://localhost:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
