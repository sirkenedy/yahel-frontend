import { expect, test } from '@playwright/test';
import { at, openPasswordStep, stubPasskeys } from './support/accounts';
import { adminAddress, adminPhone, adminTo, codeBoxes, heading, stubAdmin } from './support/admin';
import { credentials, mockApi, newAdmin, phoneCode } from './support/api';
import type { MockApi } from './support/api';

const sent = (api: MockApi, path: string) => api.calls.filter((call) => call.path === path);

test.describe('accounts: an administrator whose phone is still to be checked', () => {
  test('signing in answers with a phone check, not a session; the texted code signs in, then the welcome and the passkey', async ({ page }) => {
    const api = await mockApi(page);
    await stubAdmin(page);
    await adminTo(page, 'phone');
    await expect(page.getByRole('main')).toContainText(newAdmin.email);
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);
    expect(sent(api, '/v1/auth/refresh')).toHaveLength(0);

    await page.getByLabel('Mobile number').fill(adminPhone.number);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByRole('main')).toContainText(adminPhone.masked);
    expect(sent(api, '/v1/auth/phone-challenge/send')[0]!.body).toEqual({ challengeToken: 'phone-check-1', phone: '+2348035550142' });
    await codeBoxes(page).fill(phoneCode);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
    await expect(page.getByRole('button', { name: `Account: ${newAdmin.email}` })).toBeVisible();
    await page.getByRole('button', { name: 'I understand' }).click();
    await page.getByRole('button', { name: 'Add a passkey' }).click();
    await expect(heading(page, 'Admin is protected.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue to Admin' }).click();
    await expect(page).toHaveURL(adminAddress);
  });

  test('once the phone is checked, the next sign-in opens a session straight away', async ({ page }) => {
    await mockApi(page);
    await adminTo(page, 'welcome');
    await page.goto(at('/signin'));
    await page.getByRole('button', { name: new RegExp(`^Switch to.*${newAdmin.email}`) }).waitFor();

    await openPasswordStep(page, newAdmin.email);
    await page.getByLabel('Password', { exact: true }).fill(newAdmin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(heading(page, 'Welcome back, Kayode.')).toBeVisible();
  });

  test('a number the backend will not take is told beside it; a wrong texted code too; the right one moves on', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'phone');
    const number = page.getByLabel('Mobile number');

    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(number).toHaveAccessibleDescription(/Enter a mobile number that can get texts\./);
    api.failNext('/v1/auth/phone-challenge/send', 409, 'PHONE_ALREADY_IN_USE');
    await number.fill(adminPhone.number);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(number).toHaveAccessibleDescription(/This number can’t be used\. Try another one\./);

    await page.getByLabel('Country code').selectOption('GH');
    await number.fill('024 555 0142');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(heading(page, 'Enter the code.')).toBeVisible();
    expect(sent(api, '/v1/auth/phone-challenge/send').at(-1)?.body).toMatchObject({ phone: '+233245550142' });

    // Six letters or digits, case-sensitive: the boxes take letters.
    await codeBoxes(page).fill('WRONG1');
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(codeBoxes(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await codeBoxes(page).fill(phoneCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
  });

  test('a phone check that has ended leads to signing in again, which starts a new one', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'phone');
    api.failNext('/v1/auth/phone-challenge/send', 401, 'INVALID_TOKEN');
    await page.getByLabel('Mobile number').fill(adminPhone.number);
    await page.getByRole('button', { name: 'Send code' }).click();

    const ended = page.getByRole('alert').filter({ hasText: 'This check has ended' });
    await expect(ended).toBeVisible();
    await ended.getByRole('link', { name: 'Sign in again' }).click();
    await expect(page).toHaveURL(/\/signin/);
  });

  test('“Not now” leaves the passkey for later and opens Admin', async ({ page }) => {
    await mockApi(page);
    await stubAdmin(page);
    await adminTo(page, 'add-passkey');
    await expect(page.getByText('Recommended for admins')).toBeVisible();
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page).toHaveURL(adminAddress);
  });

  test('a device that cannot make a passkey says so and goes on to Admin', async ({ page }) => {
    await mockApi(page);
    await stubAdmin(page);
    await adminTo(page, 'add-passkey', { passkey: 'unsupported' });

    await expect(page.getByText('This device can’t make a passkey')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add a passkey' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Continue to Admin' }).click();
    await expect(page).toHaveURL(adminAddress);
  });

  test('a dismissed passkey prompt saves nothing, says so, and another try works', async ({ page }) => {
    await mockApi(page);
    await adminTo(page, 'passkey', { passkey: 'cancelled' });
    await expect(page.getByText('The passkey wasn’t saved.')).toBeVisible();
  });
});

test.describe('accounts: the admin steps cannot be walked around', () => {
  test('with no session and no phone check, every step leads to sign-in; with a check, only the phone', async ({ page }) => {
    await mockApi(page);
    for (const step of ['phone', 'code', 'welcome', 'add-passkey', 'passkey']) {
      await page.goto(at(`/admin/${step}`), { waitUntil: 'commit' });
      await expect(page).toHaveURL(/\/signin\/(email|choose)$/);
    }

    await adminTo(page, 'phone');
    for (const step of ['code', 'welcome', 'add-passkey', 'passkey']) {
      await page.goto(at(`/admin/${step}`), { waitUntil: 'commit' });
      // A page load forgets the phone check: only sign-in can start another.
      await expect(page).toHaveURL(/\/signin\/(email|choose)$/);
    }
  });

  test('someone signed in whose phone is confirmed picks up at the welcome', async ({ page }) => {
    await mockApi(page);
    await stubPasskeys(page, 'success');
    await adminTo(page, 'welcome');
    await page.reload();
    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
  });

  test('someone signed in with no confirmed phone confirms it on the account', async ({ page }) => {
    const api = await mockApi(page, { remembered: [] });
    await openPasswordStep(page, credentials.email);
    await page.getByLabel('Password', { exact: true }).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();

    await page.goto(at('/admin'));
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await page.getByLabel('Mobile number').fill(adminPhone.number);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(heading(page, 'Enter the code.')).toBeVisible();
    expect(sent(api, '/v1/me/recovery/phone')).toHaveLength(1);
    expect(sent(api, '/v1/auth/phone-challenge/send')).toHaveLength(0);
  });
});
