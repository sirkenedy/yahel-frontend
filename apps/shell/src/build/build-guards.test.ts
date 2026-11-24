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

  it('refuses a release whose Admin link is not https, and lets one without Admin through', () => {
    const secure = { VITE_API_URL: 'https://api.yahel.example/api', VITE_ACCOUNTS_URL: 'https://accounts.yahel.example' };
    expect(() => assertReleaseAddresses('build', { ...secure, VITE_ADMIN_URL: 'http://admin.yahel.example' })).toThrow(/VITE_ADMIN_URL/);
    expect(() => assertReleaseAddresses('build', { ...secure, VITE_ADMIN_URL: 'https://admin.yahel.example' })).not.toThrow();
  });
});
