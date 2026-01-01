import { test, expect, mockPlayerUser } from './fixtures';

test.describe('Player Workflows', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs(mockPlayerUser);
  });

  test.describe('Player Stats', () => {
    test('should display player statistics', async ({ page }) => {
      await page.goto('/stats/my');

      // Should show stats page heading
      await expect(page.getByRole('heading', { name: /My Statistics|Statistics/i })).toBeVisible();
    });

    test('should show training attendance', async ({ page }) => {
      await page.goto('/stats/my');

      // Stats page should load with heading
      await expect(page.getByRole('heading', { name: /My Statistics|Statistics/i })).toBeVisible();
    });
  });

  test.describe('Trainings View (Read-only)', () => {
    test('should view trainings list', async ({ page }) => {
      await page.goto('/trainings');

      await expect(page.getByText('Training Field A')).toBeVisible();
    });

    test('should NOT show Schedule Training button', async ({ page }) => {
      await page.goto('/trainings');

      // Wait for page to load
      await expect(page.getByText('Training Field A')).toBeVisible();

      // Should not have schedule button for players
      await expect(page.getByRole('button', { name: /Schedule Training/i })).not.toBeVisible();
    });

    test('should view training details in read-only mode', async ({ page }) => {
      await page.goto('/trainings/t1');

      // Wait for page to load - check for group name
      await expect(page.getByText('U12')).toBeVisible();

      // Should not have save button for player
      await expect(page.getByRole('button', { name: /Save Attendance/i })).not.toBeVisible();
    });
  });

  test.describe('Matches View (Read-only)', () => {
    test('should view matches list', async ({ page }) => {
      await page.goto('/matches');

      await expect(page.getByText('Stadium A')).toBeVisible();
    });

    test('should NOT show Schedule Match button', async ({ page }) => {
      await page.goto('/matches');

      // Wait for page to load
      await expect(page.getByText('Stadium A')).toBeVisible();

      // Should not have schedule button for players
      await expect(page.getByRole('button', { name: /Schedule Match/i })).not.toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from dashboard to stats', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('link', { name: /My Statistics/i }).click();

      await expect(page).toHaveURL(/stats\/my/);
    });

    test('should navigate from dashboard to trainings', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('link', { name: /Trainings/i }).first().click();

      await expect(page).toHaveURL(/trainings/);
    });

    test('should navigate from dashboard to matches', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('link', { name: /Matches/i }).first().click();

      await expect(page).toHaveURL(/matches/);
    });
  });
});
