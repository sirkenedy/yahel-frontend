import { describe, expect, it } from 'vitest';
import { isEmailShaped, newPasswordProblem, passwordStrength } from './credentials';
import type { NewPasswordWords } from './credentials';

const words: NewPasswordWords = {
  newPasswordRequired: 'Create a password.',
  passwordParts: { upper: 'a capital letter', lower: 'a lowercase letter', digit: 'a number', symbol: 'a symbol' },
  listOf: (parts) => (parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : (parts[0] ?? '')),
  newPasswordTooShort: (missing) => `Use 8 or more characters${missing ? `, with ${missing}` : ''}.`,
  newPasswordTooPlain: (missing) => `Add ${missing}.`,
};

describe('isEmailShaped', () => {
  it.each(['amara@northwind.example', ' amara.okafor@yahel.example '])('accepts %s', (value) => expect(isEmailShaped(value)).toBe(true));
  it.each(['', 'amara', 'amara@', 'amara@northwind', 'a b@northwind.example', '@northwind.example'])('refuses "%s"', (value) => expect(isEmailShaped(value)).toBe(false));
});

describe('newPasswordProblem', () => {
  it('asks for length first, then for the variety the backend requires', () => {
    expect(newPasswordProblem('Short-1', words)).toBe('Use 8 or more characters.');
    expect(newPasswordProblem('sunrise over lekki 94', words)).toBe('Add a capital letter.');
    expect(newPasswordProblem('Sunrise over Lekki 94!', words)).toBeNull();
  });

  it('asks for a password when there is none', () => {
    expect(newPasswordProblem('', words)).toBe('Create a password.');
  });

  it('names exactly what a short password still lacks', () => {
    expect(newPasswordProblem('abc', words)).toBe('Use 8 or more characters, with a capital letter, a number and a symbol.');
    expect(newPasswordProblem('Abc1', words)).toBe('Use 8 or more characters, with a symbol.');
  });

  it('names exactly what a long enough password still lacks', () => {
    expect(newPasswordProblem('SUNRISE-OVER-1', words)).toBe('Add a lowercase letter.');
    expect(newPasswordProblem('sunriseoverlekki', words)).toBe('Add a capital letter, a number and a symbol.');
    expect(newPasswordProblem('Sunrise1!', words)).toBeNull();
  });
});

describe('passwordStrength', () => {
  it('scores nothing for nothing, and at least one for anything', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('a')).toBe(1);
  });

  it('rewards length and variety, and marks down a password that contains the person’s name', () => {
    expect(passwordStrength('Sunrise over Lekki 94!')).toBe(4);
    expect(passwordStrength('Sunrise-Lek1')).toBe(3);
    expect(passwordStrength('Amara loves Lekki 94!', 'amara')).toBe(3);
  });

  it('scores a password the rule turns down as weak however long it is, and one that only just passes as fair', () => {
    expect(passwordStrength('sunrise over lekki 94')).toBe(1);
    expect(passwordStrength('Short-1')).toBe(1);
    expect(passwordStrength('Sunrise1!')).toBe(2);
  });
});
