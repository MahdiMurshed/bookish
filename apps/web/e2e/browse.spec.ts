import { expect, test } from '@playwright/test';

const TEST_EMAIL = 'alice@example.com';
const TEST_PASSWORD = 'password123';

test.describe('Browse page', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/browse', { timeout: 10_000 });
  });

  test('shows seed books', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Community Bookshelf' })).toBeVisible();

    // Wait for books to load (loading state disappears)
    await expect(page.getByText('Loading books...')).not.toBeVisible({ timeout: 10_000 });

    // Verify at least one book is visible
    // Seed data should include books — look for any book card with a title
    const bookTitles = page.locator('h3');
    await expect(bookTitles.first()).toBeVisible({ timeout: 5_000 });
    expect(await bookTitles.count()).toBeGreaterThan(0);
  });

  test('filters books by search', async ({ page }) => {
    // Wait for books to load
    await expect(page.getByText('Loading books...')).not.toBeVisible({ timeout: 10_000 });

    // Get the initial count of book cards
    const bookCards = page.locator('h3');
    await expect(bookCards.first()).toBeVisible({ timeout: 5_000 });
    const initialCount = await bookCards.count();

    // Type a search query that should filter results
    const searchInput = page.getByPlaceholder('Search by title or author...');
    await searchInput.fill('xyznonexistent');

    // Wait a moment for filtering to apply (debounce / re-query)
    await page.waitForTimeout(1_000);

    // Either we see fewer results or the empty state
    const afterCount = await bookCards.count();
    const emptyMessage = page.getByText('No books available yet');

    // Should have fewer results or show empty state
    const filtered = afterCount < initialCount || (await emptyMessage.isVisible());
    expect(filtered).toBeTruthy();
  });
});
