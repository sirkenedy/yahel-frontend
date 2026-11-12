import { describe, expect, it } from 'vitest';
import { resolveAppUrl, signInUrlFor } from './app-url';

const development = { production: false, siteHost: 'localhost' };
const localPreview = { production: true, siteHost: 'localhost' };
const deployed = { production: true, siteHost: 'yahel.example' };
const notHttp = 'VITE_APP_URL must be an absolute http or https address';

describe('app address', () => {
  describe('in development', () => {
    it('falls back to the local app when nothing is configured', () => {
      expect(resolveAppUrl(undefined, development)).toBe('http://localhost:5173');
      expect(resolveAppUrl('  ', development)).toBe('http://localhost:5173');
    });

    it.each([
      ['https://app.yahel.example', 'https://app.yahel.example'],
      ['https://app.yahel.example/', 'https://app.yahel.example'],
      ['http://localhost:5173/anything?x=1', 'http://localhost:5173'],
    ])('keeps the origin of %s', (configured, origin) => {
      expect(resolveAppUrl(configured, development)).toBe(origin);
    });
  });

  describe('in a production build previewed on this machine', () => {
    it.each(['localhost', '127.0.0.1', '[::1]'])('still falls back to the local app when served from %s', (siteHost) => {
      expect(resolveAppUrl(undefined, { production: true, siteHost })).toBe('http://localhost:5173');
      expect(resolveAppUrl('http://localhost:5173', { production: true, siteHost })).toBe('http://localhost:5173');
    });
  });

  describe('in a deployed production build', () => {
    it.each([undefined, '', '   '])('refuses to start with no address (%j) instead of linking to localhost', (configured) => {
      expect(() => resolveAppUrl(configured, deployed)).toThrow('VITE_APP_URL is not set');
    });

    it.each(['http://app.yahel.example', 'http://localhost:5173'])('refuses %s, which is not https', (configured) => {
      expect(() => resolveAppUrl(configured, deployed)).toThrow('VITE_APP_URL must be an https address in a deployed build');
    });

    it('accepts an https address', () => {
      expect(resolveAppUrl('https://app.yahel.example/', deployed)).toBe('https://app.yahel.example');
    });

    it('does not mistake a host that merely starts with localhost for this machine', () => {
      expect(() => resolveAppUrl(undefined, { production: true, siteHost: 'localhost.yahel.example' })).toThrow('VITE_APP_URL is not set');
    });
  });

  it.each([development, localPreview, deployed])('rejects anything that is not an http or https address (%j)', (context) => {
    for (const configured of ['javascript:alert(1)', 'data:text/html,hello', 'ftp://app.yahel.example', 'file:///etc/hosts', 'mailto:someone@yahel.example', '//app.yahel.example', 'app.yahel.example', '/sign-in']) {
      expect(() => resolveAppUrl(configured, context), configured).toThrow(notHttp);
    }
  });

  it('sends account actions to sign-in on that origin', () => {
    expect(signInUrlFor('https://app.yahel.example')).toBe('https://app.yahel.example/sign-in');
  });
});
