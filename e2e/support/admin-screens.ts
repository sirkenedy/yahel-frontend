import type { Page } from '@playwright/test';
import type { Screen } from './accounts-screens';
import { fillMobile, stubPasskeys } from './accounts';
import { adminTo, codeBoxes } from './admin';
import { requestId } from './api';
import { createWorkspaceTo } from './business';

/** Answers the next request to `path` the way the backend would refuse it. Registered after the mock, so it is asked first. */
const refuseOnce = (page: Page, path: string, status: number, code: string) =>
  page.route(`**/api${path}`, (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code, message: `Server said: ${code}` }, meta: { requestId } }) }), { times: 1 });

/** An administrator's first steps: the screens as drawn, then the states a refusal or the device leads to. */
export const adminScreens: Screen[] = [
  {
    name: 'admin phone, from workspace sign-up',
    open: async (page) => {
      await stubPasskeys(page, 'success');
      await createWorkspaceTo(page, 'phone', { domain: 'bought' });
    },
  },
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
    name: 'admin code, too many tries',
    open: async (page) => {
      await adminTo(page, 'code');
      await refuseOnce(page, '/v1/auth/phone-challenge/verify', 429, 'TOKEN_MAX_ATTEMPTS');
      await codeBoxes(page).fill('WRONG1');
      await page.getByText('This check has ended').waitFor();
    },
  },
  {
    name: 'admin phone, refused',
    open: async (page) => {
      await adminTo(page, 'phone');
      await refuseOnce(page, '/v1/auth/phone-challenge/send', 409, 'PHONE_ALREADY_IN_USE');
      await fillMobile(page, '803 555 0142');
      await page.getByRole('button', { name: 'Send code' }).click();
      await page.getByText('This number can’t be used. Try another one.').waitFor();
    },
  },
];
