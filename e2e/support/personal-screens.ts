import type { Page } from '@playwright/test';
import type { Screen } from './accounts-screens';
import { stubPasskeys } from './accounts';
import { emailCode } from './api';
import { heading, person, signUp, signUpTo } from './personal';

const proceed = (page: Page, name = 'Continue') => page.getByRole('button', { name, exact: true }).click();

/** Every state of every personal sign-up screen. */
export const personalScreens: Screen[] = [
  { name: 'personal type', open: (page) => signUpTo(page, 'type') },
  {
    name: 'personal type, business coming soon',
    open: async (page) => {
      await signUpTo(page, 'type');
      await page.getByRole('radio', { name: /For my business or team/ }).check();
      await proceed(page);
      await page.getByText('Business and team accounts are coming soon.').waitFor();
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
      await page.getByLabel('Password', { exact: true }).fill('too short');
      await proceed(page);
      await page.getByText('Use 12 characters or more.').waitFor();
      await page.getByRole('button', { name: 'Show password' }).click();
    },
  },
  { name: 'personal add a passkey', open: (page) => signUpTo(page, 'add-passkey') },
  {
    name: 'personal passkey, waiting',
    open: async (page) => {
      await stubPasskeys(page, 'waiting');
      await signUpTo(page, 'add-passkey');
      await page.getByRole('button', { name: 'Add a passkey' }).click();
      await page.getByText('Waiting for this device').waitFor();
    },
  },
  {
    name: 'personal passkey, prompt closed',
    open: async (page) => {
      await stubPasskeys(page, 'cancelled');
      await signUpTo(page, 'add-passkey');
      await page.getByRole('button', { name: 'Add a passkey' }).click();
      await page.getByText('The passkey prompt was closed').waitFor();
    },
  },
  {
    name: 'personal add a passkey, one already made',
    open: async (page) => {
      await signUpTo(page, 'recovery', { passkey: true });
      await page.getByRole('link', { name: 'Back' }).click();
      await page.getByText('A passkey is ready on this device').waitFor();
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
  { name: 'personal review', open: (page) => signUpTo(page, 'review', { passkey: true, phone: true }) },
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
      await page.route('**/api/v1/auth/register', (route) => route.abort('internetdisconnected'));
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
      await signUpTo(page, 'done', { address: 'own' });
      await heading(page, 'Check your inbox.').waitFor();
      await page.getByRole('button', { name: 'Send a new code' }).click();
      await page.getByText('New code sent.').waitFor();
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
];
