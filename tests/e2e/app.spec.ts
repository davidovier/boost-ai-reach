import { test, expect } from '@playwright/test';

// Basic happy-path journey. Extend with real auth and data when available.
test('signup → dashboard → scans → ai-tests → billing (skeleton)', async ({ page }) => {
  await page.goto('/');

  // Landing page title and CTA
  await expect(page.getByRole('heading', { name: /findableai/i })).toBeVisible();
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page).toHaveURL(/.*\/dashboard/);

  // Navigate to Scans
  await page.getByRole('link', { name: /scans/i }).click();
  await expect(page).toHaveURL(/.*\/scans/);

  // Navigate to AI Tests
  await page.getByRole('link', { name: /ai tests/i }).click();
  await expect(page).toHaveURL(/.*\/ai-tests/);

  // Navigate to Account (as placeholder for Billing)
  await page.getByRole('link', { name: /account/i }).click();
  await expect(page).toHaveURL(/.*\/account/);
});
