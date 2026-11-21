import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (env: Record<string, string>) => {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return (await import('./config')).config;
};

afterEach(() => vi.unstubAllEnvs());

describe('config', () => {
  it('falls back to local development addresses and hides optional links', async () => {
    const config = await load({ VITE_API_URL: '', VITE_APP_URL: '', VITE_RETURN_ORIGINS: '', VITE_SIGN_UP_URL: '', VITE_HELP_URL: '', VITE_PRIVACY_URL: '', VITE_TERMS_URL: '' });

    expect(config.returnPolicy).toEqual({ fallback: 'http://localhost:5173/', allowedOrigins: [] });
    expect(config).toMatchObject({ signUpUrl: null, helpUrl: null, privacyUrl: null, termsUrl: null });
  });

  it('reads the app address, the return origins and the links from settings', async () => {
    const config = await load({
      VITE_APP_URL: 'https://app.yahel.example',
      VITE_RETURN_ORIGINS: ' https://mail.yahel.example , https://drive.yahel.example,',
      VITE_SIGN_UP_URL: 'https://accounts.yahel.example/personal',
      VITE_PRIVACY_URL: 'https://yahel.example/privacy',
    });

    expect(config.returnPolicy).toEqual({ fallback: 'https://app.yahel.example/', allowedOrigins: ['https://mail.yahel.example', 'https://drive.yahel.example'] });
    expect(config.signUpUrl).toBe('https://accounts.yahel.example/personal');
    expect(config.privacyUrl).toBe('https://yahel.example/privacy');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'not a url'])('ignores a setting that is not a web address: %s', async (value) => {
    const config = await load({ VITE_APP_URL: value, VITE_HELP_URL: value, VITE_SIGN_UP_URL: value });

    expect(config.returnPolicy.fallback).toBe('http://localhost:5173/');
    expect(config.helpUrl).toBeNull();
    expect(config.signUpUrl).toBeNull();
  });
});
