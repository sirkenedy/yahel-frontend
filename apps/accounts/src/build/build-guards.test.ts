import { describe, expect, it } from 'vitest';
import { assertReleaseAddresses, assertStandInsAllowed } from './build-guards';

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
  const release = { VITE_API_URL: 'https://api.yahel.example/api', VITE_APP_URL: 'https://app.yahel.example/' };

  it('allows a build that names the backend and the app over https', () => {
    expect(() => assertReleaseAddresses('build', release)).not.toThrow();
  });

  it.each([
    ['nothing is set', {}, /VITE_API_URL and VITE_APP_URL/],
    ['the backend is missing', { VITE_APP_URL: release.VITE_APP_URL }, /^VITE_API_URL must/],
    ['the app is missing', { VITE_API_URL: release.VITE_API_URL }, /^VITE_APP_URL must/],
    ['the backend is plain http', { ...release, VITE_API_URL: 'http://api.yahel.example/api' }, /^VITE_API_URL must/],
    ['the app is a development address', { ...release, VITE_APP_URL: 'http://localhost:5173/' }, /^VITE_APP_URL must/],
    ['an address is not an address', { ...release, VITE_APP_URL: 'app.yahel.example' }, /^VITE_APP_URL must/],
  ])('refuses a release build when %s', (_name, env, message) => {
    expect(() => assertReleaseAddresses('build', env)).toThrow(message);
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
