import { test, expect, Page } from '@playwright/test';

// Test data - use unique identifiers for each run
const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_SITE_URL = 'https://example.com';
const TEST_PROMPT = 'Best website optimization tools';

// Helper functions
async function signUp(page: Page, email: string, password: string) {
  await page.goto('/signup');
  
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.fill('[data-testid="confirm-password-input"]', password);
  
  await page.click('[data-testid="signup-button"]');
  
  // Wait for successful signup
  await expect(page).toHaveURL(/.*\/onboarding|.*\/dashboard/);
  
  // If on onboarding, complete it
  if (page.url().includes('/onboarding')) {
    await page.click('[data-testid="complete-onboarding"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  }
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/signin');
  
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  
  await page.click('[data-testid="signin-button"]');
  
  await expect(page).toHaveURL(/.*\/dashboard/);
}

async function addSite(page: Page, siteUrl: string) {
  // Navigate to dashboard and add site
  await page.goto('/dashboard');
  
  // Look for add site button or input
  const addSiteButton = page.locator('[data-testid="add-site-button"]').or(
    page.getByRole('button', { name: /add site|new site/i })
  );
  
  if (await addSiteButton.isVisible()) {
    await addSiteButton.click();
  }
  
  // Fill site URL
  const siteInput = page.locator('[data-testid="site-url-input"]').or(
    page.locator('input[placeholder*="website"]')
  );
  await siteInput.fill(siteUrl);
  
  // Submit
  const submitButton = page.locator('[data-testid="add-site-submit"]').or(
    page.getByRole('button', { name: /add|create|save/i })
  );
  await submitButton.click();
  
  // Wait for site to be added
  await expect(page.locator(`text=${siteUrl}`)).toBeVisible({ timeout: 10000 });
}

async function runScan(page: Page) {
  // Navigate to scans page
  await page.goto('/scans');
  
  // Look for scan button
  const scanButton = page.locator('[data-testid="run-scan-button"]').or(
    page.getByRole('button', { name: /scan|analyze/i })
  );
  
  await scanButton.click();
  
  // Wait for scan to complete
  await expect(
    page.locator('[data-testid="scan-status"]').or(
      page.locator('text=/completed|finished|done/i')
    )
  ).toBeVisible({ timeout: 30000 });
  
  // Verify scan results are visible
  await expect(
    page.locator('[data-testid="scan-results"]').or(
      page.locator('text=/score|results/i')
    )
  ).toBeVisible();
}

async function runPrompt(page: Page, prompt: string) {
  // Navigate to AI tests page
  await page.goto('/ai-tests');
  
  // Fill prompt input
  const promptInput = page.locator('[data-testid="prompt-input"]').or(
    page.locator('textarea, input[placeholder*="prompt"]')
  );
  await promptInput.fill(prompt);
  
  // Submit prompt
  const submitButton = page.locator('[data-testid="run-prompt-button"]').or(
    page.getByRole('button', { name: /run|test|simulate/i })
  );
  await submitButton.click();
  
  // Wait for prompt results
  await expect(
    page.locator('[data-testid="prompt-results"]').or(
      page.locator('text=/results|response/i')
    )
  ).toBeVisible({ timeout: 30000 });
}

async function generateReport(page: Page) {
  // Navigate to reports page
  await page.goto('/reports');
  
  // Look for generate report button
  const generateButton = page.locator('[data-testid="generate-report-button"]').or(
    page.getByRole('button', { name: /generate|create report/i })
  );
  
  await generateButton.click();
  
  // Wait for report generation
  await expect(
    page.locator('[data-testid="report-status"]').or(
      page.locator('text=/generated|completed|ready/i')
    )
  ).toBeVisible({ timeout: 60000 });
  
  // Verify report is available
  await expect(
    page.locator('[data-testid="download-report"]').or(
      page.getByRole('link', { name: /download|view report/i })
    )
  ).toBeVisible();
}

async function upgradePlan(page: Page) {
  // Navigate to pricing or account page
  await page.goto('/pricing');
  
  // Look for upgrade button (Pro plan)
  const upgradeButton = page.locator('[data-testid="upgrade-pro-button"]').or(
    page.getByRole('button', { name: /upgrade|choose pro/i }).first()
  );
  
  await upgradeButton.click();
  
  // Should redirect to Stripe checkout (in test mode)
  // In staging, this should use Stripe test keys
  await expect(page).toHaveURL(/.*checkout\.stripe\.com.*|.*\/checkout/);
  
  // For testing purposes, we'll just verify we reached the checkout
  // In a real scenario, you'd need to handle the Stripe test checkout flow
  console.log('Reached checkout page - Stripe integration working');
}

// Main smoke test
test.describe('Full User Journey Smoke Test', () => {
  test('Complete flow: signup → add site → scan → prompt → report → upgrade', async ({ page }) => {
    const testEmail = generateTestEmail();
    
    console.log(`Starting smoke test with email: ${testEmail}`);
    
    // Step 1: Sign up
    console.log('Step 1: Signing up...');
    await signUp(page, testEmail, TEST_PASSWORD);
    console.log('✅ Signup completed');
    
    // Step 2: Add site
    console.log('Step 2: Adding site...');
    await addSite(page, TEST_SITE_URL);
    console.log('✅ Site added');
    
    // Step 3: Run scan
    console.log('Step 3: Running scan...');
    await runScan(page);
    console.log('✅ Scan completed');
    
    // Step 4: Run prompt simulation
    console.log('Step 4: Running prompt simulation...');
    await runPrompt(page, TEST_PROMPT);
    console.log('✅ Prompt simulation completed');
    
    // Step 5: Generate report
    console.log('Step 5: Generating report...');
    await generateReport(page);
    console.log('✅ Report generated');
    
    // Step 6: Attempt upgrade
    console.log('Step 6: Testing upgrade flow...');
    await upgradePlan(page);
    console.log('✅ Upgrade flow tested');
    
    console.log('🎉 Full smoke test completed successfully!');
  });
  
  // Alternative flow for existing users
  test('Existing user flow: signin → verify features work', async ({ page }) => {
    // This test can be used with pre-existing test accounts
    const testEmail = process.env.TEST_USER_EMAIL || generateTestEmail();
    
    console.log(`Testing existing user flow with: ${testEmail}`);
    
    // Step 1: Sign in
    console.log('Step 1: Signing in...');
    await signIn(page, testEmail, TEST_PASSWORD);
    console.log('✅ Signin completed');
    
    // Step 2: Verify dashboard
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // Step 3: Quick feature verification
    await page.goto('/scans');
    await expect(page.locator('text=/scans|no scans/i')).toBeVisible();
    
    await page.goto('/ai-tests');
    await expect(page.locator('text=/prompt|ai test/i')).toBeVisible();
    
    await page.goto('/reports');
    await expect(page.locator('text=/reports|no reports/i')).toBeVisible();
    
    console.log('✅ Existing user flow verified');
  });
});

// Health check test
test.describe('System Health Check', () => {
  test('API health check', async ({ page }) => {
    // Test the health endpoint
    await page.goto('/api/health');
    
    // Should return JSON with status
    const content = await page.textContent('body');
    const healthData = JSON.parse(content || '{}');
    
    expect(healthData.status).toBe('ok');
    expect(healthData.services).toBeDefined();
    
    console.log('✅ API health check passed');
  });
  
  test('Alert system test', async ({ page }) => {
    // Test alert simulation (admin only)
    await page.goto('/admin/alerts');
    
    // This will fail if not admin, which is expected
    // In staging, you'd need admin credentials
    if (await page.locator('text=/access denied/i').isVisible()) {
      console.log('⚠️ Alert test skipped - requires admin access');
      return;
    }
    
    // Simulate an alert
    await page.selectOption('[data-testid="error-type-select"]', '5xx_spike');
    await page.click('[data-testid="simulate-alert-button"]');
    
    await expect(page.locator('text=/simulated.*alert/i')).toBeVisible();
    
    console.log('✅ Alert system test passed');
  });
});