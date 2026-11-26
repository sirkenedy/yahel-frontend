import { expect, test } from './support/test';
import type { Page } from '@playwright/test';
import { credentials, mockApi, profile, registeredEmail, shellAccountsUrl, signIn, takenAddress } from './support/api';

// The shell has no sign-in page of its own (F-93): every way to sign in leaves for the accounts app. Its
// browser tests stand in for that app, so a test can see exactly where the shell sent the person.
const standInForAccountsApp = (page: Page) => page.route(`${shellAccountsUrl}/**`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Accounts</title>' }));
const shellHome = encodeURIComponent('http://localhost:4173/');

test.describe('signing in, from the shell', () => {
  test('a signed-out visitor is sent to the accounts app’s sign-in, asked to come back here', async ({ page }) => {
    await mockApi(page);
    await standInForAccountsApp(page);
    await page.goto('/');

    await expect(page).toHaveURL(`${shellAccountsUrl}/signin?return=${shellHome}`);
  });

  test('view the account, then sign out with nobody left: the accounts app’s sign-in', async ({ page }) => {
    const api = await mockApi(page);
    await standInForAccountsApp(page);
    await signIn(page);

    await expect(page).toHaveURL(/\/u\/0\/?$/);
    await expect(page.getByRole('main').getByText(profile.displayName)).toBeVisible();
    // Amara's account is Northwind Studio's: the tag names the organisation, never "Personal".
    await expect(page.getByRole('main').getByText('Northwind Studio')).toBeVisible();
    await expect(page.getByRole('main').getByText('Personal')).toHaveCount(0);

    await page.getByRole('link', { name: 'Manage account' }).click();
    await expect(page).toHaveURL(/\/u\/0\/account$/);
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
    await expect(page.getByText(profile.globalId)).toBeVisible();

    await page.getByRole('link', { name: 'Back to home' }).click();
    await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(`${shellAccountsUrl}/signin?return=${shellHome}`);
    expect(api.calls.filter((c) => c.path === '/v1/auth/logout').map((c) => c.body)).toEqual([{ slot: 0 }]);
  });
});

test.describe('which kind of account, from the shell', () => {
  test('a personal account is tagged personal, in the home and the account menu', async ({ page }) => {
    await mockApi(page, { remembered: [] });
    await signIn(page, { email: registeredEmail, password: 'Harmattan-in-Ibadan-88' });

    await expect(page.getByRole('main').getByText('Personal')).toBeVisible();
    await page.getByRole('button', { name: `Account: ${registeredEmail}` }).click();
    await expect(page.getByRole('dialog', { name: 'Accounts' }).getByRole('region', { name: 'Signed in as' })).toContainText('Personal account');
  });

  test('a workspace founder is tagged as the organisation’s administrator', async ({ page }) => {
    await mockApi(page, { remembered: [{ email: credentials.email, displayName: 'Amara Okafor', kind: 'business', organisation: 'Northwind Studio', role: 'OWNER' }] });
    await signIn(page);

    await expect(page.getByRole('main').getByText('Admin · Northwind Studio')).toBeVisible();
    await expect(page.getByRole('main').getByText('Personal')).toHaveCount(0);
  });
});

test.describe('session', () => {
  test('survives a reload by refreshing the slot in the address', async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page);
    const before = api.calls.length;
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
    expect(api.calls.slice(before).filter((c) => c.path === '/v1/auth/refresh').map((c) => c.body)).toEqual([{ slot: 0 }]);
    expect(api.calls.every((c) => c.client === 'web')).toBe(true);
  });

  test('keeps no token of any kind in web storage', async ({ page }) => {
    await mockApi(page);
    await signIn(page);

    expect(await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)])).toEqual([[], []]);
  });

  test('a slot whose session has ended goes to the accounts app’s sign-in', async ({ page }) => {
    const api = await mockApi(page);
    await standInForAccountsApp(page);
    await page.goto('/u/3/');

    await expect(page).toHaveURL(`${shellAccountsUrl}/signin?return=${shellHome}`);
    const refreshed = api.calls.filter((c) => c.path === '/v1/auth/refresh').map((c) => c.body);
    expect(refreshed.length).toBeGreaterThan(0);
    expect(refreshed.every((body) => JSON.stringify(body) === JSON.stringify({ slot: 3 }))).toBe(true);
  });
});

test.describe('account menu, in the shell', () => {
  const menu = (page: Page) => page.getByRole('dialog', { name: 'Accounts' });

  test('switches to another signed-in account at its own address', async ({ page }) => {
    const api = await mockApi(page, { remembered: [{ email: credentials.email, displayName: profile.displayName }, { email: takenAddress, displayName: 'Kemi Adeyemi' }] });
    api.signInAs(takenAddress);
    await signIn(page);

    await page.getByRole('button', { name: `Account: ${credentials.email}` }).click();
    await expect(menu(page).getByRole('link', { name: 'Manage your account' })).toBeFocused();
    await menu(page).getByRole('button', { name: new RegExp(`^Switch to.*${takenAddress}`) }).click();

    await expect(page).toHaveURL(/\/u\/1\/?$/);
    await expect(page.getByRole('button', { name: `Account: ${takenAddress}` })).toBeVisible();
  });

  test('a signed-out account opens its password in the accounts app, named by its handle and never its address', async ({ page }) => {
    const api = await mockApi(page, { remembered: [{ email: credentials.email, displayName: profile.displayName }, { email: takenAddress, displayName: 'Kemi Adeyemi' }] });
    await standInForAccountsApp(page);
    await signIn(page);
    const handle = api.remembered().find((account) => account.email === takenAddress)!.handle;

    await page.getByRole('button', { name: `Account: ${credentials.email}` }).click();
    await menu(page).getByRole('button', { name: new RegExp(`^Sign in to.*${takenAddress}`) }).click();

    await expect(page).toHaveURL(`${shellAccountsUrl}/signin?account=${handle}&return=${shellHome}`);
    expect(page.url()).not.toContain(encodeURIComponent(takenAddress));
    expect(page.url()).not.toContain(takenAddress);
  });

  test('“Add another account” opens the accounts app’s email step, empty', async ({ page }) => {
    await mockApi(page);
    await standInForAccountsApp(page);
    await signIn(page);

    await page.getByRole('button', { name: `Account: ${credentials.email}` }).click();
    await menu(page).getByRole('button', { name: 'Add another account' }).click();

    await expect(page).toHaveURL(`${shellAccountsUrl}/signin/email?return=${shellHome}`);
  });

  test('signing out of all accounts leaves for the accounts app’s sign-in', async ({ page }) => {
    const api = await mockApi(page);
    await standInForAccountsApp(page);
    await signIn(page);

    await page.getByRole('button', { name: `Account: ${credentials.email}` }).click();
    await menu(page).getByRole('button', { name: 'Sign out of all accounts' }).click();

    await expect(page).toHaveURL(`${shellAccountsUrl}/signin?return=${shellHome}`);
    expect(api.calls.some((c) => c.path === '/v1/auth/logout-browser')).toBe(true);
  });
});
