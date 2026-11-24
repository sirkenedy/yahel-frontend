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
    expect(config.appHome(2)).toBe('http://localhost:5173/u/2/');
    expect(config.adminHome(2)).toBe('http://localhost:5173/u/2/');
    expect(config.accountSettings(0)).toBe('http://localhost:5173/u/0/account');
    expect(config.afterSignIn(undefined, 2)).toBe('http://localhost:5173/u/2/');
    expect(config.afterSignIn('http://localhost:5173/', 2)).toBe('http://localhost:5173/u/2/');
    expect(config.afterSignIn('http://localhost:5173/u/0/account', 2)).toBe('http://localhost:5173/u/0/account');
    expect(config.afterSignIn('https://evil.example/', 2)).toBe('http://localhost:5173/u/2/');
    expect(config).toMatchObject({ helpUrl: null, privacyUrl: null, termsUrl: null });
  });

  it('keeps sign-in and sign-up inside this app, offers no business sign-up and uses the product’s mail domain until told otherwise', async () => {
    const config = await load({ VITE_SIGN_UP_URL: '', VITE_SIGN_IN_URL: '', VITE_BUSINESS_SIGN_UP: '', VITE_BUSINESS_SIGN_UP_URL: '', VITE_ADMIN_SIGN_IN_URL: '', VITE_ADMIN_URL: '', VITE_APP_URL: '', VITE_STAND_INS: '', VITE_MAIL_DOMAIN: '' });

    expect(config).toMatchObject({ signInUrl: '/signin', signUpUrl: '/personal', businessSignUp: false, businessSignUpUrl: null, adminSignInUrl: null, adminUrl: 'http://localhost:5173/', businessTermsUrl: null, trialTermsUrl: null, domainTermsUrl: null, mailDomain: 'yahel.com' });
  });

  it('offers business sign-up in a release only when switched on, and in a demo build unless switched off', async () => {
    expect(await load({ VITE_STAND_INS: '', VITE_BUSINESS_SIGN_UP: 'on', VITE_BUSINESS_SIGN_UP_URL: '' })).toMatchObject({ businessSignUp: true, businessSignUpUrl: '/business' });
    expect(await load({ VITE_STAND_INS: '', VITE_BUSINESS_SIGN_UP: 'off', VITE_BUSINESS_SIGN_UP_URL: 'https://accounts.yahel.example/business' })).toMatchObject({ businessSignUp: false, businessSignUpUrl: null });
    expect(await load({ VITE_STAND_INS: '', VITE_BUSINESS_SIGN_UP: 'yes', VITE_BUSINESS_SIGN_UP_URL: '' })).toMatchObject({ businessSignUp: false, businessSignUpUrl: null });
    expect(await load({ VITE_STAND_INS: 'on', VITE_BUSINESS_SIGN_UP: '', VITE_BUSINESS_SIGN_UP_URL: '' })).toMatchObject({ businessSignUp: true, businessSignUpUrl: '/business' });
    expect(await load({ VITE_STAND_INS: 'on', VITE_BUSINESS_SIGN_UP: 'off', VITE_BUSINESS_SIGN_UP_URL: '' })).toMatchObject({ businessSignUp: false, businessSignUpUrl: null });
  });

  it('reads the app address, the return origins and the links from settings', async () => {
    const config = await load({
      VITE_BUSINESS_SIGN_UP: 'on',
      VITE_APP_URL: 'https://app.yahel.example',
      VITE_RETURN_ORIGINS: ' https://mail.yahel.example , https://drive.yahel.example,',
      VITE_SIGN_UP_URL: 'https://accounts.yahel.example/personal',
      VITE_SIGN_IN_URL: 'https://accounts.yahel.example/signin',
      VITE_BUSINESS_SIGN_UP_URL: 'https://accounts.yahel.example/business',
      VITE_ADMIN_SIGN_IN_URL: 'https://admin.yahel.example/signin',
      VITE_ADMIN_URL: 'https://admin.yahel.example',
      VITE_ACCOUNT_URL: 'https://myaccount.yahel.example',
      VITE_MAIL_DOMAIN: ' Yahel.Example ',
      VITE_PRIVACY_URL: 'https://yahel.example/privacy',
    });

    expect(config.returnPolicy).toEqual({ fallback: 'https://app.yahel.example/', allowedOrigins: ['https://mail.yahel.example', 'https://drive.yahel.example'] });
    expect(config.signUpUrl).toBe('https://accounts.yahel.example/personal');
    expect(config.signInUrl).toBe('https://accounts.yahel.example/signin');
    expect(config.businessSignUpUrl).toBe('https://accounts.yahel.example/business');
    expect(config.adminSignInUrl).toBe('https://admin.yahel.example/signin');
    expect(config.adminUrl).toBe('https://admin.yahel.example/');
    expect(config.appHome(3)).toBe('https://app.yahel.example/u/3/');
    expect(config.adminHome(3)).toBe('https://admin.yahel.example/u/3/');
    expect(config.accountSettings(3)).toBe('https://myaccount.yahel.example/u/3/account');
    expect(config.mailDomain).toBe('yahel.example');
    expect(config.privacyUrl).toBe('https://yahel.example/privacy');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'not a url'])('ignores a setting that is not a web address: %s', async (value) => {
    const config = await load({ VITE_APP_URL: value, VITE_HELP_URL: value, VITE_SIGN_UP_URL: value, VITE_BUSINESS_SIGN_UP: 'on', VITE_BUSINESS_SIGN_UP_URL: value, VITE_ADMIN_SIGN_IN_URL: value, VITE_ADMIN_URL: value });

    expect(config.returnPolicy.fallback).toBe('http://localhost:5173/');
    expect(config.helpUrl).toBeNull();
    expect(config.signUpUrl).toBe('/personal');
    expect(config.businessSignUpUrl).toBe('/business');
    expect(config.adminSignInUrl).toBeNull();
    expect(config.adminUrl).toBe('http://localhost:5173/');
  });

  it.each(['not a domain', 'yahel', 'https://yahel.example', 'yahel.example/path', '-bad.example', '@yahel.example'])('ignores a mail domain that is not one: %s', async (value) => {
    expect((await load({ VITE_MAIL_DOMAIN: value })).mailDomain).toBe('yahel.com');
  });
});
