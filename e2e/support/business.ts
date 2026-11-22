import type { Page } from '@playwright/test';
import { at } from './accounts';

export const business = {
  name: 'Harbourline Studio',
  slug: 'harbourline-studio',
  firstName: 'Amara',
  lastName: 'Okafor',
  contactEmail: 'amara.okafor@mail.example',
  day: '14',
  month: 'March',
  year: '1994',
  domain: 'harbourline.example',
  boughtDomain: 'harbourlinestudio.com',
  street: '12 Admiralty Way',
  city: 'Lekki',
  state: 'Lagos',
  phone: '803 555 0142',
  adminUser: 'amara',
  adminAddress: 'amara@harbourline.example',
  boughtAdminAddress: 'amara@harbourlinestudio.com',
  password: 'Harbourline Lagos 2026!',
};

/** Cards and codes the checkout stand-in knows: its header (`workspace-billing.ts`) says what each does. */
export const card = { number: '4084 0840 8408 4081', lastFour: '4081', declined: '4000 0000 0000 0002', expiry: '08/31', securityCode: '123', code: '482913', wrongCode: '000000', expiredCode: '999999' };

export type BusinessStop = 'start' | 'you' | 'domain-question' | 'domain' | 'domain-ok' | 'find' | 'registrant' | 'admin' | 'plan' | 'checkout' | 'card-code' | 'done';

export interface BusinessPath {
  /** A domain the business owns, or one bought here (which brings in the search and the registrant's address). */
  domain?: 'owned' | 'bought';
  ownedDomain?: string;
  name?: string;
  size?: string;
  country?: string;
  period?: 'Monthly' | 'Yearly';
  /** How many people at checkout: a chip, or a number above ten. */
  seats?: number;
  promo?: string;
  cardNumber?: string;
}

export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { level: 1, name });
export const proceed = (page: Page, name: string | RegExp = 'Continue') => page.getByRole('button', { name, exact: typeof name === 'string' }).click();

export async function fillAddress(page: Page) {
  await page.getByLabel('Street address').fill(business.street);
  await page.getByLabel('City or town').fill(business.city);
  await page.getByLabel('State', { exact: true }).selectOption({ label: business.state });
  await page.getByLabel('Business phone').fill(business.phone);
}

export async function fillCard(page: Page, number = card.number) {
  await page.getByLabel('Card number').fill(number);
  await page.getByLabel('Expiry').fill(card.expiry);
  await page.getByLabel('Security code').fill(card.securityCode);
}

/**
 * Answers the questions of workspace sign-up in order and stops with `stop` on screen (`done` confirms the
 * bank's code, which creates the workspace). With a domain the business owns, its address is added from checkout.
 */
export async function createWorkspaceTo(page: Page, stop: BusinessStop, { domain = 'owned', ownedDomain = business.domain, name = business.name, size, country, period, seats, promo, cardNumber }: BusinessPath = {}) {
  await page.goto(at('/business'));
  await heading(page, 'Tell us about your business.').waitFor();
  if (stop === 'start') return;
  await page.getByLabel('Business name').fill(name);
  if (size) await page.getByRole('radio', { name: size, exact: true }).check({ force: true });
  if (country) await page.getByLabel('Country or region').selectOption({ label: country });

  await proceed(page);
  await heading(page, 'And who are you?').waitFor();
  if (stop === 'you') return;
  await page.getByLabel('First name').fill(business.firstName);
  await page.getByLabel('Last name').fill(business.lastName);
  await page.getByLabel('Current email').fill(business.contactEmail);
  await page.getByLabel('Day').fill(business.day);
  await page.getByLabel('Month').selectOption({ label: business.month });
  await page.getByLabel('Year').fill(business.year);

  await proceed(page);
  await heading(page, 'Your domain.').waitFor();
  if (stop === 'domain-question') return;
  if (domain === 'bought') {
    await page.getByRole('radio', { name: /Buy a new domain/ }).check({ force: true });
    await proceed(page);
    await heading(page, 'Find your domain.').waitFor();
    if (stop === 'find') return;
    await page.getByRole('radio', { name: new RegExp(`^${business.boughtDomain.replace('.', '\\.')}`) }).check({ force: true });
    await proceed(page);
    await heading(page, `Register ${business.boughtDomain}`).waitFor();
    if (stop === 'registrant') return;
    await fillAddress(page);
    await proceed(page);
  } else {
    await proceed(page);
    await heading(page, 'What’s your domain?').waitFor();
    if (stop === 'domain') return;
    await page.getByLabel('Your domain', { exact: true }).fill(ownedDomain);
    await proceed(page);
    await heading(page, `Use this domain for ${name}?`).waitFor();
    if (stop === 'domain-ok') return;
    await proceed(page, 'Use this domain');
  }

  await heading(page, 'Create your admin sign-in.').waitFor();
  if (stop === 'admin') return;
  await page.getByLabel('Password', { exact: true }).fill(business.password);
  await page.getByLabel('Confirm password').fill(business.password);
  await proceed(page, 'Agree and continue');

  await heading(page, /^(Try Yahel free for 14 days\.|Start Yahel Business\.)$/).waitFor();
  if (stop === 'plan') return;
  if (period) await page.getByRole('radio', { name: new RegExp(`^${period}`) }).check({ force: true });
  if (promo) {
    await proceed(page, 'Add a promo code');
    await page.getByLabel('Promo code').fill(promo);
    await proceed(page, 'Apply');
    await page.getByText(`${promo.toUpperCase()} · 20% off for 3 months`).first().waitFor();
  }
  await proceed(page, 'Continue to checkout');

  await heading(page, 'Review and check out.').waitFor();
  if (seats !== undefined && seats <= 10) await page.getByRole('radio', { name: String(seats), exact: true }).check({ force: true });
  if (seats !== undefined && seats > 10) {
    await page.getByRole('radio', { name: '11+', exact: true }).check({ force: true });
    await page.getByLabel('Number of people').fill(String(seats));
  }
  if (domain === 'owned') {
    await proceed(page, 'Add business address');
    await heading(page, 'Your business address').waitFor();
    await fillAddress(page);
    await proceed(page, 'Save address');
    await heading(page, 'Review and check out.').waitFor();
  }
  if (stop === 'checkout') return;
  await fillCard(page, cardNumber);
  await page.getByRole('button', { name: /^(Start free trial|Pay .* and start( trial)?)$/ }).click();
  if (cardNumber === card.declined) return;

  await heading(page, 'Confirm with your bank.').waitFor();
  if (stop === 'card-code') return;
  await page.getByLabel('6-digit code').fill(card.code);
  await proceed(page, 'Confirm');
}

/** Creates a workspace all the way to the last screen. */
export async function createWorkspace(page: Page, path: BusinessPath = {}) {
  await createWorkspaceTo(page, 'done', path);
  await heading(page, `${path.name ?? business.name} is ready.`).waitFor();
}
