import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60 * 1000, // Longer timeout for staging
  expect: { timeout: 10000 },
  fullyParallel: false, // Sequential for smoke tests
  retries: 2, // Retry failed tests
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-staging' }],
    ['junit', { outputFile: 'test-results-staging.xml' }]
  ],
  use: {
    baseURL: process.env.STAGING_URL || 'https://staging.findableai.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Staging environment headers
    extraHTTPHeaders: {
      'User-Agent': 'PlaywrightSmokeTest/1.0'
    }
  },
  projects: [
    {
      name: 'smoke-tests',
      testMatch: 'smoke-test.spec.ts',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'health-checks', 
      testMatch: 'smoke-test.spec.ts',
      grep: /Health Check/,
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  // No web server for staging - testing against deployed app
});