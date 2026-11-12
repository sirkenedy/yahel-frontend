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

  test('on a right-to-left page the arrow keys follow the direction the tabs are drawn in', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hardware keyboard flow is a desktop scenario');
    await openSite(page, '/');
    await page.evaluate(() => (document.documentElement.dir = 'rtl'));
    await tab(page, 'Mail').focus();

    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 'Calendar')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'Mail')).toHaveAttribute('aria-selected', 'true');
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

test.describe('home page as it is written', () => {
  const sections = ['Nine apps. One way of working.', 'For you. For your whole organisation.', 'You can always see who has access.', 'Start free.', 'One account for all of it.'];
  const productNames = ['Mail', 'Calendar', 'Drive', 'Docs', 'Sheets', 'Slides', 'Chat', 'Meet', 'Admin'];

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('home shows every section without JavaScript, with Mail’s panel shown', async ({ page }) => {
      await page.goto(site('/'));
      const main = page.getByRole('main');

      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Everything your work needs. One account.');
      await expect(main.getByRole('heading', { level: 2 })).toHaveText(sections);
      for (const heading of await main.getByRole('heading', { level: 2 }).all()) await expect(heading).toBeVisible();
      const waiting = await page.locator('[data-reveal]').evaluateAll((all) => all.filter((el) => getComputedStyle(el).opacity !== '1' || getComputedStyle(el).transform !== 'none').length);
      expect(waiting).toBe(0);

      await expect(main.getByRole('list', { name: 'Products' }).getByRole('link')).toHaveCount(9);
      await expect(main.getByRole('img', { name: /^The Yahel home screen/ })).toBeVisible();
      await expect(page.getByRole('tablist', { name: 'Products' }).getByRole('tab')).toHaveText(productNames);
      await expect(page.getByRole('tab', { name: 'Mail', exact: true })).toHaveAttribute('aria-selected', 'true');
      await expect(main.getByRole('heading', { level: 3, name: 'Mail', exact: true })).toBeVisible();
      await expect(main.getByText('Email on your personal address or your organisation’s domain.')).toBeVisible();
      await expect(main.getByRole('link', { name: 'Open mail.yahel.com' })).toBeVisible();
      await expect(main.locator('h3', { hasText: /^Calendar$/ })).toBeHidden();
      await expect(main.getByRole('heading', { level: 3, name: 'For work or your business' })).toBeVisible();
      await expect(main.getByRole('heading', { level: 3, name: 'Clear when managed' })).toBeVisible();
      await expect(main.getByText('[YOUR PRICE]')).toBeVisible();
      await expect(main.getByText('Every app, with [STORAGE] of storage.')).toBeVisible();
      await expect(page.getByRole('contentinfo').getByRole('list', { name: 'More products' }).getByRole('link')).toHaveText(productNames.slice(5));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });

    test('without JavaScript the home page is laid out, and the window lies flat', async ({ page }) => {
      await page.goto(site('/'));
      const main = page.getByRole('main');

      const icon = await main.getByRole('list', { name: 'Products' }).getByRole('link', { name: 'Mail' }).boundingBox();
      expect(icon!.width).toBeGreaterThanOrEqual(44);
      expect(icon!.width).toBe(icon!.height);
      const card = main.getByRole('heading', { level: 3, name: 'For work or your business' }).locator('xpath=..');
      expect(await style(card, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
      const pose = await main.getByRole('img', { name: /^The Yahel home screen/ }).evaluate((el) => {
        const matrix = new DOMMatrix(getComputedStyle(el).transform);
        return { scale: matrix.m11, tilt: matrix.m23 };
      });
      expect(pose).toEqual({ scale: 1, tilt: 0 });
    });

    test('without JavaScript the bar offers Products as a plain link, and section links are ordinary links', async ({ page }) => {
      await page.goto(site('/'));
      const nav = mainNav(page);

      await expect(page.getByRole('button', { name: 'Products' })).toBeHidden();
      await expect(nav.getByRole('link', { name: 'Products' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/#products');
      await expect(nav.getByRole('link')).toHaveText(['Products', 'For business', 'Security', 'Plans', 'About', 'Careers']);

      await nav.getByRole('link', { name: 'Plans' }).click();
      await expect(page).toHaveURL(site('/#plans'));
      await expect(page.getByRole('heading', { level: 2, name: 'Start free.' })).toBeInViewport();
      // The bar, tall with its links in rows on a phone, is not left lying over the heading the link led to.
      const covered = await page.getByRole('heading', { level: 2, name: 'Start free.' }).evaluate((heading) => heading.getBoundingClientRect().top < document.querySelector('header')!.getBoundingClientRect().bottom);
      expect(covered).toBe(false);

      await page.getByRole('main').getByRole('list', { name: 'Products' }).getByRole('link', { name: 'Docs' }).click();
      await expect(page).toHaveURL(site('/#products'));
    });
  });

  test('nothing in the hero or the products jumps or flashes when the page’s script takes over', async ({ page }) => {
    await page.addInitScript(() => {
      const seen = { window: [] as string[], icon: [] as number[], panel: [] as string[] };
      (window as unknown as { seen: typeof seen }).seen = seen;
      const watch = () => {
        const hero = document.querySelector('main [role="img"]');
        const icon = document.querySelector('main ul[aria-label] li');
        const panel = document.querySelector('main [role="tabpanel"]');
        if (hero) seen.window.push(getComputedStyle(hero).transform);
        if (icon) seen.icon.push(Number(getComputedStyle(icon).opacity));
        if (panel) seen.panel.push(`${getComputedStyle(panel).opacity} ${getComputedStyle(panel).visibility} ${panel.querySelector('h3')?.textContent}`);
        requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    });

    await openSite(page, '/');
    await expect(page.getByRole('main').getByRole('list', { name: 'Products' }).getByRole('listitem').last()).toHaveCSS('opacity', '1');
    await settle(page);

    const seen = await page.evaluate(() => (window as unknown as { seen: { window: string[]; icon: number[]; panel: string[] } }).seen);
    // The window is tilted from the first frame it is drawn in, and stays exactly so across the hand-over.
    expect(seen.window.length).toBeGreaterThan(5);
    expect([...new Set(seen.window)]).toHaveLength(1);
    expect(Number(/^matrix(?:3d)?\(([-\d.]+)/.exec(seen.window[0]!)?.[1])).toBe(0.94);
    // An icon only ever arrives: it is never seen and then hidden.
    expect(seen.icon.filter((value, index) => index > 0 && value < seen.icon[index - 1]!)).toEqual([]);
    // Mail's panel is there, whole, the entire time.
    expect([...new Set(seen.panel)]).toEqual(['1 visible Mail']);
  });

  test('the home page’s styles arrive with the written page, not with its script', async ({ page }) => {
    await page.route('**/assets/*.js', (route) => route.abort('internetdisconnected'));
    await page.goto(site('/'));

    // The script in the head still brings the written icons in; once one has arrived it is a square of the size the page's styles give it.
    await expect(page.getByRole('main').getByRole('list', { name: 'Products' }).getByRole('listitem').first()).toHaveCSS('transform', 'none');
    const icon = await page.getByRole('main').getByRole('list', { name: 'Products' }).getByRole('link', { name: 'Mail' }).boundingBox();
    expect(icon!.width).toBeGreaterThanOrEqual(44);
    expect(Math.abs(icon!.width - icon!.height)).toBeLessThan(0.01);
    await expect(page.getByRole('main').getByRole('heading', { level: 2, name: 'Nine apps. One way of working.' })).toBeVisible();
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
