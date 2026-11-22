import type { Page } from '@playwright/test';
import { personalScreens } from './personal-screens';
import { at, openBrokenStep, openCodeStep, openEmailStep, openHelpStep, openNewPasswordStep, openPasswordStep, openRecoverCodeStep, openRecoverStep, setConnection, signInWithPassword, stubPasskeys } from './accounts';
import { credentials, requestId, suspendedCredentials } from './api';

const openPasskeyStep = async (page: Page, outcome: 'success' | 'cancelled') => {
  await stubPasskeys(page, outcome);
  await openEmailStep(page);
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
};

// Steps rise into place over half a second. A scan taken mid-rise would measure half-transparent text,
// so each screen is handed over only once its entrance has finished. Endless animations (spinners) are left running.
const settled = async (page: Page) => {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        // A paused animation (a toast held under focus) never finishes, so it is not waited for either.
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity && animation.playState === 'running')
        .map((animation) => animation.finished),
    ),
  );
};

export interface Screen {
  name: string;
  open: (page: Page) => Promise<void>;
}

/** Answers the next sign-in the way the backend would refuse it. Registered after the mock, so it is asked first. */
const refuseSignIn = (page: Page, status: number, code: string, headers?: Record<string, string>) =>
  page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify({ success: false, error: { code, message: `Server said: ${code}` }, meta: { requestId } }) }),
  );

const signInRefused = (heading: string, status: number, code: string, headers?: Record<string, string>) => async (page: Page) => {
  await refuseSignIn(page, status, code, headers);
  await signInWithPassword(page);
  await page.getByText(heading).first().waitFor();
};

/** The whole-screen states and the inline feedback states of sign-in, each reached by the server answer that leads to it. */
const feedbackScreens: Screen[] = [
  {
    name: 'accounts state: sign-in paused, with the time',
    open: signInRefused('You can try again at', 429, 'BAD_REQUEST', { 'Retry-After': '600', 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Retry-After' }),
  },
  {
    name: 'accounts state: account turned off',
    open: async (page) => {
      await signInWithPassword(page, suspendedCredentials);
      await page.getByRole('heading', { name: 'This account is turned off.' }).waitFor();
    },
  },
  { name: 'accounts state: organisation paused', open: signInRefused('Your organisation is paused.', 403, 'TENANT_SUSPENDED') },
  { name: 'accounts state: maintenance, with its window', open: signInRefused('Planned maintenance runs from', 503, 'SERVICE_UNAVAILABLE') },
  {
    name: 'accounts banner: not answering, with Try again',
    open: async (page) => {
      await page.route('**/api/v1/auth/login', (route) => route.abort('connectionfailed'));
      await signInWithPassword(page);
      await page.getByText('We can’t reach Yahel right now').waitFor();
    },
  },
  { name: 'accounts banner: our side, with the reference and Try again', open: signInRefused('Something went wrong on our side', 500, 'INTERNAL_ERROR') },
  { name: 'accounts banner: confirm your email first', open: signInRefused('Confirm your email first', 403, 'EMAIL_NOT_VERIFIED') },
  { name: 'accounts banner: choose a new password first, with its action', open: signInRefused('Choose a new password first', 403, 'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED') },
  {
    name: 'accounts offline: the connection bar and the offline banner',
    open: async (page) => {
      await openPasswordStep(page);
      await page.getByLabel('Password', { exact: true }).fill(credentials.password);
      await setConnection(page, false);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByText('We couldn’t send this step because there’s no connection.').waitFor();
    },
  },
  {
    name: 'accounts slow hint under a busy button',
    open: async (page) => {
      await page.route('**/api/v1/auth/login', () => undefined);
      await signInWithPassword(page);
      await page.getByText('Still working.').waitFor();
    },
  },
  {
    name: 'accounts email, valid, with its tick',
    open: async (page) => {
      await openEmailStep(page);
      await page.getByLabel('Email').fill(credentials.email);
      await page.getByLabel('Email').blur();
    },
  },
  {
    name: 'accounts email, invalid on leaving the field',
    open: async (page) => {
      await openEmailStep(page);
      await page.getByLabel('Email').fill('amara@');
      await page.getByLabel('Email').blur();
      await page.getByText('That doesn’t look like an email address.').waitFor();
    },
  },
  {
    name: 'accounts recover code, a new code sent: the toast, held, and the countdown',
    open: async (page) => {
      await page.clock.install();
      await openRecoverCodeStep(page);
      await page.clock.fastForward(31_000);
      await page.getByRole('button', { name: 'Send a new code', exact: true }).click();
      await page.getByText('New code sent. Older codes no longer work.').waitFor();
      // Focus inside the toast stops its clock, so it is still there to be checked.
      await page.getByRole('button', { name: 'Dismiss' }).focus();
      await page.getByRole('button', { name: /^Send a new code in 0:\d\d$/ }).waitFor();
    },
  },
  {
    name: 'accounts recover code, the code no longer works',
    open: async (page) => {
      await page.route('**/api/v1/auth/reset-password', (route) =>
        route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'TOKEN_MAX_ATTEMPTS', message: 'Server said: TOKEN_MAX_ATTEMPTS' }, meta: { requestId } }) }),
      );
      await openNewPasswordStep(page);
      await page.getByLabel('New password', { exact: true }).fill('Sunrise over Lekki 94!');
      await page.getByRole('button', { name: 'Save and sign in' }).click();
      await page.getByText('This code no longer works').waitFor();
    },
  },
];

const screens: Screen[] = [
  {
    name: 'accounts chooser',
    open: async (page) => {
      await page.goto(at('/signin'));
      await page.getByRole('heading', { name: 'Choose an account.' }).waitFor();
    },
  },
  {
    name: 'accounts chooser, removing',
    open: async (page) => {
      await page.goto(at('/signin'));
      await page.getByRole('button', { name: 'Remove an account' }).click();
      await page.getByRole('button', { name: /^Remove .+ from this device$/ }).first().waitFor();
    },
  },
  {
    name: 'accounts email with a passkey offered',
    open: async (page) => {
      await stubPasskeys(page, 'success');
      await openEmailStep(page);
      await page.getByRole('button', { name: 'Sign in with a passkey' }).waitFor();
    },
  },
  {
    name: 'accounts email with an error',
    open: async (page) => {
      await openEmailStep(page);
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Enter your email.').waitFor();
    },
  },
  { name: 'accounts password', open: (page) => openPasswordStep(page) },
  {
    name: 'accounts password, revealed, after a failed attempt',
    open: async (page) => {
      await openPasswordStep(page);
      await page.getByLabel('Password', { exact: true }).fill('not the password');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByText('That email and password don’t match.').waitFor();
      await page.getByRole('button', { name: 'Show password' }).click();
    },
  },
  {
    name: 'accounts passkey, waiting',
    open: async (page) => {
      await openPasskeyStep(page, 'success');
      await page.getByText('Waiting for this device').waitFor();
    },
  },
  {
    name: 'accounts passkey, prompt closed',
    open: async (page) => {
      await openPasskeyStep(page, 'cancelled');
      await page.getByText('The passkey prompt was closed').waitFor();
    },
  },
  {
    name: 'accounts code, part filled, text sent',
    open: async (page) => {
      await openCodeStep(page);
      await page.getByRole('button', { name: 'Text me a code instead' }).click();
      await page.getByText('We texted a code to').waitFor();
      await page.getByLabel('6-digit code').fill('4829');
    },
  },
  {
    name: 'accounts code with an error',
    open: async (page) => {
      await openCodeStep(page);
      await page.getByRole('button', { name: 'Verify' }).click();
      await page.getByText('Enter all 6 digits.').waitFor();
    },
  },
  {
    name: 'accounts backup code',
    open: async (page) => {
      await openCodeStep(page);
      await page.getByRole('button', { name: 'Use a backup code' }).click();
      await page.getByLabel('Backup code').waitFor();
    },
  },
  {
    name: 'accounts done',
    open: async (page) => {
      await signInWithPassword(page);
      await page.getByRole('heading', { name: 'Welcome back, Amara.' }).waitFor();
    },
  },
  { name: 'accounts help', open: openHelpStep },
  {
    name: 'accounts help sent',
    open: async (page) => {
      await openHelpStep(page);
      await page.getByLabel('Email or phone we can reach you on').fill('amara@personal.example');
      await page.getByRole('button', { name: 'Send request' }).click();
      await page.getByRole('heading', { name: 'We’re on it.' }).waitFor();
    },
  },
  { name: 'accounts recover', open: openRecoverStep },
  { name: 'accounts recover code', open: openRecoverCodeStep },
  {
    name: 'accounts new password with its strength',
    open: async (page) => {
      await openNewPasswordStep(page);
      await page.getByLabel('New password', { exact: true }).fill('Sunrise over Lekki 94!');
      await page.getByText(/Strong · \d+ characters/).waitFor();
    },
  },
  {
    name: 'accounts new password with an error',
    open: async (page) => {
      await openNewPasswordStep(page);
      await page.getByLabel('New password', { exact: true }).fill('short');
      await page.getByRole('button', { name: 'Save and sign in' }).click();
      await page.getByText('Use 8 or more characters, with a capital letter, a number and a symbol.').waitFor();
    },
  },
  { name: 'accounts step that failed to show', open: openBrokenStep },
  ...feedbackScreens,
  {
    name: 'accounts page not found',
    open: async (page) => {
      await page.goto(at('/nowhere'));
      await page.getByRole('heading', { name: 'That page isn’t here.' }).waitFor();
    },
  },
];

/** Every state of every screen of the accounts app, for the accessibility and layout checks. */
export const accountsScreens: Screen[] = [...screens, ...personalScreens].map(({ name, open }) => ({
  name,
  open: async (page) => {
    await open(page);
    await settled(page);
  },
}));
