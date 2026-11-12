import { expect, test } from '@playwright/test';
import { credentials, mockApi, profile, signIn } from './support/api';

test.describe('sign in', () => {
  test('a signed-out visitor is sent to sign-in', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('empty submit names what is missing and sends nothing', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/sign-in');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter your email address')).toBeVisible();
    await expect(page.getByText('Enter your password')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeFocused();
    expect(api.calls.filter((c) => c.path === '/v1/auth/login')).toHaveLength(0);
  });

  test('wrong password explains the failure and keeps what was typed', async ({ page }) => {
    await mockApi(page);
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill('wrong password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toContainText("don't match");
    await expect(page.getByLabel('Email')).toHaveValue(credentials.email);
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('a lost connection is reported plainly', async ({ page }) => {
    await mockApi(page, { offline: true });
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toContainText("Can't reach the server");
  });

  test('sign in, view the account, sign out', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);

    await expect(page.getByText(profile.displayName)).toBeVisible();
    await expect(page.getByText('Personal')).toBeVisible();

    await page.getByRole('link', { name: 'Manage account' }).click();
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
    await expect(page.getByText(profile.globalId)).toBeVisible();

    await page.getByRole('link', { name: 'Back to home' }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    expect(api.calls.some((c) => c.path === '/v1/auth/logout')).toBe(true);

    await page.goto('/account');
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('the form works with the keyboard alone', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await mockApi(page);
    await page.goto('/sign-in');
    await page.getByLabel('Email').focus();
    await page.keyboard.type(credentials.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(credentials.password);
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  });
});

test.describe('session', () => {
  test('survives a reload by rotating the refresh token', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
    expect(api.calls.filter((c) => c.path === '/v1/auth/refresh')).toHaveLength(1);
  });

  test('never writes the access token to web storage', async ({ page }) => {
    await mockApi(page);
    await signIn(page);

    const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    expect(stored).not.toContain('access-');
    expect(stored).toContain('refresh-');
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['yahel.device-id']);
  });

  test('a rejected refresh token ends the session cleanly', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => sessionStorage.setItem('yahel.refresh-token', 'stale-token'));
    await page.goto('/');

    await expect(page).toHaveURL(/\/sign-in$/);
    expect(await page.evaluate(() => sessionStorage.getItem('yahel.refresh-token'))).toBeNull();
  });
});
