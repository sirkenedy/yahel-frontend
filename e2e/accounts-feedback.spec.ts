import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { at, openEmailStep, openNewPasswordStep, openPasswordStep, setConnection, signInWithPassword } from './support/accounts';
import { credentials, mockApi, phoneCode, requestId, suspendedCredentials } from './support/api';
import type { MockApi } from './support/api';
import { heading, person, signUpTo } from './support/personal';

// Every server answer of the design's feedback map, driven through the mock, for sign-in and for personal sign-up.

const calls = (api: MockApi, path: string) => api.calls.filter((call) => call.path === path);
const password = (page: Page) => page.getByLabel('Password', { exact: true });
const code = (page: Page) => page.getByLabel('6-character code');
const proceed = (page: Page, name = 'Continue') => page.getByRole('button', { name, exact: true }).click();
const create = (page: Page) => page.getByRole('button', { name: 'Agree and create account' }).click();

// Whatever a test shows, nothing the server wrote may be on the screen: the mock's messages all begin this way.
test.afterEach(async ({ page }) => {
  await expect(page.locator('body')).not.toContainText('Server said:');
});

test.describe('feedback: sign in', () => {
  test('too many tries pauses sign-in on a screen of its own, with the time when the server says it', async ({ page }) => {
    await mockApi(page, { rateLimited: { retryAfter: 600, exposed: true } });
    await signInWithPassword(page);

    await expect(heading(page, 'Sign-in is paused for a while.')).toBeFocused();
    await expect(page).toHaveTitle('Sign-in is paused for a while · Yahel');
    await expect(page).toHaveURL(at('/signin/password'));
    // The limit is on requests, not on one account: no address is named, and nothing is promised about a reset.
    await expect(page.getByRole('main')).toContainText('we’ve paused sign-in for a while');
    await expect(page.getByRole('main')).not.toContainText(credentials.email);
    await expect(page.getByRole('status')).toHaveText(/^You can try again at \d{2}:\d{2}\.$/);

    await page.getByRole('link', { name: 'Reset your password' }).click();
    await expect(page.getByRole('radiogroup', { name: 'Where to send the code' })).toBeVisible();
  });

  test('a pause whose length the browser cannot read gives no time, and leads back to sign in', async ({ page }) => {
    await mockApi(page, { rateLimited: { retryAfter: 600, exposed: false } });
    await signInWithPassword(page);

    await expect(heading(page, 'Sign-in is paused for a while.')).toBeFocused();
    await expect(page.getByRole('status')).toHaveText('Wait a few minutes, then try again.');
    await expect(page.getByRole('main')).not.toContainText('You can try again at');

    await page.getByRole('link', { name: 'Back to sign in' }).click();
    await expect(heading(page, 'Welcome back.')).toBeVisible();
  });

  test('a bare 403 after the password matched says only that the account cannot sign in, on the step', async ({ page }) => {
    await mockApi(page);
    await signInWithPassword(page, suspendedCredentials);

    const banner = page.getByRole('alert').filter({ hasText: 'This account can’t sign in right now' });
    await expect(banner).toBeVisible();
    await expect(page.getByRole('main')).not.toContainText('turned off');
    await expect(heading(page, 'Enter your password.')).toBeVisible();
    await expect(banner.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', 'https://yahel.example/help');
  });

  test('a suspended account is told so only after its password matched, with a way to another account', async ({ page }) => {
    const api = await mockApi(page);
    await openPasswordStep(page, suspendedCredentials.email);
    await password(page).fill('not its password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Without the password the answer is the same as for any address.
    await expect(password(page)).toHaveAccessibleDescription(/don’t match/);

    // The backend has no code for a suspended account yet (roadmap); the screen is shown only for that code.
    api.failNext('/v1/auth/login', 403, 'ACCOUNT_SUSPENDED');
    await password(page).fill(suspendedCredentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(heading(page, 'This account is turned off.')).toBeFocused();
    await expect(page).toHaveTitle('This account is turned off · Yahel');
    await expect(page.getByRole('main')).toContainText(`${suspendedCredentials.email} can’t sign in right now. Its mail and files are kept safe.`);
    await expect(page.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', 'https://yahel.example/help');

    await page.getByRole('link', { name: 'Use another account' }).click();
    await expect(heading(page, 'Welcome back.')).toBeVisible();
  });

  test('a paused organisation has its own screen', async ({ page }) => {
    const api = await mockApi(page);
    await openPasswordStep(page);
    api.failNext('/v1/auth/login', 403, 'TENANT_SUSPENDED');
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(heading(page, 'Your organisation is paused.')).toBeFocused();
    await expect(page.getByRole('main')).toContainText(`so ${credentials.email} can’t sign in right now. Nothing has been deleted.`);
    await page.getByRole('link', { name: 'Use another account' }).click();
    await expect(heading(page, 'Welcome back.')).toBeVisible();
  });

  test('a service down for maintenance says until when, and Try again brings the step back', async ({ page }) => {
    // The window ends two hours after it starts, so the time of day is pinned: run late in the evening it would
    // end tomorrow, and the screen rightly gives a date rather than a time (F-67).
    await page.clock.setFixedTime(new Date('2026-06-15T10:00:00'));
    const api = await mockApi(page);
    await openPasswordStep(page);
    api.failNext('/v1/auth/login', 503);
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(heading(page, 'Yahel is getting an upgrade.')).toBeFocused();
    await expect(page).toHaveTitle('Yahel is getting an upgrade · Yahel');
    await expect(page.getByRole('main')).toContainText(/We’ll be back by \d{2}:\d{2}\. Mail sent to you keeps arriving and nothing is lost\./);
    await expect(page.getByRole('status')).toContainText(/Planned maintenance runs from \d{2}:\d{2} to \d{2}:\d{2}\./);

    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page, 'Enter your password.')).toBeVisible();
    await expect(page).toHaveTitle('Enter your password · Yahel');
    await expect(page.getByRole('main').locator(':focus')).toHaveCount(1);
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();
  });

  test('single sign-on and a forced password change are banners that say what to do', async ({ page }) => {
    const api = await mockApi(page);
    await openPasswordStep(page);
    const attempt = async (answer: string) => {
      api.failNext('/v1/auth/login', 403, answer);
      await password(page).fill(credentials.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
    };

    await attempt('SSO_REQUIRED');
    await expect(page.getByRole('status').filter({ hasText: 'Your organisation signs you in with its own system' })).toContainText('Ask your administrator how to sign in.');

    await attempt('FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED');
    const banner = page.getByRole('alert').filter({ hasText: 'Choose a new password first' });
    await expect(banner).toBeVisible();
    await banner.getByRole('link', { name: 'Reset your password' }).click();
    await expect(page.getByRole('radiogroup', { name: 'Where to send the code' })).toBeVisible();
  });

  test('a failure on our side is a banner with the reference, and its Try again sends what was typed once more', async ({ page }) => {
    const api = await mockApi(page);
    await openPasswordStep(page);
    api.failNext('/v1/auth/login', 500);
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    const banner = page.getByRole('alert');
    await expect(banner).toContainText('Something went wrong on our side');
    await expect(banner).toContainText(`We couldn’t finish this step. Nothing was lost. Reference ${requestId}.`);
    await expect(password(page)).toHaveValue(credentials.password);

    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();
    expect(calls(api, '/v1/auth/login')).toHaveLength(2);
  });

  test('a slow answer is explained after a moment, and the explanation leaves with the wait', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/v1/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fallback();
    });
    await signInWithPassword(page);

    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible();
    await expect(page.getByText('Still working. Your connection seems slow, so this is taking longer than usual.')).toBeVisible();
    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();
    await expect(page.getByText('Still working.')).toHaveCount(0);
  });

  test('a device that goes offline is told at once, keeps what was typed, and is told when it is back', async ({ page }) => {
    await mockApi(page);
    await openPasswordStep(page);
    await password(page).fill(credentials.password);

    await setConnection(page, false);
    await expect(page.getByText('You’re offline. What you’ve typed is safe on this device. We’ll carry on when you’re back.')).toBeVisible();
    await page.getByRole('button', { name: 'Sign in' }).click();
    const banner = page.getByRole('alert');
    await expect(banner).toContainText('You’re offline');
    await expect(banner).toContainText('We couldn’t send this step because there’s no connection. Everything you typed is still here.');
    await expect(password(page)).toHaveValue(credentials.password);

    await setConnection(page, true);
    await expect(page.getByText('You’re back online.')).toBeVisible();
    await expect(page.getByText('What you’ve typed is safe on this device.')).toHaveCount(0);
    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect(heading(page, 'Welcome back, Amara.')).toBeVisible();
  });

  test('a field is not judged while it is first typed in, is checked on leaving, and is right the moment it is fixed', async ({ page }) => {
    await mockApi(page);
    await openEmailStep(page);
    const email = page.getByLabel('Email');

    await email.pressSequentially('amara@');
    await expect(page.getByText('That doesn’t look like an email address.')).toHaveCount(0);
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');

    await email.blur();
    await expect(email).toHaveAccessibleDescription('That doesn’t look like an email address.');
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    await email.pressSequentially('northwind');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await email.pressSequentially('.example');
    await expect(page.getByText('That doesn’t look like an email address.')).toHaveCount(0);
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    // The tick of a value that meets its format, inside the field.
    await expect(email.locator('xpath=..').locator('svg')).toBeVisible();
  });

  test('a reset code that can no longer work is said above the form, with a new one a press away', async ({ page }) => {
    const api = await mockApi(page);
    await openNewPasswordStep(page);
    api.failNext('/v1/auth/reset-password', 429, 'TOKEN_MAX_ATTEMPTS');
    await page.getByLabel('New password', { exact: true }).fill('Sunrise over Lekki 94!');
    await page.getByRole('button', { name: 'Save and sign in' }).click();

    await expect(heading(page, 'Enter the code.')).toBeVisible();
    const banner = page.getByRole('alert');
    await expect(banner).toContainText('This code no longer works');
    await expect(banner).toContainText('Get a new one and try again.');
    await banner.getByRole('button', { name: 'Send a new code' }).click();

    await expect(page.getByText('New code sent. Older codes no longer work.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(calls(api, '/v1/auth/forgot-password')).toHaveLength(2);
  });

  test('a new password the server will not take is said beside the field, which keeps focus', async ({ page }) => {
    const api = await mockApi(page);
    await openNewPasswordStep(page);
    api.failNext('/v1/auth/reset-password', 400, 'VALIDATION_ERROR');
    const field = page.getByLabel('New password', { exact: true });
    await field.fill('Sunrise over Lekki 94!');
    await page.getByRole('button', { name: 'Save and sign in' }).click();

    await expect(field).toHaveAccessibleDescription(/That password wasn’t accepted\. Use 8 or more characters/);
    await expect(field).toBeFocused();
    await expect(heading(page, 'Choose a new password.')).toBeVisible();

    // The refusal is about the value that was sent, so it goes when that is edited.
    await field.pressSequentially('!');
    await expect(page.getByText('That password wasn’t accepted.')).toHaveCount(0);
  });
});

test.describe('feedback: personal sign-up', () => {
  test('two problems on one step are summed up above the form, and focus goes to the first', async ({ page }) => {
    await mockApi(page);
    await signUpTo(page, 'name');
    await page.getByLabel('Last name').fill('x'.repeat(51));
    await proceed(page);

    const banner = page.getByRole('alert');
    await expect(banner).toContainText('2 things to fix before you continue');
    await expect(banner).toContainText('First name and Last name.');
    await expect(page.getByLabel('First name')).toBeFocused();

    // One problem left is told beside its field only.
    await page.getByLabel('First name').fill('Amara');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('Use 50 characters or fewer.')).toBeVisible();
  });

  test('an age the server refuses is said beside the year, on the step that asked', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');
    api.failNext('/v1/auth/register', 403, 'USER_UNDERAGE');
    await create(page);

    await expect(heading(page, 'A little about you.')).toBeVisible();
    await expect(page.getByLabel('Year')).toHaveAccessibleDescription(/You need to be older to have a Yahel account\. Check your date of birth\./);
    await expect(page.getByLabel('Year')).toBeFocused();
  });

  test('an email that is not a personal one is said beside the field, without a word about accounts', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review', { address: 'own' });
    api.failNext('/v1/auth/register', 400, 'PERSONAL_SIGNUP_REQUIRES_PUBLIC_EMAIL');
    await create(page);

    await expect(heading(page, 'Use your current email.')).toBeVisible();
    const field = page.getByLabel('Your email address');
    await expect(field).toHaveAccessibleDescription(/Use a personal email address, such as one from Gmail or Outlook, or get a Yahel address instead\./);
    await expect(field).toBeFocused();
    await expect(page.getByRole('main')).not.toContainText('already');
  });

  test('a texted code that can no longer work is said above the form, with a new one a press away', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'done', { phone: true, recoveryEmail: false });
    await heading(page, 'Enter the code.').waitFor();
    api.failNext('/v1/auth/phone/verify', 429, 'TOKEN_MAX_ATTEMPTS');
    await code(page).fill('zzzzzz');

    const banner = page.getByRole('alert');
    await expect(banner).toContainText('This code no longer works');
    await banner.getByRole('button', { name: 'Send a new code' }).click();
    await expect(page.getByText('New code sent. Older codes no longer work.')).toBeVisible();
    expect(calls(api, '/v1/auth/phone/send-otp')).toHaveLength(2);

    await code(page).clear();
    await code(page).fill(phoneCode);
    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
  });

  test('too many tries on a code counts down when the server says how long', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'done', { phone: true, recoveryEmail: false });
    await heading(page, 'Enter the code.').waitFor();
    api.failNext('/v1/auth/phone/verify', 429, undefined, { retryAfter: 45, exposed: true });
    await code(page).fill(phoneCode);

    const banner = page.getByRole('alert');
    await expect(banner).toContainText('Too many tries');
    await expect(banner).toContainText(/Try again in 0:[34]\d\./);
    const first = await banner.textContent();
    await expect(banner).not.toHaveText(first ?? '');
    // What was typed is still there for when the wait is over.
    await expect(code(page)).toHaveValue(phoneCode);
  });

  test('details the server refuses are a banner on the failed screen, with the way back to the review', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');
    api.failNext('/v1/auth/register', 422, 'VALIDATION_ERROR');
    await create(page);

    await expect(heading(page, 'We couldn’t finish.')).toBeVisible();
    const banner = page.getByRole('alert');
    await expect(banner).toContainText('Some of your details weren’t accepted');
    await expect(banner).toContainText('Nothing was created. Go back to the review and check them.');
    await banner.getByRole('link', { name: 'Back to review' }).click();
    await expect(heading(page, 'Everything look right?')).toBeVisible();
    await expect(page.getByText(person.address)).toBeVisible();
  });

  test('maintenance met while creating is a screen of its own, and trying again does not create a second account', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'review');
    api.failNext('/v1/auth/login', 503);
    await create(page);

    await expect(heading(page, 'Yahel is getting an upgrade.')).toBeFocused();
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(heading(page, 'You’re in, Amara.')).toBeVisible();
    expect(calls(api, '/v1/auth/register')).toHaveLength(1);
  });

  test('a session that ended is a screen that leads to signing in again', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'done', { phone: true, recoveryEmail: false });
    await heading(page, 'Enter the code.').waitFor();
    api.failNext('/v1/auth/phone/verify', 401, 'SESSION_EXPIRED');
    api.failNext('/v1/auth/refresh', 401, 'INVALID_TOKEN');
    await code(page).fill(phoneCode);

    await expect(heading(page, 'Your session has ended.')).toBeFocused();
    await expect(page).toHaveTitle('Your session has ended · Yahel');
    await expect(page.getByRole('main')).toContainText('Sign in again to carry on.');
    // Nobody is signed in any more, so the header must not say someone is.
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);
    await page.getByRole('link', { name: 'Sign in again' }).click();
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Choose an account\.|Welcome back\./);
  });

  test('a session the server ended everywhere says so', async ({ page }) => {
    const api = await mockApi(page);
    await signUpTo(page, 'done', { phone: true, recoveryEmail: false });
    await heading(page, 'Enter the code.').waitFor();
    api.failNext('/v1/auth/phone/verify', 401, 'SESSION_EXPIRED');
    api.failNext('/v1/auth/refresh', 401, 'TOKEN_REUSE_DETECTED');
    await code(page).fill(phoneCode);

    await expect(heading(page, 'We signed you out everywhere.')).toBeFocused();
    await expect(page.getByRole('status')).toHaveText('If this wasn’t you, change your password after you sign in.');
    await expect(page.getByRole('button', { name: /^Account: / })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Sign in again' })).toBeVisible();
  });
});
