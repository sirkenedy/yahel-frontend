import type { Page } from '@playwright/test';
import { fillMobile, openPasswordStep, stubPasskeys } from './accounts';
import type { PasskeyOutcome } from './accounts';
import { newAdmin, phoneCode } from './api';

/** A mobile number as typed, without the country code, and the masked form the code step names it by. */
export const adminPhone = { number: '803 555 0142', masked: '+234 ••• ••• ••42' };

/**
 * Where the demo build sends an administrator once Admin is theirs: Admin (the app address, unset in the demo build)
 * as their own account. The browser already remembers two accounts, so the administrator takes slot 2.
 */
export const adminAddress = 'http://localhost:5173/u/2/';

export type AdminStop = 'phone' | 'code' | 'welcome' | 'add-passkey' | 'passkey' | 'saved';

export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { level: 1, name });
export const codeBoxes = (page: Page) => page.getByLabel('6-character code');

/** Stands in for Admin, which is another app: whatever opens there is a page that says where it is. */
export const stubAdmin = (page: Page) => page.route(`${adminAddress}**`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Admin</title><h1>Admin</h1>' }));

/**
 * Signs the seeded workspace's administrator in through sign-in, whose phone is still to be checked, and walks the
 * steps that follow (the phone check signs in), stopping with `stop` on screen. `passkey` is how the device answers
 * the passkey prompt; it is set before the first navigation.
 */
export async function adminTo(page: Page, stop: AdminStop, { passkey = 'success' }: { passkey?: PasskeyOutcome } = {}) {
  await stubPasskeys(page, passkey);
  await openPasswordStep(page, newAdmin.email);
  await page.getByLabel('Password', { exact: true }).fill(newAdmin.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await heading(page, 'Verify it’s you.').waitFor();
  if (stop === 'phone') return;
  await fillMobile(page, adminPhone.number);
  await page.getByRole('button', { name: 'Send code' }).click();

  await heading(page, 'Enter the code.').waitFor();
  if (stop === 'code') return;
  await codeBoxes(page).fill(phoneCode);

  await heading(page, 'Welcome to your new account.').waitFor();
  if (stop === 'welcome') return;
  await page.getByRole('button', { name: 'I understand' }).click();

  await heading(page, 'Protect Admin with a passkey.').waitFor();
  if (stop === 'add-passkey') return;
  await page.getByRole('button', { name: 'Add a passkey' }).click();

  await heading(page, 'Create your passkey.').waitFor();
  if (stop === 'passkey') return;
  await heading(page, 'Admin is protected.').waitFor();
}
