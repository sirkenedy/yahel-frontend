import { describe, expect, it } from 'vitest';
import { assertReleaseAddresses } from './build-guards';

const secure = { VITE_API_URL: 'https://api.yahel.example/api', VITE_ACCOUNTS_URL: 'https://accounts.yahel.example', VITE_APP_URL: 'https://app.yahel.example' };

describe('assertReleaseAddresses', () => {
  it('refuses a release build without https addresses for the backend, the accounts app and the app', () => {
    expect(() => assertReleaseAddresses('build', {})).toThrow(/VITE_API_URL, VITE_ACCOUNTS_URL, VITE_APP_URL/);
    expect(() => assertReleaseAddresses('build', { ...secure, VITE_APP_URL: 'http://app.yahel.example' })).toThrow(/VITE_APP_URL/);
  });

  it('lets through a release with all three, a local build, and the development server', () => {
    expect(() => assertReleaseAddresses('build', secure)).not.toThrow();
    expect(() => assertReleaseAddresses('build', { VITE_LOCAL_BUILD: 'local' })).not.toThrow();
    expect(() => assertReleaseAddresses('serve', {})).not.toThrow();
  });
});
