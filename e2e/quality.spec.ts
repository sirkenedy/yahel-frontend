import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mockApi, signIn } from './support/api';
import { openPageThatDidNotLoad, openSiteFully, settle } from './support/website';

// Every screen is checked in each theme the design system ships.
const themes = [
  { name: 'light', colorScheme: 'light', contrast: 'no-preference' },
  { name: 'dark', colorScheme: 'dark', contrast: 'no-preference' },
  { name: 'light, increased contrast', colorScheme: 'light', contrast: 'more' },
  { name: 'dark, increased contrast', colorScheme: 'dark', contrast: 'more' },
] as const;

async function openCareersFiltered(page: Page) {
  await openSiteFully(page, '/careers');
  await page.getByRole('tab', { name: 'Engineering' }).click();
  await page.getByRole('tabpanel', { name: 'Engineering' }).waitFor();
  await settle(page);
}

const screens: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'sign-in', open: async (page) => void (await page.goto('/sign-in')) },
  {
    name: 'sign-in with errors',
    open: async (page) => {
      await page.goto('/sign-in');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByText('Enter your password').waitFor();
    },
  },
  {
    name: 'sign-in with the password revealed and the tooltip open',
    open: async (page) => {
      await page.goto('/sign-in');
      await page.getByLabel('Password', { exact: true }).fill('a revealed secret');
      await page.getByRole('button', { name: 'Show password' }).click();
      await page.getByLabel('Password', { exact: true }).focus();
      await page.keyboard.press('Tab');
      await page.getByRole('tooltip').waitFor();
    },
  },
  { name: 'home', open: signIn },
  {
    name: 'account',
    open: async (page) => {
      await signIn(page);
      await page.getByRole('link', { name: 'Manage account' }).click();
      await page.getByRole('heading', { name: 'Account' }).waitFor();
    },
  },
  { name: 'website home', open: (page) => openSiteFully(page, '/') },
  { name: 'website about', open: (page) => openSiteFully(page, '/about') },
  { name: 'website page not found', open: (page) => openSiteFully(page, '/no-such-page') },
  { name: 'website careers', open: (page) => openSiteFully(page, '/careers') },
  { name: 'website careers filtered', open: openCareersFiltered },
  {
    name: 'website page that did not load',
    open: async (page) => {
      await openPageThatDidNotLoad(page);
      await settle(page);
    },
  },
  {
    name: 'website about with the menu open',
    open: async (page) => {
      await page.setViewportSize({ width: 390, height: 800 });
      await openSiteFully(page, '/about');
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('dialog', { name: 'Menu' }).waitFor();
      await settle(page);
    },
  },
];

for (const screen of screens) {
  for (const theme of themes) {
    test(`accessibility: ${screen.name}, ${theme.name}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme.colorScheme, contrast: theme.contrast });
      await mockApi(page);
      await screen.open(page);

      // React Aria's hidden live announcer keeps a reference to the label of a control that has since unmounted.
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('[data-live-announcer]').analyze();

      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }

  test(`layout: ${screen.name} has no sideways scroll and reachable targets`, async ({ page, isMobile }) => {
    await mockApi(page);
    await screen.open(page);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const minimum = isMobile ? 44 : 28;
    const small = await page.evaluate((min) => {
      const interactive = [...document.querySelectorAll<HTMLElement>('a[href], button, input:not([type=hidden])')];
      return interactive
        .map((el) => ({ label: el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.getAttribute('name') ?? el.tagName, box: el.getBoundingClientRect() }))
        // Half a pixel of tolerance: browsers report fractional heights such as 43.99 for a 44 px control.
        .filter(({ box }) => box.width > 0 && box.height > 0 && box.height < min - 0.5)
        .map(({ label, box }) => `${label}: ${Math.round(box.height)}px tall`);
    }, minimum);
    expect(small).toEqual([]);
  });
}

test('layout holds at 200% text size', async ({ page }) => {
  await mockApi(page);
  await signIn(page);
  // Wider letter spacing stands in for platforms whose fonts run wider than the development machine's.
  await page.addStyleTag({ content: '* { letter-spacing: 0.06em !important; }' });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('layout mirrors for right-to-left without overflow', async ({ page }) => {
  await mockApi(page);
  await signIn(page);
  await page.evaluate(() => (document.documentElement.dir = 'rtl'));

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const brand = await page.getByRole('link', { name: 'Yahel' }).boundingBox();
  const viewport = page.viewportSize()!;
  expect(brand!.x + brand!.width / 2).toBeGreaterThan(viewport.width / 2);
});

// The public website has no session and its own bar, so each of its pages gets the text-size and direction checks itself.
const publicScreens: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'website home', open: (page) => openSiteFully(page, '/') },
  { name: 'website about', open: (page) => openSiteFully(page, '/about') },
  { name: 'website careers', open: (page) => openSiteFully(page, '/careers') },
  { name: 'website careers filtered', open: openCareersFiltered },
  { name: 'website page not found', open: (page) => openSiteFully(page, '/no-such-page') },
];

for (const screen of publicScreens) {
  test(`layout: ${screen.name} holds at 200% text size`, async ({ page }) => {
    await screen.open(page);
    await page.addStyleTag({ content: '* { letter-spacing: 0.06em !important; }' });
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Create account' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Create account' })).toBeInViewport({ ratio: 1 });
  });

  test(`layout: ${screen.name} mirrors for right-to-left without overflow`, async ({ page }) => {
    await screen.open(page);
    await page.evaluate(() => (document.documentElement.dir = 'rtl'));

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const brand = await page.getByRole('link', { name: 'Yahel home' }).boundingBox();
    const viewport = page.viewportSize()!;
    expect(brand!.x + brand!.width / 2).toBeGreaterThan(viewport.width / 2);
  });
}
