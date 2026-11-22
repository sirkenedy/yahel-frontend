import { describe, expect, it } from 'vitest';
import { isEmailShaped, newPasswordFault, passwordStrength } from './credentials';

describe('isEmailShaped', () => {
  it.each(['amara@northwind.example', ' amara.okafor@yahel.example '])('accepts %s', (value) => expect(isEmailShaped(value)).toBe(true));
  it.each(['', 'amara', 'amara@', 'amara@northwind', 'a b@northwind.example', '@northwind.example'])('refuses "%s"', (value) => expect(isEmailShaped(value)).toBe(false));
});

describe('newPasswordFault', () => {
  it('asks for length first, then for the variety the backend requires', () => {
    expect(newPasswordFault('Short-1')).toBe('too-short');
    expect(newPasswordFault('sunrise over lekki 94')).toBe('too-plain');
    expect(newPasswordFault('Sunrise over Lekki 94')).toBeNull();
  });
});

describe('passwordStrength', () => {
  it('scores nothing for nothing, and at least one for anything', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('a')).toBe(1);
  });

  it('rewards length and variety, and marks down a password that contains the person’s name', () => {
    expect(passwordStrength('sunrise over lekki 94')).toBe(4);
    expect(passwordStrength('sunriseoverlekki')).toBe(3);
    expect(passwordStrength('amara loves lekki 94', 'amara')).toBe(3);
  });
});
