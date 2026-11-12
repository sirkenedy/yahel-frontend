import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const load = () => import('./config');

describe('the app address the site starts with', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root" data-page="/"><a href="http://localhost:5173/sign-in">Create account</a></div>';
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('links account actions to sign-in on the local app while on this machine', async () => {
    expect((await load()).signInUrl).toBe('http://localhost:5173/sign-in');
    expect(document.getElementById('root')).not.toBeEmptyDOMElement();
  });

  it('refuses to start a deployed build with no https address, and takes the written page down with it', async () => {
    vi.stubEnv('PROD', true);
    vi.stubGlobal('location', { hostname: 'yahel.example' });

    await expect(load()).rejects.toThrow('VITE_APP_URL is not set');

    expect(document.getElementById('root')).toBeEmptyDOMElement();
  });

  it('starts a deployed build that has an https address, and leaves the written page for React', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_APP_URL', 'https://app.yahel.example');
    vi.stubGlobal('location', { hostname: 'yahel.example' });

    expect((await load()).signInUrl).toBe('https://app.yahel.example/sign-in');
    expect(document.getElementById('root')).not.toBeEmptyDOMElement();
  });
});
