import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export const siteOrigin = 'http://localhost:4174';

/** The public website is its own app on its own port; `baseURL` belongs to the shell. */
export const site = (path: string) => `${siteOrigin}${path}`;

/**
 * Opens a page and waits until its script has taken it over. A written page shows its heading before that, and
 * until then its links load pages whole and its controls do nothing, so a test that acted at once would race it.
 */
export async function openSite(page: Page, path: string) {
  await page.goto(site(path));
  await takenOver(page);
}

/** Waits until React has taken the page over, or drawn it. */
export async function takenOver(page: Page) {
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForFunction(() => Object.keys(document.querySelector('h1') ?? {}).some((key) => key.startsWith('__reactProps')));
}

export const careersCode = '**/assets/careers-*.js';

/**
 * Leaves the reader on the message for a page whose code cannot be fetched. The router answers the first failure
 * by loading the address again, which leaves the written page; only a second failure is told to the reader.
 */
export async function openPageThatDidNotLoad(page: Page) {
  await page.route(careersCode, (route) => route.abort('internetdisconnected'));
  await openSite(page, '/about');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Careers' }).click();
  await page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' }).waitFor();
  await openSite(page, '/about');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Careers' }).click();
  await page.getByRole('heading', { level: 1, name: "This page didn't load" }).waitFor();
}

/** Scrolls through the page so everything that arrives on scroll has arrived and stopped moving. */
export async function revealAll(page: Page) {
  for (const element of await page.locator('[data-reveal]').all()) {
    await element.scrollIntoViewIfNeeded();
    await expect(element).toHaveCSS('opacity', '1');
  }
  await settle(page);
}

/** Waits until no transition or animation is running, so a check sees the resting state. */
export async function settle(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'));
}

export async function openSiteFully(page: Page, path: string) {
  await openSite(page, path);
  await revealAll(page);
}
