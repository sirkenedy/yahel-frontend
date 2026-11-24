import type { Page } from '@playwright/test';
import type { Screen } from './accounts-screens';
import { emailCode, phoneCode, requestId } from './api';
import { heading, person, signUp, signUpTo, signUpToPasskeyOffer } from './personal';
import { accountsUrl } from './accounts';

const proceed = (page: Page, name = 'Continue') => page.getByRole('button', { name, exact: true }).click();

/** Answers requests to `path` the way the backend would refuse them. Registered after the mock, so it is asked first. */
const refuse = (page: Page, path: string, status: number, code: string, headers?: Record<string, string>) =>
  page.route(`**/api/v1${path}`, (route) =>
    route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify({ success: false, error: { code, message: `Server said: ${code}` }, meta: { requestId } }) }),
  );

const openTextedCode = async (page: Page) => {
  await signUpTo(page, 'done', { phone: true, recoveryEmail: false });
  await heading(page, 'Enter the code.').waitFor();
};

const verifyRefused = (shown: string, status: number, code: string, refresh?: string, headers?: Record<string, string>) => async (page: Page) => {
  await openTextedCode(page);
  await refuse(page, '/auth/phone/verify', status, code, headers);
  if (refresh) await refuse(page, '/auth/refresh', 401, refresh);
  await page.getByLabel('6-character code').fill(phoneCode);
  await proceed(page, 'Verify');
  await page.getByText(shown).first().waitFor();
};

/** The whole-screen and inline feedback states of personal sign-up, each reached by the server answer that leads to it. */
const feedbackScreens: Screen[] = [
  {
    name: 'personal name, two things to fix',
    open: async (page) => {
      await signUpTo(page, 'name');
      await page.getByLabel('Last name').fill('x'.repeat(51));
      await proceed(page);
      await page.getByText('2 things to fix before you continue').waitFor();
    },
  },
  { name: 'personal state: session ended', open: verifyRefused('Your session has ended.', 401, 'SESSION_EXPIRED', 'INVALID_TOKEN') },
  { name: 'personal state: signed out everywhere', open: verifyRefused('We signed you out everywhere.', 401, 'SESSION_EXPIRED', 'TOKEN_REUSE_DETECTED') },
  {
    name: 'personal texted code, too many tries, counting down',
    open: verifyRefused('Try again in', 429, 'BAD_REQUEST', undefined, { 'Retry-After': '590', 'Access-Control-Allow-Origin': accountsUrl, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Expose-Headers': 'Retry-After' }),
  },
  { name: 'personal texted code, refused beside the code', open: verifyRefused('That code didn’t work or has expired.', 401, 'INVALID_TOKEN') },
  {
    name: 'personal state: maintenance while creating',
    open: async (page) => {
      await refuse(page, '/auth/register', 503, 'SERVICE_UNAVAILABLE');
      await signUpTo(page, 'done');
      await page.getByText('Planned maintenance runs from').waitFor();
    },
  },
  {
    name: 'personal creating, details refused',
    open: async (page) => {
      await refuse(page, '/auth/register', 422, 'VALIDATION_ERROR');
      await signUpTo(page, 'done');
      await page.getByText('Some of your details weren’t accepted').waitFor();
    },
  },
  {
    name: 'personal birth, refused by the server beside the year',
    open: async (page) => {
      await page.route('**/api/v1/auth/register', (route) =>
        route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'USER_UNDERAGE', message: 'Server said: USER_UNDERAGE' }, meta: { requestId } }) }),
      );
      await signUpTo(page, 'done');
      await page.getByText('You need to be older to have a Yahel account.').waitFor();
    },
  },
];

/** Every state of every personal sign-up screen. */
export const personalScreens: Screen[] = [
  { name: 'personal type', open: (page) => signUpTo(page, 'type') },
  {
    name: 'personal type, business chosen',
    open: async (page) => {
      await signUpTo(page, 'type');
      await page.getByRole('radio', { name: /For my business or team/ }).check();
    },
  },
  {
    name: 'personal name with an error',
    open: async (page) => {
      await signUpTo(page, 'name');
      await proceed(page);
      await page.getByText('Enter your first name.').waitFor();
    },
  },
  {
    name: 'personal birth, filled, with the reason shown and details hidden',
    open: async (page) => {
      await signUpTo(page, 'birth');
      await page.getByLabel('Day').fill(person.day);
      await page.getByLabel('Month').selectOption({ label: person.month });
      await page.getByLabel('Year').fill(person.year);
      await page.getByRole('button', { name: 'Why we ask' }).click();
      await page.getByRole('button', { name: 'Hide my details' }).click();
    },
  },
  {
    name: 'personal birth with errors',
    open: async (page) => {
      await signUpTo(page, 'birth');
      await proceed(page);
      await page.getByText('Choose a month.').waitFor();
    },
  },
  {
    name: 'personal address, available, with alternatives',
    open: async (page) => {
      await signUpTo(page, 'address');
      await page.getByLabel('Your Yahel address').fill(person.username);
      await page.getByText('Available. It’s yours if you want it.').waitFor();
    },
  },
  {
    name: 'personal address, taken',
    open: async (page) => {
      await signUpTo(page, 'address');
      await page.getByLabel('Your Yahel address').fill('amara');
      await page.getByText('That address is taken. Try one of these.').waitFor();
    },
  },
  {
    name: 'personal existing email with an error',
    open: async (page) => {
      await signUpTo(page, 'own-email', { address: 'own' });
      await proceed(page);
      await page.getByText('Enter an email address you can open now.').waitFor();
    },
  },
  {
    name: 'personal password with its strength',
    open: async (page) => {
      await signUpTo(page, 'password');
      await page.getByLabel('Password', { exact: true }).fill(person.password);
      await page.getByText(/Strong · \d+ characters/).waitFor();
    },
  },
  {
    name: 'personal password with an error, revealed',
    open: async (page) => {
      await signUpTo(page, 'password');
      await page.getByLabel('Password', { exact: true }).fill('short');
      await proceed(page);
      await page.getByText('Use 8 or more characters, with a capital letter, a number and a symbol.').waitFor();
      await page.getByRole('button', { name: 'Show password' }).click();
    },
  },
  { name: 'personal add a passkey', open: (page) => signUpToPasskeyOffer(page) },
  {
    name: 'personal passkey, waiting',
    open: async (page) => {
      await signUpToPasskeyOffer(page, { passkeys: 'waiting' });
      await page.getByRole('button', { name: 'Add a passkey' }).click();
      await page.getByText('Waiting for this device').waitFor();
    },
  },
  {
    name: 'personal passkey, prompt closed',
    open: async (page) => {
      await signUpToPasskeyOffer(page, { passkeys: 'cancelled' });
      await page.getByRole('button', { name: 'Add a passkey' }).click();
      await page.getByText('The passkey prompt was closed').waitFor();
    },
  },
  {
    name: 'personal add a passkey, one saved',
    open: async (page) => {
      await signUpToPasskeyOffer(page);
      await page.getByRole('button', { name: 'Add a passkey' }).click();
      await page.getByText('Passkey saved', { exact: true }).waitFor();
    },
  },
  {
    name: 'personal recovery, filled',
    open: async (page) => {
      await signUpTo(page, 'recovery');
      await page.getByLabel('Mobile number').fill(person.phone);
      await page.getByLabel('Recovery email').fill(person.recoveryEmail);
    },
  },
  {
    name: 'personal recovery with errors',
    open: async (page) => {
      await signUpTo(page, 'recovery');
      await page.getByLabel('Mobile number').fill('803');
      await page.getByLabel('Recovery email').fill('amara@');
      await proceed(page);
      await page.getByText('Check the number, or leave it empty.').waitFor();
    },
  },
  { name: 'personal review', open: (page) => signUpTo(page, 'review', { phone: true }) },
  {
    name: 'personal review, private details shown, a choice turned on',
    open: async (page) => {
      await signUpTo(page, 'review', { phone: true });
      await page.getByRole('button', { name: 'Show private details' }).click();
      await page.getByRole('checkbox', { name: 'Email me tips and product news' }).check();
    },
  },
  {
    name: 'personal creating',
    open: async (page) => {
      // The account is never created, so the screen stays as it is while it is checked.
      await page.route('**/api/v1/auth/register', () => undefined);
      await signUpTo(page, 'done');
      await heading(page, 'Creating your account…').waitFor();
    },
  },
  {
    name: 'personal creating, failed',
    open: async (page) => {
      await refuse(page, '/auth/register', 500, 'INTERNAL_ERROR');
      await signUpTo(page, 'done');
      await heading(page, 'We couldn’t finish.').waitFor();
    },
  },
  {
    name: 'personal emailed code, part filled',
    open: async (page) => {
      await signUpTo(page, 'done', { address: 'own' });
      await heading(page, 'Check your inbox.').waitFor();
      await page.getByLabel('6-character code').fill(emailCode.slice(0, 4));
    },
  },
  {
    name: 'personal emailed code, refused, a new one sent',
    open: async (page) => {
      await page.clock.install();
      await signUpTo(page, 'done', { address: 'own' });
      await heading(page, 'Check your inbox.').waitFor();
      await page.clock.fastForward(31_000);
      await page.getByRole('button', { name: 'Send a new code', exact: true }).click();
      await page.getByText('If a new code can be sent to this address').waitFor();
      await page.getByRole('button', { name: 'Dismiss' }).focus();
      await proceed(page, 'Verify');
      await page.getByText('Enter all 6 characters.').waitFor();
    },
  },
  {
    name: 'personal texted code',
    open: async (page) => {
      await signUpTo(page, 'done', { phone: true });
      await heading(page, 'Enter the code.').waitFor();
    },
  },
  { name: 'personal ready', open: (page) => signUp(page) },
  {
    name: 'personal ready, phone not confirmed',
    open: async (page) => {
      await signUpTo(page, 'done', { phone: true });
      await page.getByRole('button', { name: 'Skip for now' }).click();
      await page.getByText('Your recovery phone isn’t confirmed yet.').waitFor();
    },
  },
  {
    name: 'personal trusted contact with an error',
    open: async (page) => {
      await signUp(page);
      await page.getByRole('link', { name: /Add someone you trust/ }).click();
      await proceed(page, 'Send invitation');
      await page.getByText('Enter an email address, or choose Not now.').waitFor();
    },
  },
  {
    name: 'personal ready, trusted contact invited',
    open: async (page) => {
      await signUp(page);
      await page.getByRole('link', { name: /Add someone you trust/ }).click();
      await page.getByLabel('Their email address').fill('chidi.eze@personal.example');
      await proceed(page, 'Send invitation');
      await page.getByText('is your trusted contact').waitFor();
    },
  },
  ...feedbackScreens,
];
