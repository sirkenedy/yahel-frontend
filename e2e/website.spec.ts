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
    await expect(page.getByRole('main').getByRole('link', { name: 'Create an account' }).first()).toHaveAttribute('href', appSignIn);
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

  test('the home hero starts with its first block, then one every 70 ms', async ({ page }) => {
    await openSite(page, '/');
    const blocks = [page.getByText('Yahel Workspace'), page.getByRole('heading', { level: 1 }), page.getByText(/^Mail, calendar, files/), page.getByRole('main').getByRole('link', { name: 'Create an account' }).first()];
    const delays = [];
    for (const block of blocks) delays.push((await style(revealed(block), 'transition-delay')).split(',')[0]);

    expect(delays).toEqual(['0s', '0.07s', '0.14s', '0.21s']);
  });

  test('a printed page shows everything, scrolled to or not', async ({ page }) => {
    await openSite(page, '/about');
    const card = revealed(page.getByRole('heading', { name: 'Where we are' }));
    await expect(card).toHaveCSS('opacity', '0');

    await page.emulateMedia({ media: 'print' });

    await expect(card).toHaveCSS('opacity', '1');
    await expect(card).toHaveCSS('transform', 'none');
  });

  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`moving between pages fades the old page out over the new one (motion: ${motion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await page.addInitScript(() => {
        const start = document.startViewTransition?.bind(document);
        if (!start) return;
        document.startViewTransition = (...args: Parameters<typeof start>) => {
          const transition = start(...args);
          void transition.ready.then(() => {
            const layer = (name: string) => {
              const running = document.getAnimations().filter((animation) => (animation.effect as KeyframeEffect).pseudoElement === name);
              return {
                durations: running.map((animation) => animation.effect!.getTiming().duration),
                properties: [...new Set(running.flatMap((animation) => (animation.effect as KeyframeEffect).getKeyframes().flatMap((frame) => Object.keys(frame))))].filter((key) => !['offset', 'computedOffset', 'easing', 'composite'].includes(key)),
                zIndex: getComputedStyle(document.documentElement, name).zIndex,
              };
            };
            document.documentElement.dataset.pageChange = JSON.stringify({ old: layer('::view-transition-old(root)'), next: layer('::view-transition-new(root)') });
          });
          return transition;
        };
      });
      await openSite(page, '/about');
      test.skip(!(await page.evaluate(() => 'startViewTransition' in document)), 'this browser has no view transitions; the new page simply appears');
      await page.evaluate(() => delete document.documentElement.dataset.pageChange);

      await footerNav(page).getByRole('link', { name: 'Home' }).click();
      await expect(page).toHaveURL(site('/'));
      await expect(page.locator('html')).toHaveAttribute('data-page-change', /old/);

      const change = JSON.parse((await page.locator('html').getAttribute('data-page-change'))!);
      expect(change.old).toEqual({ durations: [180], properties: ['opacity'], zIndex: '1' });
      expect(change.next).toEqual({ durations: [], properties: [], zIndex: 'auto' });
    });
  }

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

  test('the closing action opens the open roles', async ({ page }) => {
    await openSite(page, '/about');
    const action = page.getByRole('main').getByRole('link', { name: 'See open roles' });
    await action.scrollIntoViewIfNeeded();
    await expect(revealed(action)).toHaveCSS('opacity', '1');

    await action.click();

    await expect(page).toHaveURL(site('/careers'));
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

  test('headings brought into view stop below the bar', async ({ page }) => {
    await openSite(page, '/about');

    const gap = await page.getByRole('heading', { name: 'Our story' }).evaluate((heading) => {
      heading.scrollIntoView();
      return heading.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom;
    });

    expect(gap).toBeGreaterThanOrEqual(0);
  });

  test('the website keeps nothing in web storage but its scroll positions', async ({ page }) => {
    await openSite(page, '/about');
    await footerNav(page).getByRole('link', { name: 'Home' }).scrollIntoViewIfNeeded();
    await footerNav(page).getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(site('/'));
    await page.goBack();
    await expect(page).toHaveURL(site('/about'));
    await page.reload();
    await page.getByRole('heading', { level: 1 }).waitFor();

    const stored = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
    expect(stored.local).toEqual([]);
    expect(stored.session).toEqual(['tsr-scroll-restoration-v1_3']);
    // The only other key the router may write is its marker for a page chunk that failed to load.
    expect(stored.session.filter((key) => key !== 'tsr-scroll-restoration-v1_3' && !key.startsWith('tanstack_router_reload:'))).toEqual([]);
  });
});

test.describe('reader preferences', () => {
  const luminance = (colour: string) => {
    const [r, g, b] = colour.match(/[\d.]+/g)!.slice(0, 3).map((value) => {
      const channel = Number(value) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (high + 0.05) / (low + 0.05);
  };

  for (const theme of [
    { name: 'light', colorScheme: 'light', contrast: 'no-preference', minimum: 3 },
    { name: 'dark', colorScheme: 'dark', contrast: 'no-preference', minimum: 3 },
    { name: 'light, increased contrast', colorScheme: 'light', contrast: 'more', minimum: 4.5 },
    { name: 'dark, increased contrast', colorScheme: 'dark', contrast: 'more', minimum: 4.5 },
  ] as const) {
    test(`the focus ring on the closing band stands out from the band: ${theme.name}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme.colorScheme, contrast: theme.contrast });
      await openSite(page, '/about');
      const action = page.getByRole('main').getByRole('link', { name: 'See open roles' });
      await action.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(action).toBeFocused();

      const colours = await action.evaluate((el) => {
        const ring = getComputedStyle(el);
        return { style: ring.outlineStyle, width: Number.parseFloat(ring.outlineWidth), ring: ring.outlineColor, band: getComputedStyle(el.parentElement!).backgroundColor };
      });

      expect(colours.style).toBe('solid');
      expect(colours.width).toBeGreaterThanOrEqual(2);
      expect(contrast(colours.ring, colours.band)).toBeGreaterThanOrEqual(theme.minimum);
    });
  }

  test('with increased contrast, links in the bar, the menu and the footer are underlined', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await openSite(page, '/');
    const underlined = async (links: Locator) => {
      const lines = await links.evaluateAll((all) => all.map((link) => `${link.textContent}: ${getComputedStyle(link).textDecorationLine}`));
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.filter((line) => !line.endsWith(': underline'))).toEqual([]);
    };

    await underlined(mainNav(page).getByRole('link'));
    await underlined(banner(page).getByRole('link', { name: 'Yahel home' }));
    await underlined(banner(page).getByRole('link', { name: 'Sign in' }));
    await underlined(footerNav(page).getByRole('link'));

    await page.setViewportSize(narrow);
    await banner(page).getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await underlined(page.getByRole('dialog', { name: 'Menu' }).getByRole('link'));
  });
});

test.describe('phone menu', () => {
  const scrollLocked = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).overflowY === 'hidden');

  test('going Back closes the menu and frees the page', async ({ page }) => {
    await page.setViewportSize(narrow);
    await openSite(page, '/');
    await footerNav(page).getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(site('/about'));
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await banner(page).getByRole('button', { name: 'Menu' }).click();
    await expect(dialog).toBeVisible();
    expect(await scrollLocked(page)).toBe(true);

    await page.goBack();

    await expect(page).toHaveURL(site('/'));
    await expect(dialog).toBeHidden();
    await expect.poll(() => scrollLocked(page)).toBe(false);
    await expect(page.getByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeVisible();
  });

  test('widening the window until the button folds away closes the menu', async ({ page }) => {
    await page.setViewportSize(narrow);
    await openSite(page, '/about');
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await banner(page).getByRole('button', { name: 'Menu' }).click();
    await expect(dialog).toBeVisible();

    await page.setViewportSize({ width: 860, height: 800 });
    await expect(dialog).toBeVisible();

    await page.setViewportSize({ width: 900, height: 800 });
    await expect(dialog).toBeHidden();
    await expect.poll(() => scrollLocked(page)).toBe(false);
    await expect(mainNav(page)).toBeVisible();
  });

  test('a menu that cannot load says so, keeps the page, and opens on the next press', async ({ page }) => {
    await page.setViewportSize(narrow);
    await page.route('**/assets/site-menu-sheet-*.js', (route) => route.abort('internetdisconnected'));
    await openSite(page, '/about');
    const menu = banner(page).getByRole('button', { name: 'Menu' });

    await menu.click();

    await expect(page.getByRole('alert')).toHaveText("Can't open the menu. Check your connection, then select Menu again.");
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Work tools that stay out of the way.' })).toBeVisible();
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('tanstack_router_reload')))).toEqual([]);

    await page.unroute('**/assets/site-menu-sheet-*.js');
    await menu.click();

    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('home page', () => {
  const productNames = ['Mail', 'Calendar', 'Drive', 'Docs', 'Sheets', 'Slides', 'Chat', 'Meet', 'Admin'];
  const wide = { width: 1280, height: 800 };
  const main = (page: Page) => page.getByRole('main');
  const dock = (page: Page) => main(page).getByRole('list', { name: 'Products' });
  const tabs = (page: Page) => page.getByRole('tablist', { name: 'Products' });
  const tab = (page: Page, name: string) => tabs(page).getByRole('tab', { name, exact: true });
  const productsButton = (page: Page) => mainNav(page).getByRole('button', { name: 'Products' });
  const heroWindow = (page: Page) => main(page).getByRole('img', { name: /^The Yahel home screen/ });
  /** The window's transform, as numbers: how far it is scaled and moved, and whether it is tilted out of the plane. */
  const pose = (page: Page) =>
    heroWindow(page).evaluate((el) => {
      const value = getComputedStyle(el).transform;
      if (value === 'none') return { none: true, scale: 1, rise: 0, tilted: false };
      const matrix = new DOMMatrix(value);
      return { none: false, scale: Math.round(matrix.m11 * 1000) / 1000, rise: Math.round(matrix.m42 * 10) / 10, tilted: Math.abs(matrix.m23) > 0.0001 };
    });
  /** A product's panel, shown or not: only the shown one is a tab panel to a reader; the rest wait, inert. */
  const panelOf = (page: Page, name: string) => page.locator('h3', { hasText: new RegExp(`^${name}$`) }).locator('xpath=ancestor::*[@role="tabpanel" or @inert][1]');
  /** Every scroll position the page passes through over the next frames, starting now: two for a jump, many for a glide. */
  const scrollPositions = (page: Page) =>
    page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const seen = new Set([window.scrollY]);
          let frame = 0;
          const tick = () => {
            seen.add(window.scrollY);
            if ((frame += 1) < 90) requestAnimationFrame(tick);
            else resolve([...seen]);
          };
          requestAnimationFrame(tick);
        }),
    );
  const topBelowBar = (page: Page, id: string) =>
    page.evaluate((target) => Math.round(document.getElementById(target)!.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom), id);

  test('home shows every section in order', async ({ page }) => {
    await openSite(page, '/');

    await expect(main(page).getByRole('heading', { level: 1 })).toHaveText('Everything your work needs. One account.');
    await expect(main(page).getByRole('heading', { level: 2 })).toHaveText([
      'Nine apps. One way of working.',
      'For you. For your whole organisation.',
      'You can always see who has access.',
      'Start free.',
      'One account for all of it.',
    ]);
    expect(await main(page).locator('.ws-eyebrow').allTextContents()).toEqual(['Yahel Workspace', 'Products', 'Accounts', 'Security and control', 'Plans']);
    const order = await page.evaluate(() => {
      const top = (el: Element | null) => el!.getBoundingClientRect().top + window.scrollY;
      return [top(document.querySelector('h1')), top(document.querySelector('main [role="img"]')), ...['products', 'accounts', 'security', 'plans'].map((id) => top(document.getElementById(id))), top(document.querySelector('footer'))];
    });
    expect(order).toEqual([...order].sort((a, b) => a - b));
    await expect(heroWindow(page)).toBeVisible();
  });

  test('the hero has one filled action; the second is a plain link', async ({ page }) => {
    await openSite(page, '/');
    const create = main(page).getByRole('link', { name: 'Create an account' }).first();
    const business = main(page).getByRole('link', { name: 'Set up your business' }).first();

    await expect(create).toHaveAttribute('href', appSignIn);
    await expect(business).toHaveAttribute('href', '/#accounts');
    expect(await style(create, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(await style(business, 'background-color')).toBe('rgba(0, 0, 0, 0)');
  });

  test('home lists every product', async ({ page }) => {
    await page.setViewportSize(wide);
    await openSite(page, '/');

    await expect(dock(page).getByRole('link')).toHaveCount(9);
    expect(await dock(page).getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('aria-label')))).toEqual(productNames);
    await expect(tabs(page).getByRole('tab')).toHaveText(productNames);
    await expect(page.getByRole('contentinfo').getByRole('list', { name: 'Products', exact: true }).getByRole('link')).toHaveText(productNames.slice(0, 5));
    await expect(page.getByRole('contentinfo').getByRole('list', { name: 'More products' }).getByRole('link')).toHaveText(productNames.slice(5));

    await productsButton(page).click();
    const menuLinks = mainNav(page).getByRole('link', { name: /yahel\.com$/ });
    await expect(menuLinks).toHaveCount(9);
    expect(await menuLinks.evaluateAll((links) => links.map((link) => [...link.children].map((part) => part.textContent).filter(Boolean).join(' ')))).toEqual(productNames.map((name) => `${name} ${name.toLowerCase()}.yahel.com`));
  });

  test('switch product by pointer', async ({ page }) => {
    await openSite(page, '/');
    await tabs(page).scrollIntoViewIfNeeded();
    await expect(tab(page, 'Mail')).toHaveAttribute('aria-selected', 'true');
    const panel = page.getByRole('tabpanel');
    await expect(panel).toHaveCount(1);
    await expect(panel.getByRole('heading', { level: 3 })).toHaveText('Mail');
    await expect(panel.getByText('Email on your personal address or your organisation’s domain.')).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Open mail.yahel.com' })).toHaveAttribute('href', '/#products');

    await tab(page, 'Sheets').click();

    await expect(tab(page, 'Sheets')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Mail')).toHaveAttribute('aria-selected', 'false');
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAccessibleName('Sheets');
    await expect(panel.getByRole('heading', { level: 3 })).toHaveText('Sheets');
    await expect(panel.getByText('Spreadsheets for plans, budgets and data.')).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Open sheets.yahel.com' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open mail.yahel.com' })).toHaveCount(0);
  });

  test('switch product by keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await openSite(page, '/');
    await tab(page, 'Mail').focus();

    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'Calendar')).toBeFocused();
    await expect(tab(page, 'Calendar')).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('End');
    await expect(tab(page, 'Admin')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(tab(page, 'Mail')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 'Admin')).toHaveAttribute('aria-selected', 'true');

    // The list is one stop: Tab goes on to the one panel that can be reached, never into the other eight.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Open admin.yahel.com' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(main(page).getByRole('link', { name: 'Create a personal account' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(tab(page, 'Admin')).toBeFocused();
  });

  test('for a reader of a right-to-left language the arrow keys follow the direction the tabs are drawn in', async ({ browser, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    const context = await browser.newContext({ locale: 'ar' });
    const page = await context.newPage();
    await openSite(page, '/');
    await tab(page, 'Mail').focus();

    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 'Calendar')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'Mail')).toHaveAttribute('aria-selected', 'true');
    await context.close();
  });

  test('choose a product from the menu', async ({ page }) => {
    await page.setViewportSize(wide);
    await openSite(page, '/');
    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(mainNav(page).getByRole('link', { name: /yahel\.com$/ })).toHaveCount(0);

    await productsButton(page).click();
    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'true');
    await mainNav(page).getByRole('link', { name: 'Slides slides.yahel.com' }).click();

    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(tab(page, 'Slides')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Slides')).toBeFocused();
    await expect(page).toHaveURL(site('/#products'));
    await expect.poll(() => topBelowBar(page, 'products')).toBe(8);
    await expect(page.getByRole('tabpanel').getByRole('heading', { level: 3 })).toHaveText('Slides');
  });

  test('the Products menu closes on Escape, returning focus, and on a press outside it', async ({ page }) => {
    await page.setViewportSize(wide);
    await openSite(page, '/');
    const firstLink = mainNav(page).getByRole('link', { name: 'Mail mail.yahel.com' });

    await productsButton(page).click();
    await expect(firstLink).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(firstLink).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(productsButton(page)).toBeFocused();
    await expect(firstLink).toBeHidden();

    await productsButton(page).click();
    await expect(firstLink).toBeVisible();
    await main(page).getByRole('heading', { level: 1 }).click({ position: { x: 4, y: 4 }, force: true });
    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(firstLink).toBeHidden();
  });

  test('below 860 wide the Products menu button is not shown', async ({ page }) => {
    await page.setViewportSize({ width: 860, height: 800 });
    await openSite(page, '/');

    await expect(page.getByRole('button', { name: 'Products' })).toBeHidden();
    await expect(banner(page).getByRole('button', { name: 'Menu' })).toBeVisible();
  });

  test('choose a product from a hero icon, and from the footer', async ({ page }) => {
    await openSite(page, '/');

    await dock(page).getByRole('link', { name: 'Meet' }).click();
    await expect(tab(page, 'Meet')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Meet')).toBeFocused();
    await expect.poll(() => topBelowBar(page, 'products')).toBe(8);

    const footerLink = page.getByRole('contentinfo').getByRole('link', { name: 'Drive' });
    await footerLink.scrollIntoViewIfNeeded();
    await footerLink.click();
    await expect(tab(page, 'Drive')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Drive')).toBeFocused();
    await expect.poll(() => topBelowBar(page, 'products')).toBe(8);
  });

  test('hero window follows the scroll', async ({ page }) => {
    await openSite(page, '/');
    // On a phone the window starts below the fold: let it arrive, then go back to the top.
    await heroWindow(page).scrollIntoViewIfNeeded();
    await expect(revealed(heroWindow(page))).toHaveCSS('opacity', '1');
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    const still = () =>
      heroWindow(page).evaluate((el) => {
        const box = getComputedStyle(el);
        return { width: el.offsetWidth, height: el.offsetHeight, page: document.documentElement.scrollHeight, opacity: box.opacity };
      });
    const atTop = await still();

    await expect.poll(() => pose(page)).toEqual({ none: false, scale: 0.94, rise: 0, tilted: true });
    expect(await style(heroWindow(page), 'transition-property')).toBe('transform');

    await page.evaluate(() => window.scrollTo(0, 260));
    await expect.poll(() => pose(page)).toEqual({ none: false, scale: 0.97, rise: -16, tilted: true });
    expect(await still()).toEqual(atTop);

    await page.evaluate(() => window.scrollTo(0, 520));
    await expect.poll(() => pose(page)).toEqual({ none: false, scale: 1, rise: -32, tilted: false });

    await page.evaluate(() => window.scrollTo(0, 900));
    await frames(page);
    await expect.poll(() => pose(page)).toEqual({ none: false, scale: 1, rise: -32, tilted: false });
    expect(await still()).toEqual(atTop);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => pose(page)).toEqual({ none: false, scale: 0.94, rise: 0, tilted: true });
  });

  test('scrolling the hero re-renders nothing: the window is moved by a style property alone', async ({ page }) => {
    await openSite(page, '/');
    // Everything in the hero has arrived, so what is seen below is the scroll's doing alone.
    await heroWindow(page).scrollIntoViewIfNeeded();
    await expect(revealed(heroWindow(page))).toHaveCSS('opacity', '1');
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await page.evaluate(() => {
      const seen: string[] = [];
      new MutationObserver((records) => {
        for (const record of records) seen.push(`${record.type} ${record.attributeName ?? ''} ${(record.target as Element).tagName}.${(record.target as Element).className}`);
      }).observe(document.querySelector('main section')!, { subtree: true, childList: true, attributes: true, characterData: true });
      (window as unknown as { seen: string[] }).seen = seen;
    });

    for (const y of [60, 180, 300, 420]) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await frames(page);
    }

    const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen);
    expect(seen.length).toBeGreaterThan(0);
    expect([...new Set(seen)]).toEqual(['attributes style DIV.home-window']);
  });

  test('the icons pop in once, in order, 70 ms apart', async ({ page }) => {
    await openSite(page, '/');
    const icons = await dock(page).getByRole('listitem').all();
    expect(icons).toHaveLength(9);

    const delays = [];
    for (const icon of icons) delays.push(Math.round(Number.parseFloat((await style(icon, 'transition-delay')).split(',')[0]!) * 1000));
    expect(delays).toEqual([280, 350, 420, 490, 560, 630, 700, 770, 840]);
    expect(await style(icons[0]!, 'transition-duration')).toBe('0.42s, 0.62s');
    expect(await style(icons[0]!, 'transition-timing-function')).toBe('cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.3, 1.3, 0.4, 1)');

    for (const icon of icons) {
      await expect(icon).toHaveCSS('opacity', '1');
      await expect(icon).toHaveCSS('transform', 'none');
    }
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await frames(page);
    for (const icon of icons) expect(await style(icon, 'opacity')).toBe('1');
  });

  test('an icon waiting to pop in is small and low', async ({ page }) => {
    await page.addInitScript(() => {
      // Hold the observer back, so the waiting state can be read before anything arrives.
      window.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      } as unknown as typeof IntersectionObserver;
    });
    await openSite(page, '/');
    const icon = dock(page).getByRole('listitem').first();

    await expect(icon).toHaveCSS('opacity', '0');
    expect(await style(icon, 'transform')).toBe('matrix(0.86, 0, 0, 0.86, 0, 18)');
  });

  test('switching product fades the old panel out and brings the new one in, rising', async ({ page }) => {
    await openSite(page, '/');
    await tabs(page).scrollIntoViewIfNeeded();
    await expect(revealed(tabs(page))).toHaveCSS('opacity', '1');
    await settle(page);

    expect(await style(panelOf(page, 'Docs'), 'opacity')).toBe('0');
    expect(await style(panelOf(page, 'Docs'), 'transform')).toBe('matrix(0.985, 0, 0, 0.985, 0, 16)');
    const before = await panelOf(page, 'Mail').boundingBox();
    const waiting = await panelOf(page, 'Docs').evaluate((el) => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth }));
    expect(waiting).toEqual(await panelOf(page, 'Mail').evaluate((el) => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth })));

    await tab(page, 'Docs').click();

    expect(await style(panelOf(page, 'Mail'), 'transition-property')).toBe('opacity, transform, visibility');
    expect(await style(panelOf(page, 'Mail'), 'transition-duration')).toBe('0.28s, 0.42s, 0s');
    expect(await style(panelOf(page, 'Docs'), 'transition-duration')).toBe('0.42s, 0.62s, 0s');
    await expect(panelOf(page, 'Docs')).toHaveCSS('opacity', '1');
    await expect(panelOf(page, 'Docs')).toHaveCSS('transform', 'none');
    await expect(panelOf(page, 'Mail')).toHaveCSS('opacity', '0');
    await expect(panelOf(page, 'Mail')).toHaveCSS('visibility', 'hidden');
    expect((await panelOf(page, 'Docs').boundingBox())!.y).toBe(before!.y);
  });

  test('cards lift under a pointer and settle when it leaves', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover belongs to a pointer');
    await openSite(page, '/');
    const card = main(page).getByRole('heading', { name: 'For yourself' }).locator('xpath=..');
    await card.scrollIntoViewIfNeeded();
    await expect(revealed(card)).toHaveCSS('opacity', '1');
    await settle(page);

    await card.hover({ position: { x: 20, y: 20 } });
    await expect(card).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -4)');
    expect(await style(card, 'transition-duration')).toBe('0.28s');

    await page.mouse.move(0, 0);
    await expect(card).toHaveCSS('transform', 'none');
  });

  test('reduced motion removes movement', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(wide);
    await openSite(page, '/');

    for (const y of [0, 260, 520]) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await frames(page);
      expect(await pose(page)).toEqual({ none: true, scale: 1, rise: 0, tilted: false });
    }
    expect(await heroWindow(page).evaluate((el) => (el as HTMLElement).style.getPropertyValue('--scroll-progress'))).toBe('');

    const icon = dock(page).getByRole('listitem').last();
    expect(await style(icon, 'transition-property')).toBe('opacity');
    expect(await style(icon, 'transition-duration')).toBe('0.18s');
    expect(await style(icon, 'transition-delay')).toBe('0s');
    expect(await style(icon, 'transform')).toBe('none');

    expect(await style(panelOf(page, 'Chat'), 'transform')).toBe('none');
    await tab(page, 'Chat').click();
    expect(await style(panelOf(page, 'Chat'), 'transform')).toBe('none');
    expect(await style(panelOf(page, 'Mail'), 'transform')).toBe('none');
    expect((await style(panelOf(page, 'Chat'), 'transition-duration')).split(',')[0]).toBe('0.18s');
    await expect(panelOf(page, 'Chat')).toHaveCSS('opacity', '1');

    const card = main(page).getByRole('heading', { name: 'For yourself' }).locator('xpath=..');
    await card.scrollIntoViewIfNeeded();
    await card.hover({ position: { x: 20, y: 20 }, force: true });
    await frames(page);
    expect(await style(card, 'transform')).toBe('none');

    // A link to a section takes the reader there at once.
    await page.evaluate(() => window.scrollTo(0, 0));
    const jump = scrollPositions(page);
    await mainNav(page).getByRole('link', { name: 'Plans' }).click();
    expect(await jump).toHaveLength(2);
    expect(await topBelowBar(page, 'plans')).toBe(8);
    await productsButton(page).click();
    expect(await style(mainNav(page).getByRole('link', { name: 'Mail mail.yahel.com' }).locator('xpath=..'), 'transform')).toBe('none');
  });

  test('section links land below the bar', async ({ page }) => {
    await page.setViewportSize(wide);
    await openSite(page, '/');

    for (const [name, id, heading] of [
      ['For business', 'accounts', 'For you. For your whole organisation.'],
      ['Security', 'security', 'You can always see who has access.'],
      ['Plans', 'plans', 'Start free.'],
    ] as const) {
      await mainNav(page).getByRole('link', { name, exact: true }).click();

      await expect(page).toHaveURL(site(`/#${id}`));
      await expect.poll(() => topBelowBar(page, id)).toBe(8);
      await expect(main(page).getByRole('heading', { level: 2, name: heading })).toBeInViewport({ ratio: 1 });
      const gap = await main(page).getByRole('heading', { level: 2, name: heading }).evaluate((el) => el.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom);
      expect(gap).toBeGreaterThan(0);
    }

    await main(page).getByRole('link', { name: 'Set up your business' }).first().evaluate((link: HTMLElement) => link.click());
    await expect(page).toHaveURL(site('/#accounts'));
    await expect.poll(() => topBelowBar(page, 'accounts')).toBe(8);
  });

  test('a section link glides to its section rather than jumping', async ({ page }) => {
    await page.setViewportSize(wide);
    await openSite(page, '/');

    const watching = scrollPositions(page);
    await mainNav(page).getByRole('link', { name: 'Plans', exact: true }).click();
    const positions = await watching;

    expect(positions.length).toBeGreaterThan(5);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    await expect.poll(() => topBelowBar(page, 'plans')).toBe(8);
  });

  test('the phone menu leads to the home page’s sections', async ({ page }) => {
    await page.setViewportSize(narrow);
    await openSite(page, '/');
    const dialog = page.getByRole('dialog', { name: 'Menu' });

    await banner(page).getByRole('button', { name: 'Menu' }).click();
    await expect(dialog.getByRole('link')).toHaveText(['Products', 'For business', 'Security', 'Plans', 'About', 'Careers', 'Sign in']);
    await dialog.getByRole('link', { name: 'Plans' }).click();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(site('/#plans'));
    await expect.poll(() => topBelowBar(page, 'plans')).toBe(8);
  });

  test('plans show placeholders', async ({ page }) => {
    await openSite(page, '/');
    const plans = page.locator('#plans');

    expect(await plans.locator('h3, h3 ~ p').allTextContents()).toEqual(['Personal', 'Free', 'Every app, with [STORAGE] of storage.', 'Business', '[YOUR PRICE]', 'Per person, each month. Your domain, admin controls and [STORAGE] each.']);
    // Nothing undecided is stated: outside the picture of the product, the page carries no figure at all.
    const text = await main(page).evaluate((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelector('[role="img"]')!.remove();
      return copy.textContent ?? '';
    });
    expect(text).not.toMatch(/\d|£|\$|€|₦|\bGB\b|\bTB\b/);
  });

  test('every account action on the home page ends at sign-in on the app', async ({ page }) => {
    await page.setViewportSize(wide);
    await openSite(page, '/');

    const actions = page.getByRole('link', { name: /^(Sign in|Create account|Create an account|Create a personal account)$/ });
    await expect(actions).toHaveCount(5);
    expect(new Set(await actions.evaluateAll((links) => links.map((link) => link.getAttribute('href'))))).toEqual(new Set([appSignIn]));
    await expect(page.locator('#accounts').getByRole('link', { name: 'Set up your business' })).toHaveAttribute('href', appSignIn);
  });

  test('the home page keeps to its own origin with every product shown', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));
    await openSite(page, '/');

    for (const name of productNames) await tab(page, name).click();
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');

    expect(requested.filter((url) => !url.startsWith('data:') && new URL(url).origin !== siteOrigin)).toEqual([]);
  });

  for (const theme of [
    { name: 'light', colorScheme: 'light', contrast: 'no-preference', minimum: 3 },
    { name: 'dark', colorScheme: 'dark', contrast: 'no-preference', minimum: 3 },
    { name: 'light, increased contrast', colorScheme: 'light', contrast: 'more', minimum: 4.5 },
    { name: 'dark, increased contrast', colorScheme: 'dark', contrast: 'more', minimum: 4.5 },
  ] as const) {
    test(`the focus ring on the inverse account card stands out from the card: ${theme.name}`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
      await page.emulateMedia({ colorScheme: theme.colorScheme, contrast: theme.contrast });
      await openSite(page, '/');
      const action = page.locator('#accounts').getByRole('link', { name: 'Set up your business' });
      await action.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(action).toBeFocused();

      const colours = await action.evaluate((el) => ({ ring: getComputedStyle(el).outlineColor, style: getComputedStyle(el).outlineStyle, card: getComputedStyle(el.parentElement!).backgroundColor }));
      const luminance = (colour: string) => {
        const [r, g, b] = colour.match(/[\d.]+/g)!.slice(0, 3).map((value) => {
          const channel = Number(value) / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        }) as [number, number, number];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [high, low] = [luminance(colours.ring), luminance(colours.card)].sort((x, y) => y - x) as [number, number];

      expect(colours.style).toBe('solid');
      expect((high + 0.05) / (low + 0.05)).toBeGreaterThanOrEqual(theme.minimum);
    });
  }
});
