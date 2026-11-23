import { describe, expect, it } from 'vitest';
import { assertReleaseAddresses, assertStandInsAllowed, assertSwitches } from './build-guards';

describe('assertStandInsAllowed', () => {
  it('refuses a build with stand-ins on', () => {
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'on' })).toThrow(/stand-in data/);
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'on', VITE_STAND_INS_ALLOW_BUILD: 'yes' })).toThrow(/stand-in data/);
  });

  it('allows a build that declares itself a demo', () => {
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'on', VITE_STAND_INS_ALLOW_BUILD: 'demo' })).not.toThrow();
  });

  it('allows a build without stand-ins, and the development server with them', () => {
    expect(() => assertStandInsAllowed('build', {})).not.toThrow();
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'off' })).not.toThrow();
    expect(() => assertStandInsAllowed('serve', { VITE_STAND_INS: 'on' })).not.toThrow();
  });
});

describe('assertReleaseAddresses', () => {
  const release = { VITE_API_URL: 'https://api.yahel.example/api', VITE_APP_URL: 'https://app.yahel.example/', VITE_MAIL_DOMAIN: 'yahel.example' };

  it('allows a build that names the backend and the app over https', () => {
    expect(() => assertReleaseAddresses('build', release)).not.toThrow();
  });

  it.each([
    ['nothing is set', {}, /VITE_API_URL and VITE_APP_URL/],
    ['the backend is missing', { ...release, VITE_API_URL: undefined }, /^VITE_API_URL must/],
    ['the app is missing', { ...release, VITE_APP_URL: undefined }, /^VITE_APP_URL must/],
    ['the mail domain is missing', { ...release, VITE_MAIL_DOMAIN: undefined }, /^VITE_MAIL_DOMAIN must/],
    ['the mail domain is not a domain', { ...release, VITE_MAIL_DOMAIN: 'https://yahel.example' }, /^VITE_MAIL_DOMAIN must/],
    ['sign-in is served over plain http', { ...release, VITE_SIGN_IN_URL: 'http://accounts.yahel.example/signin' }, /^VITE_SIGN_IN_URL must be an https address/],
    ['sign-up and business sign-up are not addresses', { ...release, VITE_SIGN_UP_URL: 'accounts.yahel.example', VITE_BUSINESS_SIGN_UP_URL: 'javascript:alert(1)' }, /^VITE_SIGN_UP_URL and VITE_BUSINESS_SIGN_UP_URL must be an https address/],
    ['Admin is served over plain http', { ...release, VITE_ADMIN_URL: 'http://admin.yahel.example' }, /^VITE_ADMIN_URL must be an https address/],
    ['workspace sign-up is on without Admin’s address', { ...release, VITE_BUSINESS_SIGN_UP: 'on' }, /^VITE_ADMIN_URL must be set to Admin’s https address/],
    ['workspace sign-up is on with Admin over plain http', { ...release, VITE_BUSINESS_SIGN_UP: 'on', VITE_ADMIN_URL: 'http://admin.yahel.example' }, /^VITE_ADMIN_URL must be an https address/],
    ['the backend is plain http', { ...release, VITE_API_URL: 'http://api.yahel.example/api' }, /^VITE_API_URL must/],
    ['the app is a development address', { ...release, VITE_APP_URL: 'http://localhost:5173/' }, /^VITE_APP_URL must/],
    ['an address is not an address', { ...release, VITE_APP_URL: 'app.yahel.example' }, /^VITE_APP_URL must/],
  ])('refuses a release build when %s', (_name, env, message) => {
    expect(() => assertReleaseAddresses('build', env)).toThrow(message);
  });

  it('allows workspace sign-up in a release once Admin’s https address is set, and needs none while it is off', () => {
    expect(() => assertReleaseAddresses('build', { ...release, VITE_BUSINESS_SIGN_UP: 'on', VITE_ADMIN_URL: 'https://admin.yahel.example/' })).not.toThrow();
    expect(() => assertReleaseAddresses('build', { ...release, VITE_BUSINESS_SIGN_UP: 'off' })).not.toThrow();
  });

  it('allows the three onward addresses over https, and unset', () => {
    expect(() => assertReleaseAddresses('build', { ...release, VITE_SIGN_IN_URL: 'https://accounts.yahel.example/signin', VITE_SIGN_UP_URL: 'https://accounts.yahel.example/personal', VITE_BUSINESS_SIGN_UP_URL: 'https://accounts.yahel.example/business' })).not.toThrow();
    expect(() => assertReleaseAddresses('build', { ...release, VITE_SIGN_IN_URL: '' })).not.toThrow();
  });

  it('lets through the demo build, a build that says it is local, and the development server', () => {
    expect(() => assertReleaseAddresses('build', { VITE_STAND_INS: 'on', VITE_STAND_INS_ALLOW_BUILD: 'demo' })).not.toThrow();
    expect(() => assertReleaseAddresses('build', { VITE_LOCAL_BUILD: 'local' })).not.toThrow();
    expect(() => assertReleaseAddresses('serve', {})).not.toThrow();
  });

  it.each([
    ['alone', { VITE_STAND_INS_ALLOW_BUILD: 'demo' }],
    ['with stand-ins off', { VITE_STAND_INS: 'off', VITE_STAND_INS_ALLOW_BUILD: 'demo' }],
  ])('does not exempt a build for the demo opt-in %s', (_name, env) => {
    expect(() => assertReleaseAddresses('build', env)).toThrow(/VITE_API_URL and VITE_APP_URL/);
  });

  it('is not switched off by a mistyped opt-in', () => {
    expect(() => assertReleaseAddresses('build', { VITE_LOCAL_BUILD: 'true' })).toThrow();
  });
});

describe('assertSwitches', () => {
  it.each([undefined, '', 'on', 'off'])('accepts business sign-up switched %s', (value) => {
    expect(() => assertSwitches('build', { VITE_BUSINESS_SIGN_UP: value })).not.toThrow();
  });

  it.each(['yes', 'true', 'ON', '1'])('refuses a build with business sign-up set to %s', (value) => {
    expect(() => assertSwitches('build', { VITE_BUSINESS_SIGN_UP: value })).toThrow(/^VITE_BUSINESS_SIGN_UP must be on, off or unset/);
  });

  it('leaves the development server alone', () => {
    expect(() => assertSwitches('serve', { VITE_BUSINESS_SIGN_UP: 'yes' })).not.toThrow();
  });
});
