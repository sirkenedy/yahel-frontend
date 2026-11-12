import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { careersCode, openPageThatDidNotLoad, openSite, settle, site, siteOrigin, takenOver } from './support/website';

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
    await openSite(page, '/no-such-page');

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

  test('the home hero starts with its first block, then one every 70 ms', async ({ page }) => {
    await openSite(page, '/');
    const blocks = [page.getByText('Yahel Workspace'), page.getByRole('heading', { level: 1 }), page.getByText(/^Mail, calendar, files/), page.getByRole('main').getByRole('link', { name: 'Create an account' })];
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

    await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''));

    await action.click();

    await expect(page).toHaveURL(site('/careers'));
    await expect(page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-same-document', '');
  });

  test('Careers opens from the footer without loading the document again', async ({ page }) => {
    await openSite(page, '/');
    await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''));

    await footerNav(page).getByRole('link', { name: 'Careers' }).click();

    await expect(page).toHaveURL(site('/careers'));
    await expect(page).toHaveTitle('Careers at Yahel');
    await expect(page.locator('html')).toHaveAttribute('data-same-document', '');
    await expect.poll(() => scrollY(page)).toBe(0);
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

test.describe('careers page', () => {
  const teamTabs = (page: Page) => page.getByRole('tablist', { name: 'Team' });
  const tab = (page: Page, name: string) => teamTabs(page).getByRole('tab', { name });
  const roles = (page: Page) => page.getByRole('tabpanel').getByRole('link');
  const selected = (page: Page) => teamTabs(page).getByRole('tab', { selected: true });
  const openRoles = async (page: Page) => {
    await openSite(page, '/careers');
    await teamTabs(page).scrollIntoViewIfNeeded();
    await expect(revealed(teamTabs(page))).toHaveCSS('opacity', '1');
    await settle(page);
  };
  /** What moves on the list that has just come in: the properties its running animations change, and for how long. */
  const arrival = (page: Page) =>
    page.getByRole('tabpanel').evaluate((panel) => {
      const running = panel.getAnimations();
      return {
        properties: [...new Set(running.flatMap((animation) => (animation.effect as KeyframeEffect).getKeyframes().flatMap((frame) => Object.keys(frame))))].filter((key) => !['offset', 'computedOffset', 'easing', 'composite'].includes(key)).sort(),
        durations: running.map((animation) => animation.effect!.getTiming().duration).sort(),
      };
    });

  test('careers content', async ({ page }) => {
    await openSite(page, '/careers');

    await expect(page).toHaveTitle('Careers at Yahel');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.getByRole('main').locator('h1, h2, h3, p').allTextContents()).toEqual([
      'Careers',
      'Build the tools people open every day.',
      'Join the team making mail, files, documents and meetings work as one product.',
      'How we work',
      '[HOW YOU WORK 1]',
      '[One or two sentences: for example where and when people work.]',
      '[HOW YOU WORK 2]',
      '[One or two sentences: for example how decisions are made.]',
      '[BENEFITS]',
      '[What you offer: pay, leave, equipment, learning.]',
      'Open roles',
      'Nothing that fits? Write to [CAREERS EMAIL] and tell us what you do well.',
    ]);
    await expect(page.getByRole('main').getByRole('link', { name: 'See open roles' })).toHaveAttribute('href', '#roles');
    await expect(page.getByRole('contentinfo')).toContainText('© Yahel');
  });

  test('Careers is marked as the page being read, in the bar or in the menu that stands in for it', async ({ page }) => {
    await openSite(page, '/careers');
    // Below the site-nav breakpoint the bar's links live in the menu sheet.
    const folded = page.viewportSize()!.width <= 860;
    if (folded) await banner(page).getByRole('button', { name: 'Menu' }).click();
    const links = folded ? page.getByRole('dialog', { name: 'Menu' }) : mainNav(page);

    await expect(links.getByRole('link', { name: 'Careers' })).toHaveAttribute('aria-current', 'page');
    await expect(links.locator('[aria-current]')).toHaveCount(1);
  });

  test('See open roles brings the roles into view, clear of the bar', async ({ page }) => {
    await openSite(page, '/careers');
    const heading = page.getByRole('heading', { level: 2, name: 'Open roles' });
    await expect(heading).not.toBeInViewport();

    await page.getByRole('main').getByRole('link', { name: 'See open roles' }).click();

    await expect(page).toHaveURL(site('/careers#roles'));
    await expect(heading).toBeInViewport({ ratio: 1 });
    const gap = await heading.evaluate((el) => el.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom);
    expect(gap).toBeGreaterThanOrEqual(0);
  });

  test('after See open roles, the keyboard carries on from the roles', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await openSite(page, '/careers');
    await page.getByRole('link', { name: 'See open roles' }).focus();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(site('/careers#roles'));
    await page.keyboard.press('Tab');

    await expect(tab(page, 'All')).toBeFocused();
  });

  test('filter roles by team with pointer', async ({ page }) => {
    await openRoles(page);
    const row = (team: string) => `[ROLE TITLE] ${team} · [LOCATION] View role`;

    await expect(teamTabs(page).getByRole('tab')).toHaveText(['All', 'Engineering', 'Design', 'Operations']);
    await expect(selected(page)).toHaveText(['All']);
    await expect(roles(page)).toHaveText([row('Engineering'), row('Engineering'), row('Design'), row('Operations')]);

    await tab(page, 'Engineering').click();
    await expect(selected(page)).toHaveText(['Engineering']);
    await expect(roles(page)).toHaveText([row('Engineering'), row('Engineering')]);

    await tab(page, 'Design').click();
    await expect(roles(page)).toHaveText([row('Design')]);

    await tab(page, 'Operations').click();
    await expect(roles(page)).toHaveText([row('Operations')]);
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel', { name: 'Operations' })).toBeVisible();

    await tab(page, 'All').click();
    await expect(roles(page)).toHaveCount(4);
  });

  test('filter roles by keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await openRoles(page);
    await page.getByRole('link', { name: 'See open roles' }).focus();

    await page.keyboard.press('Tab');
    await expect(tab(page, 'All')).toBeFocused();
    await expect(tab(page, 'All')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Engineering')).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'Engineering')).toBeFocused();
    await expect(selected(page)).toHaveText(['Engineering']);
    await expect(roles(page)).toHaveCount(2);

    await page.keyboard.press('End');
    await expect(selected(page)).toHaveText(['Operations']);
    await expect(roles(page)).toHaveCount(1);

    await page.keyboard.press('ArrowLeft');
    await expect(selected(page)).toHaveText(['Design']);

    await page.keyboard.press('Home');
    await expect(selected(page)).toHaveText(['All']);
    await expect(roles(page)).toHaveCount(4);

    // The whole list was one stop: the next one is the first role.
    await page.keyboard.press('Tab');
    await expect(roles(page).first()).toBeFocused();
  });

  // The arrow keys follow the direction the tabs are laid out in, which the page sets, not the language of the browser.
  for (const locale of ['ar', 'he-IL']) {
    test.describe(`in a browser set to ${locale}`, () => {
      test.use({ locale });

      test('on the left-to-right page, Right moves to the next tab and Left to the one before', async ({ page, isMobile }) => {
        test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
        await openRoles(page);
        expect(await page.evaluate(() => navigator.language)).toBe(locale);
        expect((await tab(page, 'Engineering').boundingBox())!.x).toBeGreaterThan((await tab(page, 'All').boundingBox())!.x);

        await tab(page, 'All').focus();
        await page.keyboard.press('ArrowRight');
        await expect(selected(page)).toHaveText(['Engineering']);

        await page.keyboard.press('ArrowLeft');
        await expect(selected(page)).toHaveText(['All']);
      });
    });
  }

  test('on a right-to-left page in an English browser, the arrow keys mirror with the tabs', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await openRoles(page);
    expect(await page.evaluate(() => navigator.language)).toMatch(/^en/);
    await page.evaluate(() => (document.documentElement.dir = 'rtl'));
    expect((await tab(page, 'Engineering').boundingBox())!.x).toBeLessThan((await tab(page, 'All').boundingBox())!.x);

    await tab(page, 'All').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(selected(page)).toHaveText(['Engineering']);

    await page.keyboard.press('ArrowRight');
    await expect(selected(page)).toHaveText(['All']);
  });

  test('the selected tab is raised and heavier, not only a different colour', async ({ page }) => {
    await openRoles(page);
    const look = (name: string) => tab(page, name).evaluate((el) => ({ weight: getComputedStyle(el).fontWeight, raised: getComputedStyle(el).boxShadow !== 'none' }));

    expect(await look('All')).toEqual({ weight: '600', raised: true });
    expect(await look('Design')).toEqual({ weight: '500', raised: false });

    const widthBefore = (await teamTabs(page).boundingBox())!.width;
    await tab(page, 'Design').click();
    await settle(page);

    expect(await look('Design')).toEqual({ weight: '600', raised: true });
    expect(await look('All')).toEqual({ weight: '500', raised: false });
    expect((await teamTabs(page).boundingBox())!.width).toBe(widthBefore);
  });

  test('at 200% text the tabs wrap and none is clipped', async ({ page }) => {
    await page.setViewportSize(narrow);
    await openRoles(page);
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));

    const boxes = await teamTabs(page).getByRole('tab').evaluateAll((tabs) => tabs.map((el) => ({ name: el.textContent, top: Math.round(el.getBoundingClientRect().top), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, cut: el.scrollWidth > el.clientWidth })));
    const track = (await teamTabs(page).boundingBox())!;

    expect(new Set(boxes.map((box) => box.top)).size).toBeGreaterThan(1);
    expect(boxes.filter((box) => box.cut || box.left < track.x || box.right > track.x + track.width || box.right > narrow.width)).toEqual([]);
    for (const name of ['All', 'Engineering', 'Design', 'Operations']) await expect(tab(page, name)).toBeVisible();
  });

  test('the list that comes in after a switch fades in and rises', async ({ page }) => {
    await openRoles(page);

    await tab(page, 'Engineering').click();

    expect(await arrival(page)).toEqual({ properties: ['opacity', 'transform'], durations: [420, 620] });
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await settle(page);
    await expect(page.getByRole('tabpanel')).toHaveCSS('opacity', '1');
    await expect(page.getByRole('tabpanel')).toHaveCSS('transform', 'none');
  });

  test('with reduced motion, switching teams only fades', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openRoles(page);

    await tab(page, 'Engineering').click();

    expect(await arrival(page)).toEqual({ properties: ['opacity'], durations: [180] });
    expect(await style(page.getByRole('tabpanel'), 'transform')).toBe('none');
    await expect(roles(page)).toHaveCount(2);
  });
});

test.describe('prerendered pages', () => {
  const written = [
    { path: '/', title: 'Yahel', heading: 'Everything your work needs. One account.', copy: 'Mail, calendar, files, documents and meetings that work together. Free for you, and built to run a whole organisation.' },
    { path: '/about', title: 'About Yahel', heading: 'Work tools that stay out of the way.', copy: '[YOUR STORY: why Yahel was started, by whom, and when. Two or three sentences.]' },
    { path: '/careers', title: 'Careers at Yahel', heading: 'Build the tools people open every day.', copy: 'Nothing that fits? Write to [CAREERS EMAIL] and tell us what you do well.' },
  ];
  const opacity = (locator: Locator) => style(locator, 'opacity');
  const loads = (page: Page) => {
    const seen = { count: 0 };
    page.on('load', () => (seen.count += 1));
    return seen;
  };
  /** Holds the page's script back until `release` is called, the way a slow connection does. */
  const holdPageScript = async (page: Page) => {
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/assets/index-*.js', async (route) => {
      await held;
      await route.continue();
    });
    return release;
  };
  // Before any script of the page runs: remember the heading the HTML arrived with, and watch how visible it is.
  const watchHeading = (page: Page) =>
    page.addInitScript(() => {
      const seen: number[] = [];
      Object.assign(window, { headingOpacities: seen });
      const watch = () => {
        const h1 = document.querySelector('h1');
        if (h1) {
          if (!('writtenHeading' in window)) Object.assign(window, { writtenHeading: h1 });
          seen.push(Number(getComputedStyle(h1).opacity));
        }
        requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    });
  const headingKept = (page: Page) => page.evaluate(() => (window as unknown as { writtenHeading: Element }).writtenHeading === document.querySelector('h1'));
  const headingDips = async (page: Page) => {
    const opacities = await page.evaluate(() => (window as unknown as { headingOpacities: number[] }).headingOpacities);
    expect(opacities.length).toBeGreaterThan(0);
    return opacities.filter((value, index) => index > 0 && value < opacities[index - 1]!);
  };

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('pages render without JavaScript', async ({ page }) => {
      for (const { path, title, heading, copy } of written) {
        await page.goto(site(path));

        await expect(page).toHaveTitle(title);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
        await expect(page.getByText(copy)).toBeVisible();
        const hidden = await page.locator('[data-reveal]').evaluateAll((all) => all.filter((el) => getComputedStyle(el).opacity !== '1' || getComputedStyle(el).transform !== 'none').length);
        expect(hidden).toBe(0);
        expect(await page.locator('[data-reveal]').count()).toBeGreaterThan(3);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      }
    });

    test('without JavaScript, links are ordinary links between the pages', async ({ page }) => {
      await page.goto(site('/'));

      await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();
      await expect(page).toHaveURL(site('/about'));
      await expect(page.getByRole('heading', { level: 1, name: 'Work tools that stay out of the way.' })).toBeVisible();

      await page.getByRole('main').getByRole('link', { name: 'See open roles' }).click();
      await expect(page).toHaveURL(site('/careers'));
      await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(4);
      await expect(page.getByRole('banner').getByRole('link', { name: 'Create account' })).toHaveAttribute('href', appSignIn);
    });

    test('without JavaScript on a phone, the bar shows its links and no Menu button', async ({ page }) => {
      await page.setViewportSize(narrow);
      await page.goto(site('/about'));

      await expect(banner(page).getByRole('button', { name: 'Menu' })).toBeHidden();
      await expect(mainNav(page).getByRole('link')).toHaveText(['Products', 'About', 'Careers']);
      for (const link of await mainNav(page).getByRole('link').all()) {
        await expect(link).toBeVisible();
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      }
      await expect(mainNav(page).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
      await expect(banner(page).getByRole('link', { name: 'Create account' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

      await mainNav(page).getByRole('link', { name: 'Careers' }).click();
      await expect(page).toHaveURL(site('/careers'));
      await expect(page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toBeVisible();
    });
  });

  test('with JavaScript on a phone, the bar offers the Menu button from the start, not its links', async ({ page }) => {
    await page.setViewportSize(narrow);
    const release = await holdPageScript(page);
    await page.goto(site('/about'), { waitUntil: 'commit' });

    await expect(banner(page).getByRole('button', { name: 'Menu' })).toBeVisible();
    await expect(mainNav(page)).toBeHidden();
    release();
  });

  for (const { path, heading } of written) {
    test(`hydration is clean at ${path}`, async ({ page }) => {
      const said: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') said.push(`${message.type()}: ${message.text()}`);
      });
      page.on('pageerror', (error) => said.push(`error: ${error.message}`));
      await watchHeading(page);

      await openSite(page, path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toHaveCSS('opacity', '1');
      await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
      await page.waitForLoadState('networkidle');

      expect(said).toEqual([]);
      // React took over the heading that was written; it did not draw another.
      expect(await headingKept(page)).toBe(true);
      // It was never seen and then hidden: its opacity only rises.
      expect(await headingDips(page)).toEqual([]);
    });
  }

  test('a hydrated page still works: the bar answers scrolling and the filter answers a press', async ({ page }) => {
    await openSite(page, '/careers');

    await page.getByRole('tablist', { name: 'Team' }).scrollIntoViewIfNeeded();
    await expect.poll(() => banner(page).evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('1');
    await page.getByRole('tab', { name: 'Design' }).click();

    await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(1);
  });

  test('content does not wait for a slow page script', async ({ page }) => {
    await watchHeading(page);
    const release = await holdPageScript(page);
    await page.goto(site('/careers'), { waitUntil: 'commit' });
    const heading = page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' });
    const roles = page.getByRole('heading', { level: 2, name: 'Open roles' });

    // The script has not arrived: what is in view is shown, and what is not waits to be scrolled to.
    await expect(heading).toHaveCSS('opacity', '1');
    await expect(page.getByText('Join the team making mail, files, documents and meetings work as one product.')).toHaveCSS('opacity', '1');
    expect(await opacity(roles)).toBe('0');

    await roles.scrollIntoViewIfNeeded();
    await expect(roles).toHaveCSS('opacity', '1');
    await expect(roles).toHaveCSS('transform', 'none');

    // When it does arrive it takes the same page over, and nothing that was shown is hidden again.
    release();
    await takenOver(page);
    await page.getByRole('tab', { name: 'Design' }).click();
    await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(1);
    expect(await headingKept(page)).toBe(true);
    expect(await headingDips(page)).toEqual([]);
    expect(await opacity(roles)).toBe('1');
  });

  test('a page that will be drawn afresh is shown as written if its script is slow', async ({ page }) => {
    const release = await holdPageScript(page);
    await page.goto(site('/careers#roles'), { waitUntil: 'commit' });
    const roles = page.getByRole('heading', { level: 2, name: 'Open roles' });
    expect(await opacity(roles)).toBe('0');

    // Well inside the default wait, and the script is still held back: only the gate's own patience can show it.
    await expect(roles).toHaveCSS('opacity', '1', { timeout: 3000 });
    await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(4);

    release();
    await takenOver(page);
    await page.getByRole('tab', { name: 'Design' }).click();
    await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(1);
  });

  test('content is shown when the page script cannot be fetched', async ({ page }) => {
    await page.setViewportSize(narrow);
    await page.route('**/assets/index-*.js', (route) => route.abort('internetdisconnected'));

    await page.goto(site('/about'));

    await expect(page.getByRole('heading', { level: 1, name: 'Work tools that stay out of the way.' })).toHaveCSS('opacity', '1');
    const story = revealed(page.getByRole('heading', { name: 'Our story' }));
    await story.scrollIntoViewIfNeeded();
    await expect(story).toHaveCSS('opacity', '1');
    // Nothing can open the menu, so the bar goes back to its links.
    await expect(banner(page).getByRole('button', { name: 'Menu' })).toBeHidden();
    await expect(mainNav(page).getByRole('link', { name: 'Careers' })).toBeVisible();
  });

  test('the file address of a page shows that page under its plain address', async ({ page }) => {
    await watchHeading(page);

    await openSite(page, '/careers.html');

    await expect(page).toHaveURL(site('/careers'));
    await expect(page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0);
    expect(await headingKept(page)).toBe(true);
    await page.getByRole('tablist', { name: 'Team' }).scrollIntoViewIfNeeded();
    await page.getByRole('tab', { name: 'Engineering' }).click();
    await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(2);
  });

  test.describe("when a page's own code cannot be fetched", () => {
    test('on a direct visit the written page stays readable, with links that still lead on', async ({ page }) => {
      await page.setViewportSize(narrow);
      const seen = loads(page);
      await page.route(careersCode, (route) => route.abort('internetdisconnected'));

      await page.goto(site('/careers'));
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toHaveCSS('opacity', '1');
      await expect(page.getByRole('heading', { name: "This page didn't load" })).toHaveCount(0);
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      const contact = page.getByText('Nothing that fits? Write to [CAREERS EMAIL] and tell us what you do well.');
      await contact.scrollIntoViewIfNeeded();
      await expect(contact).toHaveCSS('opacity', '1');
      await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(4);
      await expect(page.getByRole('contentinfo')).toContainText('© Yahel');
      // The address was loaded once: no reload, and nothing kept to remember one.
      expect(seen.count).toBe(1);
      expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('tanstack_router_reload')))).toEqual([]);
      // Nothing can open the menu, so the bar goes back to its links, and they load their pages whole.
      await expect(banner(page).getByRole('button', { name: 'Menu' })).toBeHidden();
      await mainNav(page).getByRole('link', { name: 'About' }).click();
      await expect(page).toHaveURL(site('/about'));
      await expect(page.getByRole('heading', { level: 1, name: 'Work tools that stay out of the way.' })).toBeVisible();
    });

    test('on a move from another page the reader lands on the written page, bar and footer intact', async ({ page }) => {
      await page.route(careersCode, (route) => route.abort('internetdisconnected'));
      await openSite(page, '/about');

      await footerNav(page).getByRole('link', { name: 'Careers' }).click();

      await expect(page).toHaveURL(site('/careers'));
      await expect(page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toHaveCSS('opacity', '1');
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      await expect(banner(page).getByRole('link', { name: 'Yahel home' })).toBeVisible();
      await expect(footerNav(page).getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(4);
    });

    test('a second failure says so in the page, with the bar, the footer and a way to try again', async ({ page }) => {
      await openPageThatDidNotLoad(page);

      await expect(page).toHaveTitle("Page didn't load");
      await expect(page.getByRole('alert')).toHaveText('Check your connection, then try again.');
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      await expect(page.getByText(/dynamically imported/)).toHaveCount(0);
      await expect(banner(page).getByRole('link', { name: 'Create account' })).toBeVisible();
      await expect(footerNav(page).getByRole('link', { name: 'About' })).toBeVisible();
      await expect(page.getByRole('main').getByRole('link')).toHaveText(['Try again', 'Go to the home page']);

      await page.unroute(careersCode);
      await page.getByRole('main').getByRole('link', { name: 'Try again' }).click();

      await expect(page).toHaveURL(site('/careers'));
      await expect(page.getByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toBeVisible();
      await page.getByRole('tablist', { name: 'Team' }).scrollIntoViewIfNeeded();
      await page.getByRole('tab', { name: 'Operations' }).click();
      await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(1);
    });

    test('the way home from that message works', async ({ page }) => {
      await openPageThatDidNotLoad(page);

      await page.getByRole('main').getByRole('link', { name: 'Go to the home page' }).click();

      await expect(page).toHaveURL(site('/'));
      await expect(page.getByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeVisible();
    });
  });
});
