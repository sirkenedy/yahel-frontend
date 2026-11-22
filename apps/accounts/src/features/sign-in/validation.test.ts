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
    expect(newPasswordProblem('Sh-1a')).toBe('Use 8 or more characters.');
    expect(newPasswordProblem('short')).toBe('Use 8 or more characters, with a capital letter, a number and a symbol.');
    expect(newPasswordProblem('sunrise over lekki')).toBe('Add a capital letter and a number.');
    expect(newPasswordProblem('Sunrise over lekki')).toBe('Add a number.');
    expect(newPasswordProblem('Short-1a')).toBeNull();
    expect(newPasswordProblem('Sunrise over Lekki 94!')).toBeNull();
  });

  it('asks for a password when there is none', () => {
    expect(newPasswordProblem('')).toBe(m.newPasswordRequired);
  });

  it('builds its words from the messages', () => {
    expect(newPasswordProblem('SHORT')).toBe(m.newPasswordTooShort(m.listOf([m.passwordParts.lower, m.passwordParts.digit, m.passwordParts.symbol])));
    expect(newPasswordProblem('longenough1!')).toBe(m.newPasswordTooPlain(m.passwordParts.upper));
  });
});

describe('passwordStrength', () => {
  it.each([
    ['', 0],
    ['abc', 1],
    ['abcdefghijklmnop', 1],
    ['Abcdef1!', 2],
    ['Abcdefghij1!', 3],
    ['Abcdefghijkl1!', 4],
  ])('scores %j as %i', (password, score) => {
    expect(passwordStrength(password)).toBe(score);
  });

  it('marks down a password that contains the person’s own name', () => {
    expect(passwordStrength('Amara-sunrise-94', 'Amara')).toBe(3);
    expect(passwordStrength('Lekki-sunrise-94', 'Amara')).toBe(4);
  });
});
