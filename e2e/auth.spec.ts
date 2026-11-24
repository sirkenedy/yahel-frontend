import { expect, test } from '@playwright/test';
import { credentials, mockApi, profile, signIn, takenAddress } from './support/api';

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

  test('showing and hiding the password never submits the form', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password', { exact: true }).fill(credentials.password);

    await page.getByRole('button', { name: 'Show password' }).click();
    await page.getByRole('button', { name: 'Hide password' }).click();

    await expect(page.getByLabel('Password', { exact: true })).toHaveValue(credentials.password);
    expect(api.calls.filter((c) => c.path === '/v1/auth/login')).toHaveLength(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  for (const path of ['Enter in the field', 'validation stops it', 'the connection is lost'] as const) {
    test(`the password is hidden again on submit when ${path}`, async ({ page }) => {
      await mockApi(page, { offline: path === 'the connection is lost' });
      await page.goto('/sign-in');
      if (path !== 'validation stops it') await page.getByLabel('Email').fill(credentials.email);
      const password = page.getByLabel('Password', { exact: true });
      await password.fill('a revealed secret');
      await page.getByRole('button', { name: 'Show password' }).click();
      await expect(password).toHaveAttribute('type', 'text');

      if (path === 'Enter in the field') await password.press('Enter');
      else await page.getByRole('button', { name: 'Sign in' }).click();

      await expect(password).toHaveAttribute('type', 'password');
      await expect(password).toHaveValue('a revealed secret');
    });
  }

  for (const width of [320, 360, 768, 1024]) {
    for (const mode of ['plain', '200% text', 'right to left'] as const) {
      test(`the password field fits at ${width} wide, ${mode}`, async ({ page, isMobile }) => {
        await page.setViewportSize({ width, height: 800 });
        await mockApi(page);
        await page.goto('/sign-in');
        await page.addStyleTag({ content: '* { letter-spacing: 0.06em !important; }' });
        await page.evaluate((m) => {
          if (m === '200% text') document.documentElement.style.fontSize = '200%';
          if (m === 'right to left') document.documentElement.dir = 'rtl';
        }, mode);

        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
        const toggle = await page.getByRole('button', { name: 'Show password' }).boundingBox();
        expect(toggle!.x).toBeGreaterThanOrEqual(0);
        expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(width + 0.5);
        expect(Math.min(toggle!.width, toggle!.height)).toBeGreaterThanOrEqual(isMobile ? 43.5 : 27.5);
      });
    }
  }

  test('the show control follows the password field in tab order and has a visible focus ring', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await mockApi(page);
    await page.goto('/sign-in');
    await page.getByLabel('Password', { exact: true }).focus();
    await page.keyboard.press('Tab');

    const toggle = page.getByRole('button', { name: 'Show password' });
    await expect(toggle).toBeFocused();
    const ring = await toggle.evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), colour: style.outlineColor };
    });
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThanOrEqual(2);
    expect(ring.colour).not.toMatch(/rgba\(.*, 0\)|transparent/);
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

    await expect(page).toHaveURL(/\/u\/0\/?$/);
    await expect(page.getByRole('main').getByText(profile.displayName)).toBeVisible();
    await expect(page.getByRole('main').getByText('Personal')).toBeVisible();

    await page.getByRole('link', { name: 'Manage account' }).click();
    await expect(page).toHaveURL(/\/u\/0\/account$/);
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
    await expect(page.getByText(profile.globalId)).toBeVisible();

    await page.getByRole('link', { name: 'Back to home' }).click();
    await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    expect(api.calls.filter((c) => c.path === '/v1/auth/logout').map((c) => c.body)).toEqual([{ slot: 0 }]);

    await page.goto('/u/0/account');
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
  test('survives a reload by refreshing the slot in the address', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
    const afterSignIn = api.calls.slice(api.calls.findIndex((c) => c.path === '/v1/auth/login'));
    expect(afterSignIn.filter((c) => c.path === '/v1/auth/refresh').map((c) => c.body)).toEqual([{ slot: 0 }]);
    expect(api.calls.every((c) => c.client === 'web')).toBe(true);
  });

  test('keeps no token of any kind in web storage', async ({ page }) => {
    await mockApi(page);
    await signIn(page);

    expect(await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)])).toEqual([[], []]);
  });

  test('a slot whose session has ended goes to sign-in', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/u/3/');

    await expect(page).toHaveURL(/\/sign-in$/);
    const refreshed = api.calls.filter((c) => c.path === '/v1/auth/refresh').map((c) => c.body);
    expect(refreshed.length).toBeGreaterThan(0);
    expect(refreshed.every((body) => JSON.stringify(body) === JSON.stringify({ slot: 3 }))).toBe(true);
  });

  test('each account opens at its own address, and the menu switches between them', async ({ page }) => {
    await mockApi(page, { remembered: [{ email: credentials.email, displayName: profile.displayName, signedIn: true }, { email: takenAddress, displayName: 'Kemi Adeyemi' }] });
    await page.goto('/u/0/');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.getByRole('button', { name: `Account: ${credentials.email}` }).click();
    const menu = page.getByRole('dialog', { name: 'Accounts' });
    await expect(menu.getByRole('link', { name: 'Manage your account' })).toBeFocused();
    await expect(menu.getByRole('button', { name: new RegExp(`^Sign in to.*${takenAddress}`) })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(takenAddress);
    await page.getByLabel('Password', { exact: true }).fill('Harmattan-in-Ibadan-88');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/u\/1\/?$/);

    await page.getByRole('button', { name: `Account: ${takenAddress}` }).click();
    await page.getByRole('dialog', { name: 'Accounts' }).getByRole('button', { name: new RegExp(`^Switch to.*${credentials.email}`) }).click();
    await expect(page).toHaveURL(/\/u\/0\/?$/);
    await expect(page.getByRole('button', { name: `Account: ${credentials.email}` })).toBeVisible();
  });
});
