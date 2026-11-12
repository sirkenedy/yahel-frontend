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
    await page.getByLabel('Password', { exact: true }).fill('wrong password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toContainText("don't match");
    await expect(page.getByLabel('Email')).toHaveValue(credentials.email);
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('the password can be revealed and hidden, and the value is kept', async ({ page }) => {
    await mockApi(page);
    await page.goto('/sign-in');
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('a secret to check');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(password).toHaveValue('a secret to check');
    await expect(page.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toHaveValue('a secret to check');
  });

  test('the password is hidden again when sign-in is submitted', async ({ page }) => {
    await mockApi(page);
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(credentials.email);
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('wrong password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toContainText("don't match");
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toHaveValue('wrong password');
  });

  test('the show control follows the password field in tab order and has a visible focus ring', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await mockApi(page);
    await page.goto('/sign-in');
    await page.getByLabel('Password', { exact: true }).focus();
    await page.keyboard.press('Tab');

    const toggle = page.getByRole('button', { name: 'Show password' });
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeFocused();
  });

  test('the show control has a touch-sized target and stays inside the screen', async ({ page, isMobile }) => {
    await mockApi(page);
    await page.goto('/sign-in');
    const box = await page.getByRole('button', { name: 'Show password' }).boundingBox();
    const viewport = page.viewportSize()!;

    expect(box!.height).toBeGreaterThanOrEqual(isMobile ? 43.5 : 27.5);
    expect(box!.width).toBeGreaterThanOrEqual(isMobile ? 43.5 : 27.5);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

    await page.addStyleTag({ content: '* { letter-spacing: 0.06em !important; }' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
      document.documentElement.dir = 'rtl';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
    const input = await page.getByLabel('Password', { exact: true }).boundingBox();
    const toggle = await page.getByRole('button', { name: 'Show password' }).boundingBox();
    expect(toggle!.x).toBeGreaterThanOrEqual(input!.x);
    expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(input!.x + input!.width + 0.5);
  });

  test('a lost connection is reported plainly', async ({ page }) => {
    await mockApi(page, { offline: true });
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password', { exact: true }).fill(credentials.password);
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
