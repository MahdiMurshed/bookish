import { expect, test } from '@playwright/test';

const TEST_EMAIL = 'alice@example.com';
const TEST_PASSWORD = 'password123';

test.describe('My Library', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/browse', { timeout: 10_000 });
  });

  test('shows user books', async ({ page }) => {
    await page.goto('/my-library');

    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();

    // Wait for loading to finish
    await expect(page.getByText('Loading your library...')).not.toBeVisible({ timeout: 10_000 });

    // User should have at least one book from seed data
    const bookTitles = page.locator('h3');
    await expect(bookTitles.first()).toBeVisible({ timeout: 5_000 });
    expect(await bookTitles.count()).toBeGreaterThan(0);
  });

  test('adds a book via Google Books search', async ({ page }) => {
    await page.goto('/my-library');
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
    await expect(page.getByText('Loading your library...')).not.toBeVisible({ timeout: 10_000 });

    // Record current book count
    const countText = page.locator('text=/\\d+ books?/');
    const initialText = await countText.textContent({ timeout: 5_000 });
    const initialCount = Number.parseInt(initialText?.match(/(\d+)/)?.[1] ?? '0', 10);

    // Click "Add Book"
    await page.getByRole('button', { name: 'Add Book' }).click();

    // Verify the add book form appears
    await expect(page.getByRole('heading', { name: 'Add a Book' })).toBeVisible();

    // Search Google Books
    await page.getByLabel('Search Google Books').fill('The Great Gatsby');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for search results (network dependent)
    const firstResult = page.locator('.max-h-60 button').first();
    await expect(firstResult).toBeVisible({ timeout: 30_000 });

    // Select the first result
    await firstResult.click();

    // Verify form auto-filled — title field should have a value
    await expect(page.getByLabel('Title *')).toHaveValue(/.+/, { timeout: 5_000 });
    await expect(page.getByLabel('Author *')).toHaveValue(/.+/);

    // Submit the book
    await page.getByRole('button', { name: 'Add Book' }).click();

    // Wait for the form to close and the new book to appear
    await expect(page.getByRole('heading', { name: 'Add a Book' })).not.toBeVisible({
      timeout: 10_000,
    });

    // Verify the book count increased
    await expect(countText).not.toHaveText(initialText!, { timeout: 10_000 });
    const newText = await countText.textContent();
    const newCount = Number.parseInt(newText?.match(/(\d+)/)?.[1] ?? '0', 10);
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('toggles lendable checkbox', async ({ page }) => {
    await page.goto('/my-library');
    await expect(page.getByText('Loading your library...')).not.toBeVisible({ timeout: 10_000 });

    // Find the first Lendable checkbox
    const lendableCheckbox = page.getByRole('checkbox').first();
    await expect(lendableCheckbox).toBeVisible({ timeout: 5_000 });

    // Record current state
    const wasChecked = await lendableCheckbox.isChecked();

    // Toggle it
    await lendableCheckbox.click();

    // Verify it changed
    if (wasChecked) {
      await expect(lendableCheckbox).not.toBeChecked({ timeout: 10_000 });
    } else {
      await expect(lendableCheckbox).toBeChecked({ timeout: 10_000 });
    }

    // Toggle back to restore state
    await lendableCheckbox.click();

    if (wasChecked) {
      await expect(lendableCheckbox).toBeChecked({ timeout: 10_000 });
    } else {
      await expect(lendableCheckbox).not.toBeChecked({ timeout: 10_000 });
    }
  });
});
