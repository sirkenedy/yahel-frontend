import { describe, expect, it } from 'vitest';
import { isMailDomain, isSecureAddress } from './addresses';

describe('isSecureAddress', () => {
  it.each(['https://api.yahel.example/api', 'https://accounts.yahel.example'])('accepts %s', (value) => expect(isSecureAddress(value)).toBe(true));
  it.each([undefined, '', 'http://api.yahel.example', 'api.yahel.example', 'javascript:alert(1)', '//api.yahel.example'])('refuses %s', (value) => expect(isSecureAddress(value)).toBe(false));
});

describe('isMailDomain', () => {
  it.each(['yahel.com', 'yahel.example', ' Mail.Yahel.Example ', 'yahel-mail.co.ng'])('accepts %s', (value) => expect(isMailDomain(value)).toBe(true));
  it.each([undefined, '', 'yahel', 'yahel.c', 'https://yahel.example', 'yahel.example/x', '@yahel.example', '-yahel.example', 'yahel..example', 'ya hel.example'])('refuses %s', (value) => expect(isMailDomain(value)).toBe(false));
});
