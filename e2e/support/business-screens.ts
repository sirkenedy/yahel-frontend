import type { Page } from '@playwright/test';
import type { Screen } from './accounts-screens';
import { requestId } from './api';
import { business, card, createWorkspace, createWorkspaceTo, heading, proceed, searchForBoughtDomain } from './business';

/** Answers the request that creates the workspace the way the backend would refuse it. Registered after the mock, so it is asked first. */
const refuseCreation = (page: Page, status: number, code: string) =>
  page.route('**/api/v1/auth/register-business', (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code, message: `Server said: ${code}` }, meta: { requestId } }) }));

const confirmCard = async (page: Page, code = card.code) => {
  await page.getByLabel('6-digit code').fill(code);
  await proceed(page, 'Confirm');
};

/** Workspace sign-up: its thirteen screens as drawn, then the states a refusal or a choice leads to. */
export const businessScreens: Screen[] = [
  { name: 'business start', open: (page) => createWorkspaceTo(page, 'start') },
  { name: 'business you', open: (page) => createWorkspaceTo(page, 'you') },
  { name: 'business domain question', open: (page) => createWorkspaceTo(page, 'domain-question') },
  { name: 'business domain', open: (page) => createWorkspaceTo(page, 'domain') },
  { name: 'business domain ok', open: (page) => createWorkspaceTo(page, 'domain-ok') },
  {
    name: 'business find, one chosen',
    open: async (page) => {
      await createWorkspaceTo(page, 'find', { domain: 'bought' });
      await searchForBoughtDomain(page);
      await page.getByRole('radio', { name: /^example\.com/ }).check({ force: true });
    },
  },
  { name: 'business registrant', open: (page) => createWorkspaceTo(page, 'registrant', { domain: 'bought' }) },
  { name: 'business admin', open: (page) => createWorkspaceTo(page, 'admin') },
  { name: 'business plan', open: (page) => createWorkspaceTo(page, 'plan') },
  { name: 'business checkout', open: (page) => createWorkspaceTo(page, 'checkout', { domain: 'bought' }) },
  { name: 'business card code', open: (page) => createWorkspaceTo(page, 'card-code', { domain: 'bought' }) },
  {
    name: 'business creating',
    open: async (page) => {
      // The answer never comes, so the screen that waits for it stays.
      await page.route('**/api/v1/auth/register-business', () => undefined);
      await createWorkspaceTo(page, 'admin');
      await page.getByLabel('Password', { exact: true }).fill(business.password);
      await page.getByLabel('Confirm password').fill(business.password);
      await proceed(page, 'Agree and continue');
      await heading(page, `Creating ${business.name}…`).waitFor();
    },
  },
  { name: 'business found', open: (page) => createWorkspaceTo(page, 'found', { domain: 'bought' }) },
  { name: 'business ready', open: (page) => createWorkspaceTo(page, 'ready') },
  { name: 'business gateway', open: (page) => createWorkspaceTo(page, 'gateway', { domain: 'bought' }) },
  { name: 'business paid', open: (page) => createWorkspace(page, { domain: 'bought' }) },
  {
    name: 'business domain, claimed',
    open: async (page) => {
      await createWorkspaceTo(page, 'domain');
      await page.getByLabel('Your domain', { exact: true }).fill('taken.example');
      await proceed(page);
      await page.getByText('Another organisation has claimed this domain').waitFor();
    },
  },
  {
    name: 'business you, several things to fix',
    open: async (page) => {
      await createWorkspaceTo(page, 'you');
      await proceed(page);
      await page.getByText('2 things to fix before you continue').waitFor();
    },
  },
  {
    name: 'business registrant, more details',
    open: async (page) => {
      await createWorkspaceTo(page, 'registrant', { domain: 'bought' });
      await proceed(page, 'Add building, LGA or postal code');
      await page.getByLabel('Postal code').waitFor();
    },
  },
  {
    name: 'business admin, address taken',
    open: async (page) => {
      await refuseCreation(page, 409, 'EMAIL_ALREADY_EXISTS');
      await createWorkspaceTo(page, 'admin');
      await page.getByLabel('Password', { exact: true }).fill(business.password);
      await page.getByLabel('Confirm password').fill(business.password);
      await proceed(page, 'Agree and continue');
      await page.getByText('That address already has a Yahel sign-in.').waitFor();
    },
  },
  { name: 'business plan, yearly with a promo code', open: (page) => createWorkspaceTo(page, 'plan').then(() => applyPromoOnPlan(page)) },
  { name: 'business checkout, no trial', open: (page) => createWorkspaceTo(page, 'checkout', { seats: 24, period: 'Yearly' }) },
  {
    name: 'business checkout, nothing filled',
    open: async (page) => {
      await createWorkspaceTo(page, 'plan');
      await proceed(page, 'Continue to checkout');
      await proceed(page, 'Continue to payment');
      await page.getByText('Add your name and address.').waitFor();
    },
  },
  {
    name: 'business checkout, card declined',
    open: async (page) => {
      await createWorkspaceTo(page, 'done', { cardNumber: card.declined });
      await page.getByText('Your bank declined this card').waitFor();
    },
  },
  {
    name: 'business card code, wrong',
    open: async (page) => {
      await createWorkspaceTo(page, 'card-code');
      await confirmCard(page, card.wrongCode);
      await page.getByText('That code didn’t work.').waitFor();
    },
  },
  {
    name: 'business creating, failed',
    open: async (page) => {
      await refuseCreation(page, 500, 'INTERNAL_ERROR');
      await createWorkspaceTo(page, 'admin');
      await page.getByLabel('Password', { exact: true }).fill(business.password);
      await page.getByLabel('Confirm password').fill(business.password);
      await proceed(page, 'Agree and continue');
      await heading(page, 'We couldn’t finish creating your workspace.').waitFor();
    },
  },
];

async function applyPromoOnPlan(page: Page) {
  await page.getByRole('radio', { name: /^Yearly/ }).check({ force: true });
  await proceed(page, 'Add a promo code');
  await page.getByLabel('Promo code').fill('LAUNCH');
  await proceed(page, 'Apply');
  await page.getByText('LAUNCH · 20% off for 3 months').first().waitFor();
}
