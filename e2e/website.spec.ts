import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { openSite, settle, site, siteOrigin } from './support/website';

const appSignIn = 'http://localhost:5173/sign-in';
const narrow = { width: 390, height: 800 };

const banner = (page: Page) => page.getByRole('banner');
const mainNav = (page: Page) => banner(page).getByRole('navigation', { name: 'Main' });
const footerNav = (page: Page) => page.getByRole('contentinfo').getByRole('navigation', { name: 'Footer' });
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const frames = (page: Page, count = 3) =>
  page.evaluate(async (n) => {
    for (let i = 0; i < n; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  }, count);
const style = (locator: Locator, property: string) => locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property);
/** The block that arrives as one: the nearest ancestor that reveals. */
const revealed = (locator: Locator) => locator.locator('xpath=ancestor-or-self::*[@data-reveal][1]');

test.describe('about page', () => {
  test('about page content', async ({ page }) => {
    await openSite(page, '/about');

    await expect(page).toHaveTitle('About Yahel');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.getByRole('main').locator('h1, h2, h3, p, a').allTextContents()).toEqual([
      'About',
      'Work tools that stay out of the way.',
      'Yahel is one workspace for mail, calendar, files, documents and meetings. It is free for a person and built to run an organisation.',
      'What we hold ourselves to',
      'Clear',
      'Every screen says what it is for, and every control says what it does.',
      'Quiet',
      'Your mail, files and documents lead. The interface steps back.',
      'One identity',
      'Personal and work sit side by side under one sign-in, and never mix silently.',
      'Yours',
      'You can see who has access, take a copy of your data, and leave.',
      'Our story',
      '[YOUR STORY: why Yahel was started, by whom, and when. Two or three sentences.]',
      'Where we are',
      '[YOUR LOCATION and how the team works: office, remote or both.]',
      'Contact: [YOUR EMAIL]',
      'Build it with us.',
      'See open roles',
    ]);
    await expect(page.getByRole('main').getByRole('link', { name: 'See open roles' })).toHaveAttribute('href', '/careers');

    const main = await page.getByRole('main').boundingBox();
    const footer = await page.getByRole('contentinfo').boundingBox();
    expect(footer!.y).toBeGreaterThanOrEqual(main!.y + main!.height - 1);
    await expect(page.getByRole('contentinfo')).toContainText('© Yahel');
  });

  test('each page has its own document title', async ({ page }) => {
    await openSite(page, '/');
    await expect(page).toHaveTitle('Yahel');
    await expect(page.getByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeVisible();

    await openSite(page, '/about');
    await expect(page).toHaveTitle('About Yahel');
  });

  test('an address with nothing behind it says so and links home', async ({ page }) => {
    await openSite(page, '/careers');

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Go to the home page' }).click();
    await expect(page).toHaveURL(site('/'));
  });
});

test.describe('site bar', () => {
  test('the bar names the site, the navigation and one main action', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openSite(page, '/about');

    await expect(banner(page).getByRole('link', { name: 'Yahel home' })).toHaveAttribute('href', '/');
    await expect(mainNav(page).getByRole('link')).toHaveText(['Products', 'About', 'Careers']);
    await expect(mainNav(page).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    await expect(mainNav(page).locator('[aria-current]')).toHaveCount(1);
    await expect(banner(page).getByRole('link', { name: 'Create account' })).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Menu' })).toBeHidden();
  });

  test('the links fold away at 860 wide and below, and stay reachable from the footer', async ({ page }) => {
    await page.setViewportSize({ width: 861, height: 800 });
    await openSite(page, '/');
    await expect(mainNav(page)).toBeVisible();

    await page.setViewportSize({ width: 860, height: 800 });
    await expect(mainNav(page)).toBeHidden();
    await expect(banner(page).getByRole('button', { name: 'Menu' })).toBeVisible();
    await expect(banner(page).getByRole('link', { name: 'Create account' })).toBeVisible();

    await expect(footerNav(page).getByRole('link', { name: 'Careers' })).toHaveAttribute('href', '/careers');
    await footerNav(page).getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(site('/about'));
  });

  test('the menu on a narrow screen is a dialog that takes and returns focus', async ({ page, hasTouch }) => {
    await page.setViewportSize(narrow);
    await openSite(page, '/about');
    const menu = banner(page).getByRole('button', { name: 'Menu' });
    const dialog = page.getByRole('dialog', { name: 'Menu' });

    await menu.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link')).toHaveText(['Products', 'About', 'Careers', 'Sign in']);
    await expect(dialog.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', appSignIn);
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();

    await menu.click();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();

    await menu.click();
    await expect(dialog).toBeVisible();
    // The scrim takes presses from its first painted frame; a press in the frame it is inserted would land on the page.
    await settle(page);
    if (hasTouch) await page.touchscreen.tap(narrow.width / 2, 40);
    else await page.mouse.click(narrow.width / 2, 40);
    await expect(dialog).toBeHidden();

    await menu.click();
    await dialog.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(site('/#products'));
    await expect(page.getByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('create account links to sign-in', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openSite(page, '/about');
    await expect(banner(page).getByRole('link', { name: 'Create account' })).toHaveAttribute('href', appSignIn);
    await expect(banner(page).getByRole('link', { name: 'Sign in' })).toHaveCount(0);

    await openSite(page, '/');
    await expect(banner(page).getByRole('link', { name: 'Create account' })).toHaveAttribute('href', appSignIn);
    await expect(banner(page).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', appSignIn);
    await expect(page.getByRole('main').getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', appSignIn);
  });

  test('bar gains glass after scrolling', async ({ page }) => {
    await openSite(page, '/about');
    const glass = () => banner(page).evaluate((el) => getComputedStyle(el, '::before').opacity);
    const layout = () =>
      page.evaluate(() => ({
        bar: document.querySelector('header')!.offsetHeight,
        heading: Math.round(document.querySelector('h1')!.getBoundingClientRect().top + window.scrollY),
        page: document.documentElement.scrollHeight,
      }));
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('opacity', '1');
    await settle(page);
    const atTop = await layout();
    expect(await glass()).toBe('0');
    expect(await banner(page).evaluate((el) => Number.parseFloat(getComputedStyle(el, '::before').borderBlockEndWidth))).toBeGreaterThan(0);

    await page.evaluate(() => window.scrollTo(0, 8));
    await frames(page);
    expect(await glass()).toBe('0');

    await page.evaluate(() => window.scrollTo(0, 9));
    await expect.poll(glass).toBe('1');
    expect(await layout()).toEqual(atTop);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(glass).toBe('0');
    expect(await layout()).toEqual(atTop);
  });
});

test.describe('motion', () => {
  test('reveal happens once', async ({ page }) => {
    await openSite(page, '/about');
    const card = revealed(page.getByRole('heading', { name: 'Our story' }));
    await expect(card).toHaveCSS('opacity', '0');

    // Bring a set share of the card above the line the observer watches: 8% up from the bottom of the screen.
    const showShare = (share: number) =>
      card.evaluate((el, visible) => {
        const box = el.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + box.top + box.height * visible - window.innerHeight * 0.92);
      }, share);

    await showShare(0.05);
    await frames(page);
    expect(await style(card, 'opacity')).toBe('0');

    await showShare(0.3);
    await expect(card).toHaveCSS('opacity', '1');
    await expect(card).toHaveCSS('transform', 'none');

    await page.evaluate(() => window.scrollTo(0, 0));
    await frames(page);
    expect(await style(card, 'opacity')).toBe('1');
    await card.scrollIntoViewIfNeeded();
    await frames(page);
    expect(await style(card, 'opacity')).toBe('1');
    expect(await style(card, 'transform')).toBe('none');
  });

  test('siblings in a group start 70 ms apart', async ({ page }) => {
    await openSite(page, '/about');
    const delays = [];
    for (const name of ['Clear', 'Quiet', 'One identity', 'Yours']) {
      delays.push((await style(revealed(page.getByRole('heading', { name })), 'transition-delay')).split(',')[0]);
    }

    expect(delays).toEqual(['0s', '0.07s', '0.14s', '0.21s']);
  });

  test('reduced motion fades only', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSite(page, '/about');
    const card = revealed(page.getByRole('heading', { name: 'Where we are' }));

    await expect(card).toHaveCSS('opacity', '0');
    expect(await style(card, 'transform')).toBe('none');
    expect(await style(card, 'transition-property')).toBe('opacity');
    expect(await style(card, 'transition-duration')).toBe('0.18s');
    expect(await style(card, 'transition-delay')).toBe('0s');

    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveCSS('opacity', '1');
    expect(await style(card, 'transform')).toBe('none');

    await expect.poll(() => banner(page).evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('1');
    expect(await banner(page).evaluate((el) => getComputedStyle(el, '::before').transform)).toBe('none');
  });
});

test.describe('navigation', () => {
  test('every link is reached in reading order with a visible focus ring', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await openSite(page, '/about');

    const reached = [];
    for (let presses = 0; presses < 11; presses += 1) {
      await page.keyboard.press('Tab');
      reached.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const ring = getComputedStyle(el);
          return { name: el.getAttribute('aria-label') ?? el.textContent, ring: ring.outlineStyle === 'solid' && Number.parseFloat(ring.outlineWidth) >= 2 && !/rgba\(.*, 0\)|transparent/.test(ring.outlineColor) };
        }),
      );
    }

    expect(reached.map((link) => link.name)).toEqual(['Yahel home', 'Products', 'About', 'Careers', 'Create account', 'See open roles', 'Home', 'About', 'Careers', 'Privacy', 'Terms']);
    expect(reached.filter((link) => !link.ring)).toEqual([]);
  });

  test('Enter on the closing action goes to the open roles', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await openSite(page, '/about');

    await page.getByRole('link', { name: 'See open roles' }).focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(site('/careers'));
  });

  test('navigation keeps the document', async ({ page }) => {
    await page.addInitScript(() => {
      const start = document.startViewTransition?.bind(document);
      if (!start) return;
      document.startViewTransition = (...args: Parameters<typeof start>) => {
        document.documentElement.dataset.transitions = String(Number(document.documentElement.dataset.transitions ?? 0) + 1);
        return start(...args);
      };
    });
    await openSite(page, '/about');
    const transitions = () => page.evaluate(() => Number(document.documentElement.dataset.transitions ?? 0));
    const before = await transitions();
    await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''));
    await footerNav(page).getByRole('link', { name: 'Home' }).scrollIntoViewIfNeeded();
    const leftAt = await scrollY(page);
    expect(leftAt).toBeGreaterThan(200);

    await footerNav(page).getByRole('link', { name: 'Home' }).click();

    await expect(page).toHaveURL(site('/'));
    await expect(page.getByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-same-document', '');
    await expect.poll(() => scrollY(page)).toBe(0);
    // Pages cross-fade where the browser can; where it cannot, the new page simply appears.
    if (await page.evaluate(() => 'startViewTransition' in document)) expect(await transitions()).toBe(before + 1);

    await page.goBack();

    await expect(page).toHaveURL(site('/about'));
    await expect(page.locator('html')).toHaveAttribute('data-same-document', '');
    await expect.poll(async () => Math.abs((await scrollY(page)) - leftAt)).toBeLessThanOrEqual(2);
  });

  test('no third-party requests', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));

    await openSite(page, '/');
    await openSite(page, '/about');
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');

    expect(requested.length).toBeGreaterThan(0);
    expect(requested.filter((url) => !url.startsWith('data:') && new URL(url).origin !== siteOrigin)).toEqual([]);
  });
});
