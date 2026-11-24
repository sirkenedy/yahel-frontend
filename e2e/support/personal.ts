import type { Page } from '@playwright/test';
import { stubPasskeys, visit } from './accounts';
import type { PasskeyOutcome } from './accounts';
import { mailDomain, publicEmailDomain } from './api';

export const person = {
  firstName: 'Amara',
  lastName: 'Okafor',
  day: '14',
  month: 'March',
  year: '1994',
  username: 'amara.okafor',
  address: `amara.okafor@${mailDomain}`,
  ownEmail: `amara.okafor@${publicEmailDomain}`,
  password: 'Sunrise over Lekki 94',
  phone: '803 555 0142',
  internationalPhone: '+2348035550142',
  maskedPhone: '+234 ••• ••• ••42',
  recoveryEmail: 'amara.o@personal.example',
};

export type PersonalStop = 'type' | 'name' | 'birth' | 'address' | 'own-email' | 'password' | 'recovery' | 'review' | 'done';

export interface PersonalPath {
  /** A new Yahel address, or an email the person already has. */
  address?: 'yahel' | 'own';
  username?: string;
  /** What this browser does when asked for a passkey. Every engine is told, because not every test build has WebAuthn. */
  passkeys?: PasskeyOutcome;
  phone?: boolean;
  recoveryEmail?: boolean;
  query?: string;
}

const next = (page: Page, name = 'Continue') => page.getByRole('button', { name, exact: true }).click();
export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { level: 1, name });

/**
 * Answers the questions of personal sign-up in order and stops with `stop` on screen (`done` presses
 * "Agree and create account"). The browser's passkey support is always described (`passkeys`), never taken from the engine.
 */
export async function signUpTo(page: Page, stop: PersonalStop, { address = 'yahel', username = person.username, passkeys = 'success', phone = false, recoveryEmail = true, query = '' }: PersonalPath = {}) {
  await stubPasskeys(page, passkeys);
  await visit(page, `/personal${query}`);
  await heading(page, 'Create your Yahel account.').waitFor();
  if (stop === 'type') return;

  await next(page);
  await heading(page, 'What should we call you?').waitFor();
  if (stop === 'name') return;
  await page.getByLabel('First name').fill(person.firstName);
  await page.getByLabel('Last name').fill(person.lastName);

  await next(page);
  await heading(page, 'A little about you.').waitFor();
  if (stop === 'birth') return;
  await page.getByLabel('Day').fill(person.day);
  await page.getByLabel('Month').selectOption({ label: person.month });
  await page.getByLabel('Year').fill(person.year);

  await next(page);
  await heading(page, 'Pick your address.').waitFor();
  if (stop === 'address') return;
  if (address === 'own') {
    await page.getByRole('button', { name: 'Use an email I already have' }).click();
    await heading(page, 'Use your current email.').waitFor();
    if (stop === 'own-email') return;
    await page.getByLabel('Your email address').fill(person.ownEmail);
  } else {
    await page.getByLabel('Your Yahel address').fill(username);
    if (username === person.username) await page.getByText('Available. It’s yours if you want it.').waitFor();
  }

  await next(page);
  await heading(page, 'Create a password.').waitFor();
  if (stop === 'password') return;
  await page.getByLabel('Password', { exact: true }).fill(person.password);

  await next(page);
  await heading(page, 'Ways back in.').waitFor();
  if (stop === 'recovery') return;
  if (phone) await page.getByLabel('Mobile number').fill(person.phone);
  if (recoveryEmail) await page.getByLabel('Recovery email').fill(person.recoveryEmail);
  await next(page, phone || recoveryEmail ? 'Continue' : 'Skip');

  await heading(page, 'Everything look right?').waitFor();
  if (stop === 'review') return;
  await page.getByRole('button', { name: 'Agree and create account' }).click();
}

/** Signs up all the way to the last screen. */
export async function signUp(page: Page, path: PersonalPath = {}) {
  await signUpTo(page, 'done', path);
  await heading(page, `You’re in, ${person.firstName}.`).waitFor();
}

/** Signs up to the last screen and goes on from it: the passkey is offered once the account exists (F-108). */
export async function signUpToPasskeyOffer(page: Page, path: PersonalPath = {}) {
  await signUp(page, path);
  await page.getByRole('button', { name: 'Continue to Yahel' }).click();
  await heading(page, 'Add a passkey too?').waitFor();
}
