import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The gate is a plain script served as it is written, so it is run here the way a page runs it: for its effect.
const gate = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'motion-gate.js');
const runGate = async () => {
  vi.resetModules();
  await import(/* @vite-ignore */ gate);
};
const motion = () => document.documentElement.getAttribute('data-motion');

describe('motion gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-motion');
  });

  it('switches the hidden starting state on where the browser can observe', async () => {
    vi.stubGlobal('IntersectionObserver', class {});

    await runGate();

    expect(motion()).toBe('on');
  });

  it('leaves content visible where the browser cannot observe', async () => {
    expect('IntersectionObserver' in window).toBe(false);

    await runGate();

    expect(motion()).toBeNull();
  });

  it('shows everything when a script cannot be fetched', async () => {
    vi.stubGlobal('IntersectionObserver', class {});
    await runGate();
    const script = document.head.appendChild(document.createElement('script'));

    script.dispatchEvent(new Event('error'));

    expect(motion()).toBeNull();
    script.remove();
  });

  it('shows everything when a script stops with an error', async () => {
    vi.stubGlobal('IntersectionObserver', class {});
    await runGate();

    window.dispatchEvent(new ErrorEvent('error', { message: 'VITE_APP_URL is not set' }));

    expect(motion()).toBeNull();
  });

  it('keeps the hidden state when something other than a script fails to load', async () => {
    vi.stubGlobal('IntersectionObserver', class {});
    await runGate();
    const image = document.body.appendChild(document.createElement('img'));

    image.dispatchEvent(new Event('error'));

    expect(motion()).toBe('on');
    image.remove();
  });
});
