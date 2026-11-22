import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { accountsUrl, at, openCodeStep, openEmailStep, openHelpStep, openNewPasswordStep, openPasswordStep, openBrokenStep, openRecoverCodeStep, openRecoverStep, signInWithPassword, stubPasskeys } from './support/accounts';
import { backupCode, credentials, mockApi, resetCode, secondStepCode, twoStepCredentials } from './support/api';

const newPassword = 'Sunrise over Lekki 94!';
const password = (page: Page) => page.getByLabel('Password', { exact: true });
const loginCalls = (api: Awaited<ReturnType<typeof mockApi>>) => api.calls.filter((call) => call.path === '/v1/auth/login');

test.describe('accounts: sign in with a password', () => {
  test('email, then password, then signed in', async ({ page }) => {
    const api = await mockApi(page);
    await signInWithPassword(page);

    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
    await expect(page).toHaveURL(at('/signin/done'));
    await expect(page.getByText(credentials.email)).toBeVisible();
    expect(loginCalls(api)).toHaveLength(1);
    expect(loginCalls(api)[0]!.body).toMatchObject({ email: credentials.email, password: credentials.password });
  });

  test('a wrong password reads the same as an unknown address, and keeps what was typed', async ({ page }) => {
    await mockApi(page);
    const messages: string[] = [];
    for (const email of [credentials.email, 'nobody@nowhere.example']) {
      await openPasswordStep(page, email);
      await password(page).fill('not the password');
      await page.getByRole('button', { name: 'Sign in' }).click();
      // Said beside the field it is about, which is marked invalid and takes focus.
      await expect(password(page)).toHaveAccessibleDescription(/don’t match/);
      await expect(password(page)).toHaveAttribute('aria-invalid', 'true');
      await expect(password(page)).toBeFocused();
      messages.push((await password(page).evaluate((field) => document.getElementById(field.getAttribute('aria-describedby')?.split(' ')[0] ?? '')?.textContent)) ?? '');
      await expect(password(page)).toHaveValue('not the password');
      await expect(page).toHaveURL(at('/signin/password'));
    }
    expect(messages[0]).toBe(messages[1]);
  });

  test('an empty email or password is explained beside the field and sends nothing', async ({ page }) => {
    const api = await mockApi(page);
    await openEmailStep(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Enter your email.')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeFocused();

    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('That doesn’t look like an email address.')).toBeVisible();

    await page.getByLabel('Email').fill(credentials.email);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter your password.', { exact: true }).last()).toBeVisible();
    await expect(password(page)).toBeFocused();
    expect(loginCalls(api)).toHaveLength(0);
  });

  test('a lost connection is reported plainly and the attempt can be repeated', async ({ page }) => {
    const api = await mockApi(page, { offline: true });
    await signInWithPassword(page);

    // No answer while the browser says it is online: told on the step, which stays as it was.
    await expect(page.getByRole('alert').filter({ hasText: 'We can’t reach Yahel right now' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Enter your password.' })).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => loginCalls(api).length).toBe(2);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  test('too many attempts is reported plainly', async ({ page }) => {
    await mockApi(page, { rateLimited: true });
    await signInWithPassword(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Sign-in is paused for a while.' })).toBeFocused();
    await expect(page.getByRole('main')).toContainText(`we’ve paused sign-in for ${credentials.email} for a while`);
  });

  test('pressing Sign in twice sends one request', async ({ page }) => {
    const api = await mockApi(page);
    await openPasswordStep(page);
    await password(page).fill(credentials.password);

    await page.getByRole('button', { name: 'Sign in' }).dblclick();

    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
    expect(loginCalls(api)).toHaveLength(1);
  });

  test('the password can be shown and hidden, and is hidden again on submit', async ({ page }) => {
    await mockApi(page);
    await openPasswordStep(page);
    await password(page).fill('not the password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password(page)).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(password(page)).toHaveAccessibleDescription(/don’t match/);
    await expect(password(page)).toHaveAttribute('type', 'password');
    await expect(password(page)).toHaveValue('not the password');
  });

  test('nothing sensitive reaches the address bar or web storage', async ({ page }) => {
    await mockApi(page);
    const seen: string[] = [];
    page.on('framenavigated', (frame) => seen.push(frame.url()));
    await openCodeStep(page);
    await page.getByLabel('6-digit code').fill(secondStepCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Kofi.' })).toBeVisible();

    const addresses = seen.join(' ');
    for (const secret of [twoStepCredentials.password, encodeURIComponent(twoStepCredentials.password), secondStepCode, twoStepCredentials.email, encodeURIComponent(twoStepCredentials.email), 'challenge-']) {
      expect(addresses).not.toContain(secret);
    }
    const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    for (const secret of [twoStepCredentials.password, secondStepCode, 'access-', 'challenge-']) expect(stored).not.toContain(secret);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['yahel.device-id']);
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual(['yahel.refresh-token']);
  });

  test('says it is showing demo data while stand-ins are on', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/signin'));

    await expect(page.getByRole('note')).toHaveText('Demo data');
    await signInWithPassword(page);
    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
    await expect(page.getByRole('note')).toHaveText('Demo data');
  });
});

test.describe('accounts: two-step sign-in', () => {
  test('a code from the authenticator app completes sign-in', async ({ page }) => {
    const api = await mockApi(page);
    await openCodeStep(page);
    await expect(page).toHaveURL(at('/signin/code'));

    await page.getByLabel('6-digit code').fill(secondStepCode);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome back, Kofi.' })).toBeVisible();
    const challenge = api.calls.find((call) => call.path === '/v1/auth/mfa/challenge');
    expect(challenge!.body).toMatchObject({ challengeToken: 'challenge-1', code: secondStepCode, trustDevice: false });
  });

  test('an incomplete or wrong code is explained, and spaces in a code are ignored', async ({ page }) => {
    await mockApi(page);
    await openCodeStep(page);
    const code = page.getByLabel('6-digit code');
    await expect(code).toHaveAttribute('autocomplete', 'one-time-code');

    await code.fill('4829');
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('Enter all 6 digits.')).toBeVisible();

    // Typed or pasted with spaces, the code still lands as six digits.
    await code.fill('000 000');
    await expect(code).toHaveValue('000000');
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(code).toHaveAccessibleDescription(/That code didn’t work/);
    await expect(code).toBeFocused();
    await expect(page).toHaveURL(at('/signin/code'));
  });

  test('sign-in by a texted code', async ({ page }) => {
    await mockApi(page);
    await openCodeStep(page);

    await page.getByRole('button', { name: 'Text me a code instead' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'We texted a code to +234' })).toBeVisible();

    await page.getByLabel('6-digit code').fill(secondStepCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Kofi.' })).toBeVisible();
  });

  test('sign-in by a backup code', async ({ page }) => {
    await mockApi(page);
    await openCodeStep(page);

    await page.getByRole('button', { name: 'Use a backup code' }).click();
    await page.getByLabel('Backup code').fill(backupCode);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome back, Kofi.' })).toBeVisible();
  });

  test('too many wrong codes ends the attempt with a way forward', async ({ page }) => {
    await mockApi(page);
    await openCodeStep(page);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await page.getByLabel('6-digit code').fill(`00000${attempt}`);
      await page.getByRole('button', { name: 'Verify' }).click();
      await expect(page.getByRole('button', { name: 'Verify' })).toBeEnabled();
      await expect(attempt < 4 ? page.getByLabel('6-digit code') : page.getByRole('alert')).toBeVisible();
      if (attempt < 4) await expect(page.getByLabel('6-digit code')).toHaveAccessibleDescription(/That code didn’t work/);
    }

    await expect(page.getByRole('alert')).toContainText('This code no longer works');
    await expect(page.getByRole('alert')).toContainText('Sign in again to use a new one.');
    await page.getByRole('alert').getByRole('link', { name: 'Sign in again' }).click();
    await expect(page.getByRole('heading', { name: 'Enter your password.' })).toBeVisible();
  });
});

test.describe('accounts: sign in with a passkey', () => {
  test('the device confirms and the person is signed in', async ({ page }) => {
    await mockApi(page);
    await stubPasskeys(page, 'success');
    await openEmailStep(page);

    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm it’s you.' })).toBeVisible();
    await expect(page.getByText('Waiting for this device')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
    await expect(page).toHaveURL(at('/signin/done'));
  });

  test('closing the prompt is not an error: try again or use the password', async ({ page }) => {
    await mockApi(page);
    await stubPasskeys(page, 'cancelled');
    await openEmailStep(page);
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();

    await expect(page.getByText('The passkey prompt was closed before it finished.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled();

    await page.getByRole('link', { name: 'Use my password instead' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('a device without passkeys is never offered one', async ({ page }) => {
    await mockApi(page);
    await stubPasskeys(page, 'unsupported');
    await openPasswordStep(page);

    await expect(page.getByRole('button', { name: 'Use a passkey' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Back' }).click();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with a passkey' })).toHaveCount(0);

    await page.goto(at('/signin/passkey'));
    await expect(page).toHaveURL(at('/signin/choose'));
  });

  test('a passkey can be used from the password step, for the account already named', async ({ page }) => {
    await mockApi(page);
    await stubPasskeys(page, 'success');
    await openPasswordStep(page);

    await page.getByRole('button', { name: 'Use a passkey' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
  });
});

test.describe('accounts: account chooser', () => {
  test('lists the accounts on this device and continues as the one picked', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/signin'));
    await expect(page).toHaveURL(at('/signin/choose'));

    const list = page.getByRole('list', { name: 'Accounts on this device' });
    await expect(list.getByRole('listitem')).toHaveCount(3);
    await expect(list).toContainText('Northwind Studio');

    await page.getByRole('button', { name: new RegExp(`^Continue as .*${credentials.email}`) }).click();
    await expect(page.getByRole('heading', { name: 'Enter your password.' })).toBeVisible();
    await expect(page.getByText(credentials.email)).toBeVisible();
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
  });

  test('an account can be removed from this device; removing the last leaves the chooser', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/signin'));
    await page.getByRole('button', { name: 'Remove an account' }).click();

    await page.getByRole('button', { name: `Remove ${credentials.email} from this device` }).click();
    await expect(page.getByRole('status').filter({ hasText: `${credentials.email} removed from this device.` })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Accounts on this device' }).getByRole('listitem')).toHaveCount(2);

    await page.getByRole('button', { name: /^Remove amara\.okafor/ }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await expect(page).toHaveURL(at('/signin/email'));
    await expect(page.getByRole('link', { name: 'Back' })).toHaveCount(0);
  });

  test('signing out returns to the chooser with the account marked signed out', async ({ page }) => {
    const api = await mockApi(page);
    await signInWithPassword(page);
    await page.getByRole('heading', { name: 'Welcome back, Amara.' }).waitFor();

    await page.getByRole('button', { name: 'Use another account' }).click();

    await expect(page.getByRole('heading', { name: 'Choose an account.' })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^Continue as .*${credentials.email}`) })).toContainText('Signed out');
    expect(api.calls.some((call) => call.path === '/v1/auth/logout')).toBe(true);
    expect(await page.evaluate(() => sessionStorage.getItem('yahel.refresh-token'))).toBeNull();
  });
});

test.describe('accounts: recovery', () => {
  test('email, code, new password, signed in', async ({ page }) => {
    const api = await mockApi(page);
    await openRecoverStep(page);
    await expect(page.getByRole('radio', { name: 'Email a•••@northwind.example' })).toBeVisible();
    await expect(page.getByText('Yahel will never ask for your password')).toBeVisible();

    await page.getByRole('radio', { name: /^Email/ }).check();
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByRole('heading', { name: 'Enter the code.' })).toBeVisible();
    expect(api.calls.find((call) => call.path === '/v1/auth/forgot-password')!.body).toEqual({ email: credentials.email });

    await page.getByLabel('6-character code').fill(resetCode);
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.getByLabel('New password', { exact: true }).fill(newPassword);
    await expect(page.getByText(/Strong · 22 characters/)).toBeVisible();
    await page.getByRole('button', { name: 'Save and sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
    expect(api.calls.find((call) => call.path === '/v1/auth/reset-password')!.body).toEqual({ email: credentials.email, token: resetCode, password: newPassword });
    expect(loginCalls(api).at(-1)!.body).toMatchObject({ email: credentials.email, password: newPassword });
  });

  test('recovery answers the same for an address with no account', async ({ page }) => {
    await mockApi(page);
    await openPasswordStep(page, 'nobody@nowhere.example');
    await page.getByRole('link', { name: 'Forgot password?' }).click();

    await expect(page.getByRole('radio', { name: 'Email n•••@nowhere.example' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^Text \+234/ })).toBeVisible();
    await page.getByRole('radio', { name: /^Email/ }).check();
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByRole('heading', { name: 'Enter the code.' })).toBeVisible();
  });

  test('a wrong code is caught when the password is saved, and a new one can be sent', async ({ page }) => {
    const api = await mockApi(page);
    await page.clock.install();
    await openRecoverCodeStep(page);
    await page.getByLabel('6-character code').fill('WRONG1');
    await page.getByRole('button', { name: 'Verify' }).click();
    await page.getByLabel('New password', { exact: true }).fill(newPassword);
    await page.getByRole('button', { name: 'Save and sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Enter the code.' })).toBeVisible();
    await expect(page.getByLabel('6-character code')).toHaveAccessibleDescription(/That code didn’t work or has expired/);
    await expect(page.getByLabel('6-character code')).toBeFocused();
    expect(loginCalls(api)).toHaveLength(0);

    // A code has just been sent, so another can be asked for only after the pause.
    await expect(page.getByRole('button', { name: /^Send a new code in 0:\d\d$/ })).toHaveAttribute('aria-disabled', 'true');
    await page.clock.fastForward(31_000);
    await page.getByRole('button', { name: 'Send a new code', exact: true }).click();
    await expect(page.getByText('New code sent. Older codes no longer work.')).toBeVisible();
    expect(api.calls.filter((call) => call.path === '/v1/auth/forgot-password')).toHaveLength(2);
  });

  test('a new password that breaks the rules is explained before anything is sent', async ({ page }) => {
    const api = await mockApi(page);
    await openNewPasswordStep(page);

    await expect(page.getByText('At least 8 characters, with a capital letter, a lowercase letter, a number and a symbol.')).toBeVisible();
    await page.getByRole('button', { name: 'Save and sign in' }).click();
    await expect(page.getByText('Create a password.')).toBeVisible();

    await page.getByLabel('New password', { exact: true }).fill('short');
    await expect(page.getByText('Use 8 or more characters, with a capital letter, a number and a symbol.')).toBeVisible();

    await page.getByLabel('New password', { exact: true }).fill('sunrise over lekki');
    await page.getByRole('button', { name: 'Save and sign in' }).click();
    await expect(page.getByText('Add a capital letter and a number.')).toBeVisible();
    expect(api.calls.filter((call) => call.path === '/v1/auth/reset-password')).toHaveLength(0);
  });
});

test.describe('accounts: help', () => {
  test('someone who forgot their email can ask for help and return to sign-in', async ({ page }) => {
    await mockApi(page);
    await openHelpStep(page);

    await page.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByText('Enter an email or phone number.')).toBeVisible();

    await page.getByLabel('Email or phone we can reach you on').fill('amara@personal.example');
    await page.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByRole('heading', { name: 'We’re on it.' })).toBeVisible();
    await expect(page).toHaveURL(at('/signin/help-sent'));

    await page.getByRole('link', { name: 'Back to sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  });

  test('help is reachable from recovery when neither destination can be used', async ({ page }) => {
    await mockApi(page);
    await openRecoverStep(page);

    await page.getByRole('link', { name: 'I can’t use either of these' }).click();

    await expect(page.getByRole('heading', { name: 'Let’s find your account.' })).toBeVisible();
    await page.getByRole('link', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Let’s get you back in.' })).toBeVisible();
  });
});

test.describe('accounts: addresses, history and reload', () => {
  test('every step has its own address and Back and Forward move between them', async ({ page }) => {
    await mockApi(page);
    await openPasswordStep(page);
    await expect(page).toHaveURL(at('/signin/password'));

    await page.goBack();
    await expect(page).toHaveURL(at('/signin/email'));
    await expect(page.getByLabel('Email')).toHaveValue(credentials.email);

    await page.goForward();
    await expect(page).toHaveURL(at('/signin/password'));
    await expect(page.getByRole('heading', { name: 'Enter your password.' })).toBeVisible();

    await page.getByRole('link', { name: 'Back' }).click();
    await expect(page).toHaveURL(at('/signin/email'));
  });

  test('a reload mid-flow lands on the first step, never on one whose data is gone', async ({ page }) => {
    await mockApi(page);
    await openCodeStep(page);

    await page.reload();

    await expect(page).toHaveURL(at('/signin/choose'));
    await expect(page.getByRole('heading', { name: 'Choose an account.' })).toBeVisible();
  });

  for (const step of ['password', 'code', 'passkey', 'recover', 'recover-code', 'new-password', 'help-sent', 'done']) {
    test(`opening /signin/${step} directly goes to a step that can be shown`, async ({ page }) => {
      await mockApi(page);
      await page.goto(at(`/signin/${step}`));

      await expect(page).toHaveURL(at(step === 'help-sent' ? '/signin/help' : '/signin/choose'));
    });
  }

  test('once signed in, a reload and every earlier step lead to Done', async ({ page }) => {
    const api = await mockApi(page);
    await signInWithPassword(page);
    await page.getByRole('heading', { name: 'Welcome back, Amara.' }).waitFor();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
    expect(api.calls.filter((call) => call.path === '/v1/auth/refresh')).toHaveLength(1);

    await page.goBack();
    await expect(page).toHaveURL(at('/signin/done'));
    await page.goto(at('/signin/password'));
    await expect(page).toHaveURL(at('/signin/done'));
  });

  test('the root address and unknown addresses are handled', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/'));
    await expect(page).toHaveURL(at('/signin/choose'));

    await page.goto(at('/nowhere'));
    await expect(page.getByRole('heading', { name: 'That page isn’t here.' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Choose an account.' })).toBeVisible();
  });

  test('focus moves into each new step', async ({ page, isMobile }) => {
    await mockApi(page);
    await page.goto(at('/signin'));
    await expect(page.getByRole('heading', { name: 'Choose an account.' })).toBeFocused();

    await page.getByRole('button', { name: 'Use another account' }).click();
    // A keyboard is likely on desktop, so typing can start at once; on touch the heading takes focus.
    await expect(isMobile ? page.getByRole('heading', { name: 'Welcome back.' }) : page.getByLabel('Email')).toBeFocused();

    await page.getByLabel('Email').fill(credentials.email);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(isMobile ? page.getByRole('heading', { name: 'Enter your password.' }) : password(page)).toBeFocused();
  });
});

test.describe('accounts: where sign-in leads', () => {
  const appUrl = 'http://localhost:5173/';

  const finish = async (page: Page, query: string) => {
    await mockApi(page);
    await page.route(`${appUrl}**`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>App</title>' }));
    await page.route('https://evil.example/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Evil</title>' }));
    await signInWithPassword(page, credentials, query);
    await page.getByRole('heading', { name: 'Welcome back, Amara.' }).waitFor();
    await page.getByRole('button', { name: 'Continue to Yahel' }).click();
    await page.waitForURL((url) => url.origin !== accountsUrl);
    return page.url();
  };

  test('goes to the app when no address was asked for', async ({ page }) => {
    expect(await finish(page, '')).toBe(appUrl);
  });

  test('returns to an allowed address, carried through every step', async ({ page }) => {
    const wanted = `${appUrl}account?tab=security`;
    expect(await finish(page, `?return=${encodeURIComponent(wanted)}`)).toBe(wanted);
  });

  for (const [name, address] of [
    ['another site', 'https://evil.example/steal'],
    ['a look-alike of the app', 'http://localhost:5173.evil.example/'],
    ['credentials before the host', 'http://localhost:5173@evil.example/'],
    ['a script address', 'javascript:alert(document.domain)'],
    ['a protocol-relative address', '//evil.example/'],
    ['backslashes', 'https:\\\\evil.example'],
  ]) {
    test(`ignores a return address that is ${name}`, async ({ page }) => {
      expect(await finish(page, `?return=${encodeURIComponent(address!)}`)).toBe(appUrl);
    });
  }
});

test.describe('accounts: keyboard only', () => {
  test('sign in with a password and a second step without touching the mouse', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await mockApi(page);
    await page.goto(at('/signin'));
    await page.getByRole('heading', { name: 'Choose an account.' }).waitFor();

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Use another account' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByLabel('Email')).toBeFocused();
    await page.keyboard.type(twoStepCredentials.email);
    await page.keyboard.press('Enter');

    await expect(password(page)).toBeFocused();
    await page.keyboard.type(twoStepCredentials.password);
    await page.keyboard.press('Enter');

    await expect(page.getByLabel('6-digit code')).toBeFocused();
    await page.keyboard.type(secondStepCode);
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Welcome back, Kofi.' })).toBeFocused();
  });

  test('recovery from the password step to signed in without touching the mouse', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await mockApi(page);
    await openPasswordStep(page);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeFocused();
    await page.keyboard.press('Enter');

    // The destinations arrive after the step does, so focus starts on the heading and Tab reaches the choices.
    await expect(page.getByRole('heading', { name: 'Let’s get you back in.' })).toBeFocused();
    await page.getByRole('radiogroup', { name: 'Where to send the code' }).waitFor();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: /^Text/ })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: /^Email/ })).toBeChecked();
    await page.keyboard.press('Enter');

    await expect(page.getByLabel('6-character code')).toBeFocused();
    await page.keyboard.type(resetCode);
    await page.keyboard.press('Enter');

    await expect(page.getByLabel('New password', { exact: true })).toBeFocused();
    await page.keyboard.type(newPassword);
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
  });

  test('every control shows a visible focus ring', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await mockApi(page);
    await openPasswordStep(page);

    const ringOfFocused = () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return { name: document.activeElement!.textContent, style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), colour: style.outlineColor };
      });
    await expect(password(page)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    const rings = [await ringOfFocused()];
    await page.keyboard.press('Tab');
    for (let stop = 0; stop < 3; stop += 1) {
      await page.keyboard.press('Tab');
      rings.push(await ringOfFocused());
    }

    expect(rings.map((ring) => ring.name)).toEqual(['Back', 'Show', 'Sign in', 'Forgot password?']);
    for (const ring of rings) {
      expect(ring.style).toBe('solid');
      expect(ring.width).toBeGreaterThanOrEqual(2);
      expect(ring.colour).not.toMatch(/rgba\(.*, 0\)|transparent/);
    }

    await password(page).focus();
    const frame = await password(page).evaluate((el) => getComputedStyle(el.parentElement!).boxShadow);
    expect(frame).not.toBe('none');
  });
});

test.describe('accounts: leaving a step while its request is running', () => {
  /** The first request to `path` hangs for a moment and then drops; later ones reach the mock. */
  const dropFirstSlowly = async (page: Page, path: string) => {
    let first = true;
    await page.route(`**/api${path}`, async (route) => {
      if (!first) return route.fallback();
      first = false;
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.abort('internetdisconnected');
    });
  };

  test('Sign in still works after going back mid-request and returning', async ({ page }) => {
    await mockApi(page);
    await dropFirstSlowly(page, '/v1/auth/login');
    await openPasswordStep(page);
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible();

    await page.getByRole('link', { name: 'Back' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Enter your password.' })).toBeVisible();

    // The dropped request belongs to the visit that was left, so its failure is not shown here.
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await password(page).fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
  });

  test('Send code still works after going back mid-request and returning', async ({ page }) => {
    const api = await mockApi(page);
    await dropFirstSlowly(page, '/v1/auth/forgot-password');
    await openRecoverStep(page);
    await page.getByRole('radio', { name: /^Email/ }).check();
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByRole('button', { name: 'Sending…' })).toBeVisible();

    await page.getByRole('link', { name: 'Back' }).click();
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page.getByRole('button', { name: 'Send code' })).toBeVisible();

    await page.getByRole('radio', { name: /^Email/ }).check();
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByRole('heading', { name: 'Enter the code.' })).toBeVisible();
    // The dropped request never reached the backend; the one after the return did.
    expect(api.calls.filter((call) => call.path === '/v1/auth/forgot-password')).toHaveLength(1);
  });
});

test.describe('accounts: when things go wrong after the hard part', () => {
  test('a reset that worked is not undone by a sign-in that failed', async ({ page }) => {
    const api = await mockApi(page);
    await openNewPasswordStep(page);
    let dropped = false;
    await page.route('**/api/v1/auth/login', (route) => {
      if (dropped) return route.fallback();
      dropped = true;
      return route.abort('internetdisconnected');
    });
    await page.getByLabel('New password', { exact: true }).fill(newPassword);
    await page.getByRole('button', { name: 'Save and sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Enter your password.' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Your new password is saved');
    await expect(page).toHaveURL(at('/signin/password'));

    await password(page).fill(newPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.' })).toBeVisible();
    expect(api.calls.filter((call) => call.path === '/v1/auth/reset-password')).toHaveLength(1);

    await page.goBack();
    await expect(page).toHaveURL(at('/signin/done'));
  });

  test('an expired second step sends the person to sign in again, with the reason', async ({ page }) => {
    await mockApi(page);
    await openCodeStep(page);
    await page.route('**/api/v1/auth/mfa/challenge', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'INVALID_TOKEN', message: 'Invalid or expired token', meta: { requestId: 'e2e' } }) }),
    );

    await page.getByLabel('6-digit code').fill(secondStepCode);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByRole('heading', { name: 'Enter your password.' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('That took too long');
    await page.goForward();
    await expect(page).toHaveURL(at('/signin/password'));
  });
});

test.describe('accounts: page furniture', () => {
  test('each step names itself in the page title', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/signin'));
    await expect(page).toHaveTitle('Choose an account · Yahel');

    await page.getByRole('button', { name: 'Use another account' }).click();
    await expect(page).toHaveTitle('Welcome back · Yahel');

    await page.getByLabel('Email').fill(credentials.email);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveTitle('Enter your password · Yahel');
  });

  test('the browser chrome colour follows the theme switch', async ({ page }) => {
    await mockApi(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(at('/signin'));
    const themeColour = page.locator('meta[name="theme-color"]');
    const canvas = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ws-color-daylight-canvas').trim());

    await expect(themeColour).toHaveAttribute('content', await canvas());
    const light = await themeColour.getAttribute('content');

    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(themeColour).not.toHaveAttribute('content', light!);
    await expect(themeColour).toHaveAttribute('content', await canvas());
  });

  test('the brand link returns to the start without reloading the page', async ({ page }) => {
    await mockApi(page);
    await openPasswordStep(page);
    await page.evaluate(() => ((window as unknown as { stillHere: boolean }).stillHere = true));

    await page.getByRole('link', { name: 'Yahel sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Choose an account.' })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { stillHere?: boolean }).stillHere)).toBe(true);
  });

  test('a passkey is offered wherever the browser supports them, built-in authenticator or not', async ({ page }) => {
    await mockApi(page);
    // A browser that has WebAuthn but no fingerprint or face reader of its own: the passkey may be on a
    // phone or a security key. It is described here rather than taken from the test browser, because not
    // every engine's test build exposes WebAuthn at all.
    await page.addInitScript(() => {
      class PublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable = async () => false;
      }
      Object.defineProperty(window, 'PublicKeyCredential', { configurable: true, value: PublicKeyCredential });
      Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get: async () => null } });
    });
    await openEmailStep(page);

    expect(await page.evaluate(() => (window.PublicKeyCredential as unknown as { isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean> }).isUserVerifyingPlatformAuthenticatorAvailable())).toBe(false);
    await expect(page.getByRole('button', { name: 'Sign in with a passkey' })).toBeVisible();
  });

  test('focus moves to the next row after an account is removed', async ({ page }) => {
    await mockApi(page);
    await page.goto(at('/signin'));
    await page.getByRole('button', { name: 'Remove an account' }).click();

    await page.getByRole('button', { name: /^Remove amara\.okafor/ }).click();

    await expect(page.getByRole('list', { name: 'Accounts on this device' }).getByRole('listitem')).toHaveCount(2);
    await expect(page.getByRole('button', { name: `Remove ${credentials.email} from this device` })).toBeFocused();
  });
});

test.describe('accounts: when a screen fails', () => {
  test('a step that fails to show is replaced by a styled message, and Try again brings the step back', async ({ page }) => {
    await mockApi(page);
    const logged: string[] = [];
    page.on('console', (message) => void (message.type() === 'error' ? logged.push(message.text()) : null));
    await openBrokenStep(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Something went wrong on our side.' })).toBeFocused();
    await expect(page.getByText('If you contact us, quote this')).toBeVisible();
    await expect(page.getByRole('term')).toHaveText('Time');
    await expect(page.getByRole('img', { name: 'Yahel' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toContainText('Your data stays in Africa.');
    await expect(page.getByRole('main')).not.toContainText('A step failed while it was being shown');
    expect(logged.join(' ')).toContain('A step failed while it was being shown');

    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.getByRole('heading', { name: 'Enter your password.' })).toBeVisible();
    await expect(page.getByText(credentials.email)).toBeVisible();
  });

  test('the way back from a failed step leads to the start of sign in', async ({ page }) => {
    await mockApi(page);
    await openBrokenStep(page);

    await page.getByRole('link', { name: 'Back to sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Choose an account.' })).toBeVisible();
  });
});
