import { describe, expect, it } from 'vitest';
import { brandOf, cardDigits, expiryProblem, formatCardNumber, formatExpiry, formatSecurityCode, isCardNumber, isSecurityCode, passesLuhn } from './card';

describe('formatting as it is typed', () => {
  it('groups a card number in fours and keeps at most nineteen digits', () => {
    expect(formatCardNumber('4084084084084081')).toBe('4084 0840 8408 4081');
    expect(formatCardNumber('4084-0840 84')).toBe('4084 0840 84');
    expect(formatCardNumber('1234567890123456789012')).toBe('1234 5678 9012 3456 789');
    expect(cardDigits(' 4084 0840x')).toBe('40840840');
  });

  it('writes an expiry as MM/YY', () => {
    expect(formatExpiry('0')).toBe('0');
    expect(formatExpiry('08')).toBe('08');
    expect(formatExpiry('0829')).toBe('08/29');
    expect(formatExpiry('08/2931')).toBe('08/29');
  });

  it('keeps up to four digits of a security code', () => {
    expect(formatSecurityCode('12a345')).toBe('1234');
  });
});

describe('what can be checked without asking a bank', () => {
  it('accepts numbers that pass the Luhn check and are a card’s length', () => {
    for (const number of ['4084 0840 8408 4081', '4000 0000 0000 0002', '5555 5555 5555 4444', '4222222222222']) expect(isCardNumber(number)).toBe(true);
  });

  it('refuses a mistyped digit, too few digits and nothing at all', () => {
    expect(isCardNumber('4084 0840 8408 4082')).toBe(false);
    expect(isCardNumber('4242 4242')).toBe(false);
    expect(isCardNumber('')).toBe(false);
    expect(passesLuhn('')).toBe(false);
    expect(passesLuhn('0')).toBe(true);
  });

  it('names the network from how the number begins', () => {
    expect(brandOf('4084')).toBe('Visa');
    expect(brandOf('5399 83')).toBe('Mastercard');
    expect(brandOf('2223 00')).toBe('Mastercard');
    expect(brandOf('5061 0000')).toBe('Verve');
    expect(brandOf('6500 02')).toBe('Verve');
    expect(brandOf('3782')).toBeNull();
    expect(brandOf('')).toBeNull();
  });

  it('accepts an expiry up to the end of its month, and says how another is wrong', () => {
    const today = new Date(2026, 10, 22);
    expect(expiryProblem('11/26', today)).toBeNull();
    expect(expiryProblem('08/31', today)).toBeNull();
    expect(expiryProblem('10/26', today)).toBe('expired');
    expect(expiryProblem('12/25', today)).toBe('expired');
    for (const typed of ['', '8/29', '13/29', '00/29', '0829', 'ab/cd']) expect(expiryProblem(typed, today)).toBe('shape');
  });

  it('takes three or four digits as a security code', () => {
    expect(isSecurityCode('123')).toBe(true);
    expect(isSecurityCode('1234')).toBe(true);
    expect(isSecurityCode('12')).toBe(false);
    expect(isSecurityCode('12a')).toBe(false);
  });
});
