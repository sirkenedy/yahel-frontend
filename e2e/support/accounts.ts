import type { Page, Route } from '@playwright/test';
import { credentials, resetCode, twoStepCredentials } from './api';

/** The accounts app is served by its own preview server (see playwright.config.ts). */
export const accountsUrl = 'http://localhost:4175';
export const at = (path: string) => `${accountsUrl}${path}`;

/** `waiting`: the prompt stays open, so the waiting screen can be examined. */
export type PasskeyOutcome = 'success' | 'cancelled' | 'unsupported' | 'waiting';

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
        create: async () => {
          await new Promise((resolve) => (result === 'waiting' ? undefined : setTimeout(resolve, 400)));
          if (result === 'cancelled') throw new DOMException('The prompt was dismissed', 'NotAllowedError');
          return { rawId: bytes(1, 2, 3), response: { clientDataJSON: bytes(4), attestationObject: bytes(5, 6), getTransports: () => ['internal'] } };
        },
      },
    });
  }, outcome);
}

/** Opens sign-in at the email step: past the account chooser when this browser remembers accounts, as it does by default. */
export async function openEmailStep(page: Page, query = '') {
  // WebKit counts the chooser's redirect, made before the page finishes loading, as a second navigation.
  await page.goto(at(`/signin${query}`), { waitUntil: 'commit' });
  const another = page.getByRole('button', { name: 'Use another account' });
  const email = page.getByRole('heading', { name: 'Welcome back.' });
  await another.or(email).first().waitFor();
  if (await another.isVisible()) await another.click();
  await email.waitFor();
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

type Breakable = Window & { failNextStep?: boolean };

/**
 * Lets a test make the next step fail as it appears, once, the way a defect in a step would: the step asks
 * the browser what kind of pointer is in use when it mounts, and that question throws. Call before the
 * first navigation, then `failNextStep` just before the step is opened.
 */
export async function armStepFailure(page: Page) {
  await page.addInitScript(() => {
    const ask = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const breakable = window as Breakable;
      if (breakable.failNextStep && query.includes('pointer')) {
        breakable.failNextStep = false;
        throw new Error('A step failed while it was being shown');
      }
      return ask(query);
    };
  });
}

export const failNextStep = (page: Page) => page.evaluate(() => void ((window as Breakable).failNextStep = true));

/** Opens the email step and makes the password step fail as it appears. */
export async function openBrokenStep(page: Page) {
  await armStepFailure(page);
  await openEmailStep(page);
  await page.getByLabel('Email').fill(credentials.email);
  await failNextStep(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'Something went wrong on our side.' }).waitFor();
}

const dropRequest = (route: Route) => route.abort('internetdisconnected');

/**
 * Takes the device off the network, or puts it back, as the page experiences it: the browser says so,
 * announces the change, and requests fail at once. Playwright's own offline switch leaves a request that
 * a route answers waiting for ever, which no real connection does.
 */
export async function setConnection(page: Page, online: boolean) {
  if (online) await page.unroute('**/api/v1/**', dropRequest);
  else await page.route('**/api/v1/**', dropRequest);
  await page.evaluate((isOnline) => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => isOnline });
    window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
  }, online);
}
