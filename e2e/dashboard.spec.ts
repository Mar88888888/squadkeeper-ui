import { test, expect, mockCoachUser, mockPlayerUser, mockAdminUser, mockParentUser } from './fixtures';

test.describe('Dashboard Navigation', () => {
  test.describe('Coach Dashboard', () => {
    test.beforeEach(async ({ page, loginAs }) => {
      await loginAs(mockCoachUser);
    });

    test('should display coach dashboard with all sections', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show welcome message with first name
      await expect(page.getByText('Welcome back, John!')).toBeVisible();

      // Should show Coach Panel
      await expect(page.getByText('Coach Panel')).toBeVisible();

      // Should show navigation links - use first() since there are multiple trainings/matches links
      await expect(page.getByRole('link', { name: /Trainings/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Matches/i }).first()).toBeVisible();
    });

    test('should navigate to My Groups page', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('link', { name: 'My Groups' }).click();

      await expect(page).toHaveURL(/my-groups/);
    });

    test('should navigate to Trainings page', async ({ page }) => {
      await page.goto('/dashboard');

      // Click on the Trainings link in Coach Panel
      await page.getByRole('link', { name: 'Trainings' }).first().click();

      await expect(page).toHaveURL(/trainings/);
    });

    test('should navigate to Matches page', async ({ page }) => {
      await page.goto('/dashboard');

      // Click on the Matches link
      await page.getByRole('link', { name: 'Matches' }).first().click();

      await expect(page).toHaveURL(/matches/);
    });
  });

  test.describe('Player Dashboard', () => {
    test.beforeEach(async ({ page, loginAs }) => {
      await loginAs(mockPlayerUser);
    });

    test('should display player dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.getByText('Welcome back, Tom!')).toBeVisible();
    });

    test('should show player stats link', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.getByRole('link', { name: /My Statistics/i })).toBeVisible();
    });

    test('should navigate to player stats', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('link', { name: /My Statistics/i }).click();

      await expect(page).toHaveURL(/stats\/my/);
    });
  });

  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page, loginAs }) => {
      await loginAs(mockAdminUser);
    });

    test('should show admin-specific options', async ({ page }) => {
      await page.goto('/dashboard');

      // Admin should see Admin Panel
      await expect(page.getByText('Admin Panel')).toBeVisible();
      await expect(page.getByRole('link', { name: /Create User/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /User List/i })).toBeVisible();
    });
  });

  test.describe('Parent Dashboard', () => {
    test.beforeEach(async ({ page, loginAs }) => {
      await loginAs(mockParentUser);
    });

    test('should display parent dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.getByText('Welcome back, Parent!')).toBeVisible();
      await expect(page.getByRole('link', { name: /Child Statistics/i })).toBeVisible();
    });
  });
});
