import { describe, expect, it } from 'vitest';
import { countryOf, detectCountry, dialCodeOf, internationalNumber, maskedNumber, namedCountries } from './countries';
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

  it('lists every country A to Z by its name in the reader’s language', () => {
    expect(namedCountries(countriesFixture, 'en-NG')[0]).toEqual({ iso: 'GH', name: 'Ghana', flag: '🇬🇭', dial: '+233' });
    expect(namedCountries(countriesFixture, 'en-NG').map((country) => country.name)).toEqual(['Ghana', 'Jamaica', 'Kenya', 'Nigeria', 'United Kingdom']);
    expect(namedCountries(countriesFixture, 'fr').map((country) => country.name)).toEqual(['Ghana', 'Jamaïque', 'Kenya', 'Nigeria', 'Royaume-Uni']);
  });

  it('falls back to the backend’s name where the browser has none', () => {
    const unnamed = { ...countriesFixture[3]!, isoCode: 'XZ', name: 'Somewhere' };
    expect(namedCountries([unnamed], 'en')[0]?.name).toBe('Somewhere');
  });

  it('finds where the person is from the browser’s time zone, then its language’s region, else nowhere', () => {
    expect(detectCountry(countriesFixture, { timeZone: 'Africa/Accra', language: 'en-NG' })).toBe('GH');
    expect(detectCountry(countriesFixture, { timeZone: 'UTC', language: 'en-KE' })).toBe('KE');
    expect(detectCountry(countriesFixture, { language: 'en-GB' })).toBe('GB');
    expect(detectCountry(countriesFixture, { timeZone: 'Asia/Tokyo', language: 'ja-JP' })).toBe('');
    expect(detectCountry(countriesFixture, { timeZone: 'UTC', language: 'en' })).toBe('');
    expect(detectCountry(countriesFixture, { language: 'not a language' })).toBe('');
  });
});
