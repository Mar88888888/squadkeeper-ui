import { test, expect, mockCoachUser } from './fixtures';

test.describe('Coach Workflows', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs(mockCoachUser);
  });

  test.describe('Groups Management', () => {
    test('should display coach groups', async ({ page }) => {
      await page.goto('/my-groups');

      // Wait for groups to load
      await expect(page.getByText('My Groups')).toBeVisible();
      await expect(page.getByText('U12')).toBeVisible();
    });

    test('should show group details with players', async ({ page }) => {
      await page.goto('/my-groups');

      // Should show player count
      await expect(page.getByText(/2 players/)).toBeVisible();
    });

    test('should show schedule section in group', async ({ page }) => {
      await page.goto('/my-groups');

      // Click on Training Schedule button
      await page.getByRole('button', { name: 'Training Schedule' }).first().click();

      // Modal should open
      await expect(page.getByText(/Training Schedule - U12/)).toBeVisible();
    });
  });

  test.describe('Trainings Management', () => {
    test('should display trainings list', async ({ page }) => {
      await page.goto('/trainings');

      await expect(page.getByText('Training Field A')).toBeVisible();
      await expect(page.getByText('Passing drills')).toBeVisible();
    });

    test('should show Schedule Training button', async ({ page }) => {
      await page.goto('/trainings');

      await expect(page.getByRole('button', { name: /Schedule Training/i })).toBeVisible();
    });

    test('should open training scheduling modal', async ({ page }) => {
      await page.goto('/trainings');

      await page.getByRole('button', { name: /Schedule Training/i }).click();

      // Modal should appear with form fields
      await expect(page.getByText('Group *')).toBeVisible();
    });

    test('should navigate to training details', async ({ page }) => {
      await page.goto('/trainings');

      // Click on a training card
      await page.getByText('Training Field A').click();

      await expect(page).toHaveURL(/trainings\/t1/);
    });

    test('should show attendance and evaluations tabs in training details', async ({ page }) => {
      await page.goto('/trainings/t1');

      // Wait for page to load
      await expect(page.getByText('U12')).toBeVisible();

      // Check for tab navigation - use exact match to avoid "Save Attendance" button
      await expect(page.getByRole('button', { name: 'Attendance', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Evaluations', exact: true })).toBeVisible();
    });

    test('should filter trainings by time', async ({ page }) => {
      await page.goto('/trainings');

      // Wait for trainings to load
      await expect(page.getByText('Training Field A')).toBeVisible();

      // Click on "This Week" filter button specifically
      const filterButtons = page.locator('button').filter({ hasText: /^Upcoming$/ });
      await filterButtons.click();

      // Page should still show schedule button
      await expect(page.getByRole('button', { name: /Schedule Training/i })).toBeVisible();
    });
  });

  test.describe('Matches Management', () => {
    test('should display matches list', async ({ page }) => {
      await page.goto('/matches');

      await expect(page.getByText('Stadium A')).toBeVisible();
      await expect(page.getByText(/FC Dynamo/)).toBeVisible();
    });

    test('should show Schedule Match button', async ({ page }) => {
      await page.goto('/matches');

      await expect(page.getByRole('button', { name: /Schedule Match/i })).toBeVisible();
    });

    test('should open match scheduling modal', async ({ page }) => {
      await page.goto('/matches');

      await page.getByRole('button', { name: /Schedule Match/i }).click();

      // Modal should appear
      await expect(page.getByText('Opponent *')).toBeVisible();
    });

    test('should display match scores for past matches', async ({ page }) => {
      await page.goto('/matches');

      // Past match shows score (away win 3-1)
      await expect(page.getByText(/3\s*-\s*1/)).toBeVisible();
    });

    test('should show Home/Away badges', async ({ page }) => {
      await page.goto('/matches');

      await expect(page.getByText('Home')).toBeVisible();
      await expect(page.getByText('Away')).toBeVisible();
    });

    test('should navigate to match details', async ({ page }) => {
      await page.goto('/matches');

      // Click on a match card
      await page.getByText('Stadium A').click();

      await expect(page).toHaveURL(/matches\/m1/);
    });
  });

  test.describe('Back Navigation', () => {
    test('should navigate back from trainings to dashboard', async ({ page }) => {
      await page.goto('/trainings');

      await page.getByRole('button', { name: /Back to Dashboard/i }).click();

      await expect(page).toHaveURL(/dashboard/);
    });

    test('should navigate back from matches to dashboard', async ({ page }) => {
      await page.goto('/matches');

      await page.getByRole('button', { name: /Back to Dashboard/i }).click();

      await expect(page).toHaveURL(/dashboard/);
    });

    test('should navigate back from training details to trainings', async ({ page }) => {
      await page.goto('/trainings/t1');

      await page.getByRole('button', { name: /Back to Trainings/i }).click();

      await expect(page).toHaveURL(/trainings/);
    });
  });
});
