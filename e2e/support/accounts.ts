import type { Page } from '@playwright/test';
import { credentials, resetCode, twoStepCredentials } from './api';

/** The accounts app is served by its own preview server (see playwright.config.ts). */
export const accountsUrl = 'http://localhost:4175';
export const at = (path: string) => `${accountsUrl}${path}`;

export type PasskeyOutcome = 'success' | 'cancelled' | 'unsupported';

/**
 * Replaces the browser's passkey prompt, which a test cannot operate, with a fixed outcome. Works in every
 * engine, unlike a virtual authenticator. Call before the first navigation.
 */
export async function stubPasskeys(page: Page, outcome: PasskeyOutcome) {
  await page.addInitScript((result) => {
    const bytes = (...values: number[]) => new Uint8Array(values).buffer;
    Object.defineProperty(window, 'PublicKeyCredential', {
      configurable: true,
      value: result === 'unsupported' ? undefined : class PublicKeyCredential {},
    });
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        get: async () => {
          // Long enough for the waiting screen to be seen and asserted on.
          await new Promise((resolve) => setTimeout(resolve, 400));
          if (result === 'cancelled') throw new DOMException('The prompt was dismissed', 'NotAllowedError');
          return { rawId: bytes(1, 2, 3), response: { clientDataJSON: bytes(4), authenticatorData: bytes(5), signature: bytes(6), userHandle: null } };
        },
      },
    });
  }, outcome);
}

/** Opens sign-in at the email step, past the account chooser the demo data starts with. */
export async function openEmailStep(page: Page, query = '') {
  await page.goto(at(`/signin${query}`));
  await page.getByRole('button', { name: 'Use another account' }).click();
  await page.getByRole('heading', { name: 'Welcome back.' }).waitFor();
}

export async function openPasswordStep(page: Page, email = credentials.email, query = '') {
  await openEmailStep(page, query);
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'Enter your password.' }).waitFor();
}

export async function signInWithPassword(page: Page, account = credentials, query = '') {
  await openPasswordStep(page, account.email, query);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function openCodeStep(page: Page) {
  await signInWithPassword(page, twoStepCredentials);
  await page.getByRole('heading', { name: 'One more step.' }).waitFor();
}

export async function openRecoverStep(page: Page) {
  await openPasswordStep(page);
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await page.getByRole('radiogroup', { name: 'Where to send the code' }).waitFor();
}

export async function openRecoverCodeStep(page: Page) {
  await openRecoverStep(page);
  await page.getByRole('radio', { name: /^Email/ }).check();
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByRole('heading', { name: 'Enter the code.' }).waitFor();
}

export async function openNewPasswordStep(page: Page) {
  await openRecoverCodeStep(page);
  await page.getByLabel('6-character code').fill(resetCode);
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByRole('heading', { name: 'Choose a new password.' }).waitFor();
}

export async function openHelpStep(page: Page) {
  await openEmailStep(page);
  await page.getByRole('link', { name: 'Forgot your email?' }).click();
  await page.getByRole('heading', { name: 'Let’s find your account.' }).waitFor();
}
