import { describe, expect, it } from 'vitest';
import { resolveAppUrl, signInUrl, signInUrlFor } from './config';

describe('app address', () => {
  it('defaults to the local app when nothing is configured', () => {
    expect(resolveAppUrl(undefined)).toBe('http://localhost:5173');
    expect(resolveAppUrl('  ')).toBe('http://localhost:5173');
  });

  it.each([
    ['https://app.yahel.example', 'https://app.yahel.example'],
    ['https://app.yahel.example/', 'https://app.yahel.example'],
    ['http://localhost:5173/anything?x=1', 'http://localhost:5173'],
  ])('keeps the origin of %s', (configured, origin) => {
    expect(resolveAppUrl(configured)).toBe(origin);
  });

  it.each(['javascript:alert(1)', 'data:text/html,hello', 'ftp://app.yahel.example', 'file:///etc/hosts', 'mailto:someone@yahel.example', '//app.yahel.example', 'app.yahel.example', '/sign-in'])(
    'rejects %s',
    (configured) => {
      expect(() => resolveAppUrl(configured)).toThrow('VITE_APP_URL must be an absolute http or https address');
    },
  );

  it('sends account actions to sign-in on that origin', () => {
    expect(signInUrlFor('https://app.yahel.example')).toBe('https://app.yahel.example/sign-in');
    expect(signInUrl).toBe('http://localhost:5173/sign-in');
  });
});
