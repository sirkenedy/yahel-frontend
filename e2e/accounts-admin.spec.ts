import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { at, stubPasskeys } from './support/accounts';
import { adminAddress, adminPhone, adminTo, codeBoxes, heading, stubAdmin } from './support/admin';
import { credentials, emailCode, mockApi, newAdmin, phoneCode, requestId } from './support/api';
import type { MockApi } from './support/api';
import { business, createWorkspace } from './support/business';

const sent = (api: MockApi, path: string) => api.calls.filter((call) => call.path === path);
const password = (page: Page) => page.getByLabel('Password', { exact: true });

test.describe('accounts: an administrator’s first sign-in', () => {
  test('straight from workspace sign-up: password, emailed code, phone and its code, welcome, passkey, then Admin', async ({ page }) => {
    const api = await mockApi(page);
    await stubPasskeys(page, 'success');
    await stubAdmin(page);
    await createWorkspace(page);
    await page.getByRole('link', { name: 'Sign in to Admin' }).click();

    // The address workspace sign-up made is signed in to, not asked for; the password is asked again.
    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    await expect(page).toHaveURL(at('/admin/signin'));
    await expect(page.getByRole('main')).toContainText(business.adminAddress);
    await expect(page.getByLabel('Admin email')).toHaveCount(0);
    await expect(password(page)).toHaveValue('');
    await password(page).fill(business.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(heading(page, 'Confirm your email.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText(`we just sent to ${business.adminAddress}`);
    expect(sent(api, '/v1/auth/verify-email/resend').at(-1)?.body).toEqual({ email: business.adminAddress });
    await codeBoxes(page).fill(emailCode);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await expect(page.getByText(`Signed in as ${business.adminAddress}`)).toBeAttached();
    await page.getByLabel('Mobile number').fill(adminPhone.number);
    await page.getByRole('button', { name: 'Send code' }).click();

    await expect(heading(page, 'Enter the code.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText(`We sent a 6-character code to ${adminPhone.masked}.`);
    expect(sent(api, '/v1/me/recovery/phone').at(-1)?.body).toEqual({ phone: '+2348035550142' });
    await codeBoxes(page).fill(phoneCode);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
    await expect(page.getByRole('listitem').first()).toHaveText(`${business.adminAddress} belongs to ${business.name}. As an admin, you decide which Yahel apps your team can use.`);
    await expect(page.getByRole('main')).toContainText(`Admins manage every account on ${business.domain}.`);
    await page.getByRole('button', { name: 'I understand' }).click();

    await expect(heading(page, 'Protect Admin with a passkey.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Not now' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Add a passkey' }).click();
    await expect(heading(page, 'Create your passkey.')).toBeVisible();
    await expect(page.getByText('Waiting for this device')).toBeVisible();

    await expect(heading(page, 'Admin is protected.')).toBeVisible();
    await expect(page.getByText('Passkey saved. You can sign in to Admin with it now.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue to Admin' }).click();
    await expect(page).toHaveURL(adminAddress);
    expect(sent(api, '/v1/auth/login')).toHaveLength(2);
    expect(sent(api, '/v1/auth/verify-email')).toHaveLength(1);
  });

  test('a wrong password is told like any other, and no code is asked for', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'signin');
    await page.getByLabel('Admin email').fill(newAdmin.email);
    await password(page).fill('not the password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(password(page)).toHaveAccessibleDescription(/That email and password don’t match\./);
    await expect(password(page)).toBeFocused();
    expect(sent(api, '/v1/auth/verify-email/resend')).toHaveLength(0);
    await expect(page).toHaveURL(at('/admin/signin'));

    // An address with no account reads exactly the same.
    await page.getByLabel('Admin email').fill('nobody@northwind.example');
    await password(page).fill('not the password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(password(page)).toHaveAccessibleDescription(/That email and password don’t match\./);
  });

  test('a wrong emailed code and an expired one are told beside the boxes; a spent one offers a new code', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'confirm-email');

    await codeBoxes(page).fill('WRONG1');
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(codeBoxes(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await expect(codeBoxes(page)).toBeFocused();

    // The backend answers an expired code exactly as a wrong one: it has gone from its store.
    api.failNext('/v1/auth/verify-email', 401, 'INVALID_TOKEN');
    await codeBoxes(page).fill(emailCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(codeBoxes(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);

    api.failNext('/v1/auth/verify-email', 429, 'TOKEN_MAX_ATTEMPTS');
    await codeBoxes(page).fill(emailCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    const spent = page.getByRole('alert').filter({ hasText: 'This code no longer works' });
    await expect(spent).toBeVisible();
    await spent.getByRole('button', { name: 'Send a new code' }).click();
    await expect(page.getByText('New code sent. Older codes no longer work.')).toBeVisible();
    expect(sent(api, '/v1/auth/verify-email/resend')).toHaveLength(2);

    await codeBoxes(page).fill(emailCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
  });

  test('a number the backend will not take is told beside it; a wrong texted code too; the right one moves on', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'phone');
    const number = page.getByLabel('Mobile number');

    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(number).toHaveAccessibleDescription(/Enter a mobile number that can get texts\./);
    api.failNext('/v1/me/recovery/phone', 409, 'PHONE_ALREADY_IN_USE');
    await number.fill(adminPhone.number);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(number).toHaveAccessibleDescription(/This number can’t be used\. Try another one\./);
    await expect(number).toBeFocused();

    await page.getByLabel('Country code').selectOption('GH');
    await number.fill('024 555 0142');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(heading(page, 'Enter the code.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('+233 ••• ••• ••42');
    expect(sent(api, '/v1/me/recovery/phone').at(-1)?.body).toEqual({ phone: '+233245550142' });

    await codeBoxes(page).fill('WRONG1');
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(codeBoxes(page)).toHaveAccessibleDescription(/That code didn’t work or has expired\./);
    await codeBoxes(page).fill(phoneCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
  });

  test('a dismissed passkey prompt saves nothing, says so, and another try works', async ({ page }) => {
    await mockApi(page);
    await adminTo(page, 'passkey', { passkey: 'cancelled' });

    await expect(page.getByText('The passkey wasn’t saved.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to Admin' })).toHaveCount(0);
    await stubPasskeys(page, 'success');
    await page.reload();
    // A reload forgets the flow; the session stays, so the welcome is where it picks up.
    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
    await page.getByRole('button', { name: 'I understand' }).click();
    await page.getByRole('button', { name: 'Add a passkey' }).click();
    await expect(heading(page, 'Admin is protected.')).toBeVisible();
  });

  test('a device that cannot make a passkey says so, offers only to sign out, and has no way on to Admin', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'add-passkey', { passkey: 'unsupported' });

    await expect(page.getByText('This device can’t make a passkey')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add a passkey' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue to Admin' })).toHaveCount(0);
    await page.goto(at('/admin/passkey'));
    await expect(heading(page, /^(Welcome to your new account\.|Protect Admin with a passkey\.)$/)).toBeVisible();

    await page.getByRole('button', { name: 'I understand' }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    await expect(page.getByLabel('Admin email')).toHaveValue('');
    expect(sent(api, '/v1/auth/logout')).toHaveLength(1);
  });
});

test.describe('accounts: the admin flow cannot be walked around', () => {
  test('no step past sign-in opens without a session, and none past the phone without a confirmed one', async ({ page }) => {
    await mockApi(page);
    for (const step of ['confirm-email', 'phone', 'code', 'welcome', 'add-passkey', 'passkey']) {
      await page.goto(at(`/admin/${step}`));
      await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    }

    await adminTo(page, 'phone');
    for (const step of ['code', 'welcome', 'add-passkey', 'passkey']) {
      await page.goto(at(`/admin/${step}`));
      await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    }
  });

  test('nothing leads on to Admin before a passkey exists', async ({ page }) => {
    await mockApi(page);
    await adminTo(page, 'welcome');
    await page.goto(at('/admin/add-passkey'));
    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to Admin' })).toHaveCount(0);
  });
});

test.describe('accounts: moving about the admin flow', () => {
  test('Back and Forward move between steps that can be shown; the confirm step exists only while its proof is held', async ({ page }) => {
    await mockApi(page);
    await adminTo(page, 'confirm-email');

    await page.goBack();
    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    await page.goForward();
    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    await expect(page).toHaveURL(at('/admin/signin'));

    await page.getByLabel('Admin email').fill(newAdmin.email);
    await password(page).fill(newAdmin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await codeBoxes(page).fill(emailCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.getByLabel('Mobile number').fill(adminPhone.number);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(heading(page, 'Enter the code.')).toBeVisible();

    await page.goBack();
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await expect(page.getByLabel('Mobile number')).toHaveValue(adminPhone.number);
    await page.goForward();
    await expect(heading(page, 'Enter the code.')).toBeVisible();
    await page.getByRole('link', { name: 'Back' }).click();
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
  });

  test('a reload mid-flow keeps the session and nothing else: nothing typed is in the address or web storage', async ({ page }) => {
    await mockApi(page);
    await adminTo(page, 'code');
    await page.reload();

    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await expect(page.getByLabel('Mobile number')).toHaveValue('');
    const stored = await page.evaluate(() => JSON.stringify({ ...window.localStorage, ...window.sessionStorage }));
    for (const secret of [newAdmin.password, emailCode, phoneCode, '5550142']) {
      expect(stored).not.toContain(secret);
      expect(page.url()).not.toContain(secret);
    }
    expect(page.url()).not.toContain(newAdmin.email);
  });

  test('a reload on the confirm step forgets the proven password', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'confirm-email');
    await page.reload();

    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    await expect(page.getByLabel('Admin email')).toHaveValue('');
    expect(sent(api, '/v1/auth/verify-email')).toHaveLength(0);
  });

  test('leaving sign-in while it runs, then coming back, keeps no proof and signs in afresh', async ({ page }) => {
    const api = await mockApi(page);
    let first = true;
    await page.route('**/api/v1/auth/login', async (route) => {
      if (!first) return route.fallback();
      first = false;
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fallback();
    });
    await adminTo(page, 'signin');
    await page.getByLabel('Admin email').fill(newAdmin.email);
    await password(page).fill(newAdmin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible();

    // Away to sign-in and back before the answer: the answer belongs to a visit that has ended.
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/signin\//);
    await page.goBack();
    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    await page.goto(at('/admin/confirm-email'));
    await expect(heading(page, 'Sign in to Admin.')).toBeVisible();
    expect(sent(api, '/v1/auth/verify-email')).toHaveLength(0);
  });

  test('the whole flow can be completed with the keyboard alone', async ({ page }) => {
    await mockApi(page);
    await stubAdmin(page);
    await adminTo(page, 'signin');
    const type = async (label: string, value: string) => {
      await page.getByLabel(label, { exact: true }).focus();
      await page.keyboard.type(value);
    };

    await type('Admin email', newAdmin.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(newAdmin.password);
    await page.keyboard.press('Enter');
    await expect(heading(page, 'Confirm your email.')).toBeVisible();
    await type('6-character code', emailCode);
    await page.keyboard.press('Enter');
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await type('Mobile number', adminPhone.number);
    await page.keyboard.press('Enter');
    await expect(heading(page, 'Enter the code.')).toBeVisible();
    await type('6-character code', phoneCode);
    await page.keyboard.press('Enter');
    await expect(heading(page, 'Welcome to your new account.')).toBeVisible();
    await page.getByRole('button', { name: 'I understand' }).focus();
    await page.keyboard.press('Enter');
    await expect(heading(page, 'Protect Admin with a passkey.')).toBeVisible();
    await page.getByRole('button', { name: 'Add a passkey' }).focus();
    await page.keyboard.press('Enter');
    await expect(heading(page, 'Admin is protected.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue to Admin' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(adminAddress);
  });
});

test.describe('accounts: who the admin flow is for', () => {
  test('someone already signed in picks up after sign-in, at the phone', async ({ page }) => {
    await mockApi(page);
    await stubPasskeys(page, 'success');
    await page.goto(at('/signin'));
    await page.getByRole('button', { name: 'Use another account' }).click();
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByRole('button', { name: 'Continue' }).click();
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();

    await page.goto(at('/admin'));
    await expect(heading(page, 'Verify it’s you.')).toBeVisible();
    await expect(page.getByRole('main')).toContainText(credentials.email);
  });

  test('a server failure on sign-in is a banner with its reference and another try', async ({ page }) => {
    const api = await mockApi(page);
    await adminTo(page, 'signin');
    api.failNext('/v1/auth/login', 500, 'INTERNAL_ERROR');
    await page.getByLabel('Admin email').fill(newAdmin.email);
    await password(page).fill(newAdmin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    const banner = page.getByRole('alert').filter({ hasText: 'Something went wrong on our side' });
    await expect(banner).toContainText(`Reference ${requestId}.`);
    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page, 'Confirm your email.')).toBeVisible();
  });
});

test.describe('accounts: the admin flow as a release build runs it', () => {
  test('without the endpoints it needs it is not offered, and its addresses lead to sign-in', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/admin/signin?stand-ins=off'));
    await expect(page).toHaveURL(/\/signin\/(email|choose)/);
  });
});
