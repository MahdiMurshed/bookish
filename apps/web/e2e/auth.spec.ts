import { expect, test } from '@playwright/test';

const TEST_EMAIL = 'alice@example.com';
const TEST_PASSWORD = 'password123';

test.describe('Authentication', () => {
  test('signs in and redirects to /browse', async ({ page }) => {
    await page.goto('/signin');

    // Verify sign-in page loaded
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // Fill credentials
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);

    // Submit
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for redirect to /browse
    await page.waitForURL('**/browse', { timeout: 10_000 });

    // Verify we're on the browse page
    await expect(page.getByRole('heading', { name: 'Community Bookshelf' })).toBeVisible();
  });
});
