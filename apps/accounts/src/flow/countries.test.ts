import { describe, expect, it } from 'vitest';
import { countryOf, dialCodeOf, groupedCountries, internationalNumber, maskedNumber } from './countries';
import { countriesFixture } from './countries.fixture';

const of = (iso: string) => countryOf(countriesFixture, iso);

describe('countries', () => {
  it('dials the calling code alone, even for a territory listed with its area code', () => {
    expect(dialCodeOf(of('NG'))).toBe('+234');
    expect(dialCodeOf(of('JM'))).toBe('+1');
    expect(dialCodeOf(of('??'))).toBe('');
  });

  it('writes a number in international form for the fields that take no country', () => {
    expect(internationalNumber(of('NG'), '803 555 0142')).toBe('+2348035550142');
    expect(internationalNumber(of('NG'), '0803-555-0142')).toBe('+2348035550142');
    expect(internationalNumber(of('GB'), '(07700) 900123')).toBe('+447700900123');
    expect(internationalNumber(of('JM'), '876 555 0142')).toBe('+18765550142');
  });

  it('masks a number down to its calling code and last two digits, and to the digits until the list is in', () => {
    expect(maskedNumber(of('NG'), '803 555 0142')).toBe('+234 ••• ••• ••42');
    expect(maskedNumber(undefined, '803 555 0142')).toBe('••• ••• ••42');
  });

  it('groups the suggested country, then Africa by its time zones (islands included, Spain not), then the rest, named in the reader’s language', () => {
    const grouped = groupedCountries(countriesFixture, 'en-NG', 'NG');
    expect(grouped.suggested).toEqual([{ iso: 'NG', name: 'Nigeria', flag: '🇳🇬', dial: '+234' }]);
    expect(grouped.africa.map((country) => country.iso)).toEqual(['GH', 'KE', 'MU']);
    expect(grouped.world.map((country) => country.name)).toEqual(['Jamaica', 'Spain', 'United Kingdom']);
    expect(groupedCountries(countriesFixture, 'fr', 'NG').world.map((country) => country.name)).toContain('Espagne');
  });

  it('falls back to the backend’s name where the browser has none', () => {
    const unnamed = { ...countriesFixture[3]!, isoCode: 'XZ', name: 'Somewhere' };
    expect(groupedCountries([unnamed], 'en', '').world[0]?.name).toBe('Somewhere');
  });
});
