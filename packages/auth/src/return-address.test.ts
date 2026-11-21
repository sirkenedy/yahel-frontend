import { describe, expect, it } from 'vitest';
import { resolveReturnAddress } from './return-address';

const policy = { fallback: 'https://app.yahel.example/', allowedOrigins: ['https://mail.yahel.example', 'not a url'] };

describe('resolveReturnAddress', () => {
  it.each([
    ['https://mail.yahel.example/inbox?label=1#top', 'https://mail.yahel.example/inbox?label=1#top'],
    ['https://app.yahel.example/account', 'https://app.yahel.example/account'],
  ])('keeps an address on an allowed origin: %s', (candidate, expected) => {
    expect(resolveReturnAddress(candidate, policy)).toBe(expected);
  });

  it.each([
    ['nothing', undefined],
    ['an empty value', ''],
    ['another site', 'https://evil.example/'],
    ['a look-alike host', 'https://mail.yahel.example.evil.example/'],
    ['an allowed host as a sub-domain label of another', 'https://evil.example/https://mail.yahel.example'],
    ['the allowed host over plain http', 'http://mail.yahel.example/'],
    ['another port', 'https://mail.yahel.example:8443/'],
    ['credentials before the host', 'https://mail.yahel.example@evil.example/'],
    ['credentials on an allowed host', 'https://user:secret@mail.yahel.example/'],
    ['a script address', 'javascript:alert(1)'],
    ['a data address', 'data:text/html,<script>alert(1)</script>'],
    ['a protocol-relative address', '//evil.example/'],
    ['a relative path', '/account'],
    ['backslashes', 'https:\\\\evil.example'],
    ['a newline inside the scheme', 'java\nscript:alert(1)'],
    ['a tab inside the host', 'https://mail.yahel\t.example/'],
  ])('falls back for %s', (_name, candidate) => {
    expect(resolveReturnAddress(candidate, policy)).toBe('https://app.yahel.example/');
  });

  it('allows a local development origin only when it is listed', () => {
    const local = { fallback: 'http://localhost:5173/', allowedOrigins: [] };

    expect(resolveReturnAddress('http://localhost:5173/account', local)).toBe('http://localhost:5173/account');
    expect(resolveReturnAddress('http://localhost:9999/', local)).toBe('http://localhost:5173/');
  });
});
