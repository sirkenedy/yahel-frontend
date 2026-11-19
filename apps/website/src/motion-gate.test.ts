import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scale } from '@yahel/tokens/tokens.json';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The gate is a plain script served as it is written, so it is run here the way a page runs it: for its effect.
const gate = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'motion-gate.js');
const patience = Number.parseFloat(scale['duration.loop']);

class FakeObserver {
  static current: FakeObserver | undefined;
  observed = new Set<Element>();
  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeObserver.current = this;
  }
  observe(element: Element) {
    this.observed.add(element);
  }
  unobserve(element: Element) {
    this.observed.delete(element);
  }
  see(element: Element, isIntersecting = true) {
    if (this.observed.has(element)) this.callback([{ target: element, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

const html = document.documentElement;
const root = () => document.getElementById('root')!;
const blocks = () => [...root().querySelectorAll('[data-reveal]')];
const shown = () => blocks().map((block) => block.hasAttribute('data-in'));

/** Loads the gate as the head of a page does, then finishes parsing a page written for `page` at `address`. */
const open = async (address: string, page: string | undefined, { observe = true } = {}) => {
  window.history.replaceState(null, '', address);
  if (observe) vi.stubGlobal('IntersectionObserver', FakeObserver);
  vi.resetModules();
  await import(/* @vite-ignore */ gate);
  document.body.innerHTML = `<div id="root"${page === undefined ? '' : ` data-page="${page}"`}><main><h1 data-reveal="">Heading</h1><p data-reveal="">Copy</p></main></div>`;
  document.dispatchEvent(new Event('readystatechange'));
};

describe('motion gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeObserver.current = undefined;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    html.removeAttribute('data-motion');
    html.removeAttribute('data-scripts');
    document.body.innerHTML = '';
    window.history.replaceState(null, '', '/');
  });

  describe('before the page is drawn', () => {
    it('says that scripts run here', async () => {
      await open('/about', '/about');

      expect(html).toHaveAttribute('data-scripts', 'on');
    });

    it('takes that back when a script cannot be fetched, so the bar returns to its links', async () => {
      await open('/about', '/about');
      const script = document.head.appendChild(document.createElement('script'));

      script.dispatchEvent(new Event('error'));

      expect(html).not.toHaveAttribute('data-scripts');
      script.remove();
    });

    it('keeps it when something other than a script fails to load', async () => {
      await open('/about', '/about');
      const image = document.body.appendChild(document.createElement('img'));

      image.dispatchEvent(new Event('error'));

      expect(html).toHaveAttribute('data-scripts', 'on');
    });

    it('switches the hidden starting state on where the browser can observe', async () => {
      await open('/about', '/about');

      expect(html).toHaveAttribute('data-motion', 'on');
    });

    it('leaves content visible where the browser cannot observe', async () => {
      await open('/about', '/about', { observe: false });

      expect('IntersectionObserver' in window).toBe(false);
      expect(html).not.toHaveAttribute('data-motion');
    });
  });

  describe('on a page written for this address', () => {
    it('marks the root, so the page script takes the markup over', async () => {
      await open('/about', '/about');

      expect(root()).toHaveAttribute('data-page-current');
    });

    it('marks the root where the browser cannot observe too', async () => {
      await open('/about', '/about', { observe: false });

      expect(root()).toHaveAttribute('data-page-current');
    });

    it('ignores what follows the question mark', async () => {
      await open('/careers?team=design', '/careers');

      expect(root()).toHaveAttribute('data-page-current');
      expect(window.location.search).toBe('?team=design');
    });

    it('watches every block on the same terms as Reveal: 12% in view, 8% up from the bottom', async () => {
      await open('/about', '/about');

      expect(FakeObserver.current!.options).toEqual({ threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      expect([...FakeObserver.current!.observed]).toEqual(blocks());
    });

    it('brings a block in when it is seen, without waiting for the page script', async () => {
      await open('/about', '/about');
      const [heading, copy] = blocks();

      FakeObserver.current!.see(copy!, false);
      expect(shown()).toEqual([false, false]);

      FakeObserver.current!.see(heading!);
      expect(shown()).toEqual([true, false]);
    });

    it('brings a block in once: it stops watching it', async () => {
      await open('/about', '/about');
      const [heading] = blocks();

      FakeObserver.current!.see(heading!);

      expect(FakeObserver.current!.observed.has(heading!)).toBe(false);
    });

    it('does not show what has not been scrolled to, however long the page script takes', async () => {
      await open('/about', '/about');

      vi.advanceTimersByTime(patience * 10);

      expect(shown()).toEqual([false, false]);
    });

    it('does not uncover the page when a script stops with an error', async () => {
      await open('/about', '/about');

      window.dispatchEvent(new ErrorEvent('error', { message: 'VITE_APP_URL is not set' }));

      expect(html).toHaveAttribute('data-motion', 'on');
      expect(shown()).toEqual([false, false]);
    });
  });

  describe('at the address of the file itself', () => {
    it.each([
      ['/careers.html', '/careers', '/careers'],
      ['/index.html', '/', '/'],
      ['/about.html?from=mail', '/about', '/about?from=mail'],
    ])('treats %s as the page %s and shows its plain address', async (address, page, plain) => {
      await open(address, page);

      expect(root()).toHaveAttribute('data-page-current');
      expect(`${window.location.pathname}${window.location.search}`).toBe(plain);
    });

    it('leaves the address alone when the file is not the page that was written', async () => {
      await open('/no-such-page.html', '/');

      expect(root()).not.toHaveAttribute('data-page-current');
      expect(window.location.pathname).toBe('/no-such-page.html');
    });
  });

  describe('on a page the page script will draw afresh', () => {
    it.each([
      ['an unknown address answered with the home page', '/no-such-page', '/'],
      ['an address with a trailing slash answered with the home page', '/about/', '/'],
      ['a link into a section, which the written bar does not mark', '/#products', '/'],
    ])('does not mark the root for %s', async (_case, address, page) => {
      await open(address, page);

      expect(root()).not.toHaveAttribute('data-page-current');
      expect(FakeObserver.current).toBeUndefined();
    });

    it('keeps the written content hidden while the page script is on its way', async () => {
      await open('/careers#roles', '/careers');

      vi.advanceTimersByTime(patience - 1);

      expect(shown()).toEqual([false, false]);
    });

    it('shows the written content when the page script has not drawn by the time patience runs out', async () => {
      await open('/careers#roles', '/careers');

      vi.advanceTimersByTime(patience);

      expect(shown()).toEqual([true, true]);
    });

    it('leaves the page alone once the page script has drawn it', async () => {
      await open('/no-such-page', '/');
      root().replaceChildren();
      root().insertAdjacentHTML('beforeend', '<main><h1 data-reveal="">Drawn afresh</h1></main>');

      vi.advanceTimersByTime(patience);

      expect(shown()).toEqual([false]);
    });
  });

  it('does nothing to a root with no written page, as on the development server', async () => {
    await open('/about', undefined);

    vi.advanceTimersByTime(patience);

    expect(root()).not.toHaveAttribute('data-page-current');
    expect(FakeObserver.current).toBeUndefined();
    expect(shown()).toEqual([false, false]);
  });
});
