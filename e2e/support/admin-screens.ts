import type { Page } from '@playwright/test';
import type { Screen } from './accounts-screens';
import { stubPasskeys } from './accounts';
import { adminTo, codeBoxes, heading } from './admin';
import { requestId } from './api';
import { createWorkspace } from './business';

/** Answers the next request to `path` the way the backend would refuse it. Registered after the mock, so it is asked first. */
const refuseOnce = (page: Page, path: string, status: number, code: string) =>
  page.route(`**/api${path}`, (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code, message: `Server said: ${code}` }, meta: { requestId } }) }), { times: 1 });

/** An administrator's first sign-in: its six screens as drawn, then the states a refusal or the device leads to. */
export const adminScreens: Screen[] = [
  {
    name: 'admin sign-in',
    open: async (page) => {
      await stubPasskeys(page, 'success');
      await createWorkspace(page);
      await page.getByRole('link', { name: 'Sign in to Admin' }).click();
      await heading(page, 'Sign in to Admin.').waitFor();
    },
  },
  { name: 'admin sign-in, the address asked for', open: (page) => adminTo(page, 'signin') },
  { name: 'admin confirm email', open: (page) => adminTo(page, 'confirm-email') },
  { name: 'admin phone', open: (page) => adminTo(page, 'phone') },
  { name: 'admin code', open: (page) => adminTo(page, 'code') },
  { name: 'admin welcome', open: (page) => adminTo(page, 'welcome') },
  { name: 'admin add passkey', open: (page) => adminTo(page, 'add-passkey') },
  { name: 'admin passkey', open: (page) => adminTo(page, 'passkey', { passkey: 'waiting' }) },
  { name: 'admin passkey saved', open: (page) => adminTo(page, 'saved') },
  {
    name: 'admin passkey, cancelled',
    open: async (page) => {
      await adminTo(page, 'passkey', { passkey: 'cancelled' });
      await page.getByText('The passkey wasn’t saved.').waitFor();
    },
  },
  { name: 'admin add passkey, a device without passkeys', open: (page) => adminTo(page, 'add-passkey', { passkey: 'unsupported' }) },
  {
    name: 'admin sign-in, wrong password',
    open: async (page) => {
      await adminTo(page, 'signin');
      await page.getByLabel('Admin email').fill('kayode@northwind.example');
      await page.getByLabel('Password', { exact: true }).fill('not the password');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByText('That email and password don’t match.').waitFor();
    },
  },
  {
    name: 'admin confirm email, code no longer works',
    open: async (page) => {
      await adminTo(page, 'confirm-email');
      await refuseOnce(page, '/v1/auth/verify-email', 429, 'TOKEN_MAX_ATTEMPTS');
      await codeBoxes(page).fill('WRONG1');
      await page.getByRole('button', { name: 'Verify' }).click();
      await page.getByText('This code no longer works').waitFor();
    },
  },
  {
    name: 'admin phone, refused',
    open: async (page) => {
      await adminTo(page, 'phone');
      await refuseOnce(page, '/v1/me/recovery/phone', 409, 'PHONE_ALREADY_IN_USE');
      await page.getByLabel('Mobile number').fill('803 555 0142');
      await page.getByRole('button', { name: 'Send code' }).click();
      await page.getByText('This number can’t be used. Try another one.').waitFor();
    },
  },
];
