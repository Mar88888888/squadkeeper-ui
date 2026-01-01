import { test, expect, mockCoachUser, mockPlayerUser, setupApiMocks } from './fixtures';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Football Academy' })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should login successfully as coach and redirect to dashboard', async ({ page }) => {
    await setupApiMocks(page, mockCoachUser);
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('coach@test.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should login successfully as player', async ({ page }) => {
    await setupApiMocks(page, mockPlayerUser);
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('player@test.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
