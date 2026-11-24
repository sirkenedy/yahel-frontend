import { describe, expect, it } from 'vitest';
import { assertReleaseAddresses } from './build-guards';

describe('assertReleaseAddresses', () => {
  it('refuses a release build without https addresses for the backend and the accounts app', () => {
    expect(() => assertReleaseAddresses('build', {})).toThrow(/VITE_API_URL and VITE_ACCOUNTS_URL/);
    expect(() => assertReleaseAddresses('build', { VITE_API_URL: 'https://api.yahel.example/api', VITE_ACCOUNTS_URL: 'http://accounts.yahel.example' })).toThrow(/VITE_ACCOUNTS_URL/);
  });

  it('lets through a release with both, a local build, and the development server', () => {
    expect(() => assertReleaseAddresses('build', { VITE_API_URL: 'https://api.yahel.example/api', VITE_ACCOUNTS_URL: 'https://accounts.yahel.example' })).not.toThrow();
    expect(() => assertReleaseAddresses('build', { VITE_LOCAL_BUILD: 'local' })).not.toThrow();
    expect(() => assertReleaseAddresses('serve', {})).not.toThrow();
  });
});
