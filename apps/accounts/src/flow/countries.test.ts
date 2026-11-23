import { describe, expect, it } from 'vitest';
import { africanCountries, dialCodeOf, internationalNumber, maskedNumber, namedCountries, otherCountries } from './countries';

describe('countries', () => {
  it('lists each country once with a dialling code', () => {
    const all = [...africanCountries, ...otherCountries];
    expect(africanCountries).toHaveLength(54);
    expect(new Set(all.map((country) => country.iso)).size).toBe(all.length);
    for (const country of all) expect(country.dial).toMatch(/^\+\d{1,3}$/);
    expect(dialCodeOf('NG')).toBe('+234');
    expect(dialCodeOf('ZA')).toBe('+27');
    expect(dialCodeOf('??')).toBe('');
  });

  it('writes a number the way the backend wants it', () => {
    expect(internationalNumber('NG', '803 555 0142')).toBe('+2348035550142');
    expect(internationalNumber('NG', '0803-555-0142')).toBe('+2348035550142');
    expect(internationalNumber('GB', '(07700) 900123')).toBe('+447700900123');
  });

  it('masks a number down to its country and last two digits', () => {
    expect(maskedNumber('NG', '803 555 0142')).toBe('+234 ••• ••• ••42');
  });

  it('names countries in the reader’s language, in that language’s order', () => {
    const named = namedCountries(africanCountries, 'en-NG');
    expect(named.find((country) => country.iso === 'NG')?.name).toBe('Nigeria');
    expect(named.map((country) => country.name)).toEqual([...named.map((country) => country.name)].sort((a, b) => a.localeCompare(b, 'en-NG')));
    expect(namedCountries(africanCountries, 'fr').find((country) => country.iso === 'ZA')?.name).toBe('Afrique du Sud');
  });
});
