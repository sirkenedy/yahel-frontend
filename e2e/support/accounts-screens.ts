import type { Page } from '@playwright/test';
import { at, openBrokenStep, openCodeStep, openEmailStep, openHelpStep, openNewPasswordStep, openPasswordStep, openRecoverCodeStep, openRecoverStep, signInWithPassword, stubPasskeys } from './accounts';

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
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
};

interface Screen {
  name: string;
  open: (page: Page) => Promise<void>;
}

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
      await page.getByRole('alert').waitFor();
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
      await page.getByLabel('New password', { exact: true }).fill('too short');
      await page.getByRole('button', { name: 'Save and sign in' }).click();
      await page.getByText('Use 12 characters or more.').waitFor();
    },
  },
  { name: 'accounts step that failed to show', open: openBrokenStep },
  {
    name: 'accounts page not found',
    open: async (page) => {
      await page.goto(at('/nowhere'));
      await page.getByRole('heading', { name: 'That page isn’t here.' }).waitFor();
    },
  },
];

/** Every state of every sign-in screen, for the accessibility and layout checks. */
export const accountsScreens: Screen[] = screens.map(({ name, open }) => ({
  name,
  open: async (page) => {
    await open(page);
    await settled(page);
  },
}));
