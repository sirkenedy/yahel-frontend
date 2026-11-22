import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (env: Record<string, string>) => {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return (await import('./config')).config;
};

afterEach(() => vi.unstubAllEnvs());

describe('config', () => {
  it('falls back to local development addresses and hides optional links', async () => {
    const config = await load({ VITE_API_URL: '', VITE_APP_URL: '', VITE_RETURN_ORIGINS: '', VITE_SIGN_UP_URL: '', VITE_SIGN_IN_URL: '', VITE_BUSINESS_SIGN_UP_URL: '', VITE_MAIL_DOMAIN: '', VITE_HELP_URL: '', VITE_PRIVACY_URL: '', VITE_TERMS_URL: '' });

    expect(config.returnPolicy).toEqual({ fallback: 'http://localhost:5173/', allowedOrigins: [] });
    expect(config).toMatchObject({ helpUrl: null, privacyUrl: null, termsUrl: null });
  });

  it('keeps sign-in and sign-up inside this app, offers no business sign-up and uses the product’s mail domain until told otherwise', async () => {
    const config = await load({ VITE_SIGN_UP_URL: '', VITE_SIGN_IN_URL: '', VITE_BUSINESS_SIGN_UP_URL: '', VITE_MAIL_DOMAIN: '' });

    expect(config).toMatchObject({ signInUrl: '/signin', signUpUrl: '/personal', businessSignUpUrl: '/business', adminSignInUrl: '/signin', businessTermsUrl: null, trialTermsUrl: null, domainTermsUrl: null, mailDomain: 'yahel.com' });
  });

  it('reads the app address, the return origins and the links from settings', async () => {
    const config = await load({
      VITE_APP_URL: 'https://app.yahel.example',
      VITE_RETURN_ORIGINS: ' https://mail.yahel.example , https://drive.yahel.example,',
      VITE_SIGN_UP_URL: 'https://accounts.yahel.example/personal',
      VITE_SIGN_IN_URL: 'https://accounts.yahel.example/signin',
      VITE_BUSINESS_SIGN_UP_URL: 'https://accounts.yahel.example/business',
      VITE_MAIL_DOMAIN: ' Yahel.Example ',
      VITE_PRIVACY_URL: 'https://yahel.example/privacy',
    });

    expect(config.returnPolicy).toEqual({ fallback: 'https://app.yahel.example/', allowedOrigins: ['https://mail.yahel.example', 'https://drive.yahel.example'] });
    expect(config.signUpUrl).toBe('https://accounts.yahel.example/personal');
    expect(config.signInUrl).toBe('https://accounts.yahel.example/signin');
    expect(config.businessSignUpUrl).toBe('https://accounts.yahel.example/business');
    expect(config.mailDomain).toBe('yahel.example');
    expect(config.privacyUrl).toBe('https://yahel.example/privacy');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'not a url'])('ignores a setting that is not a web address: %s', async (value) => {
    const config = await load({ VITE_APP_URL: value, VITE_HELP_URL: value, VITE_SIGN_UP_URL: value, VITE_BUSINESS_SIGN_UP_URL: value });

    expect(config.returnPolicy.fallback).toBe('http://localhost:5173/');
    expect(config.helpUrl).toBeNull();
    expect(config.signUpUrl).toBe('/personal');
    expect(config.businessSignUpUrl).toBe('/business');
  });

  it.each(['not a domain', 'yahel', 'https://yahel.example', 'yahel.example/path', '-bad.example', '@yahel.example'])('ignores a mail domain that is not one: %s', async (value) => {
    expect((await load({ VITE_MAIL_DOMAIN: value })).mailDomain).toBe('yahel.com');
  });
});
