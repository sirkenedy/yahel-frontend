import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export const siteOrigin = 'http://localhost:4174';

/** The public website is its own app on its own port; `baseURL` belongs to the shell. */
export const site = (path: string) => `${siteOrigin}${path}`;

export async function openSite(page: Page, path: string) {
  await page.goto(site(path));
  await page.getByRole('heading', { level: 1 }).waitFor();
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
