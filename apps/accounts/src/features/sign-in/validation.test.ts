import { describe, expect, it } from 'vitest';
import { signInMessages as m } from './messages';
import { emailProblem, newPasswordProblem, passwordStrength } from './validation';

describe('emailProblem', () => {
  it('accepts an address, ignoring space around it', () => {
    expect(emailProblem(' amara@northwind.example ')).toBeNull();
  });

  it.each([
    ['', m.emailRequired],
    ['   ', m.emailRequired],
    ['amara', m.emailInvalid],
    ['amara@northwind', m.emailInvalid],
    ['amara @northwind.example', m.emailInvalid],
  ])('explains what is wrong with %j', (value, problem) => {
    expect(emailProblem(value)).toBe(problem);
  });
});

describe('newPasswordProblem', () => {
  it('asks for length first, then for the mix the backend requires', () => {
    expect(newPasswordProblem('Short-1a')).toBe(m.newPasswordTooShort);
    expect(newPasswordProblem('sunrise over lekki')).toBe(m.newPasswordTooPlain);
    expect(newPasswordProblem('Sunrise over Lekki 94!')).toBeNull();
  });
});

describe('passwordStrength', () => {
  it.each([
    ['', 0],
    ['abc', 1],
    ['abcdefghijkl', 2],
    ['abcdefghijk1', 3],
    ['abcdefghijklmno1', 4],
  ])('scores %j as %i', (password, score) => {
    expect(passwordStrength(password)).toBe(score);
  });

  it('marks down a password that contains the person’s own name', () => {
    expect(passwordStrength('amara-sunrise-94', 'Amara')).toBe(3);
    expect(passwordStrength('lekki-sunrise-94', 'Amara')).toBe(4);
  });
});
