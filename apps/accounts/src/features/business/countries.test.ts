import { describe, expect, it } from 'vitest';
import { businessCountries, countryRecord, isBusinessCountry, nigerianStates } from './countries';

describe('business countries', () => {
  it('records a country the way the backend takes it: an English name, the code and its currency', () => {
    expect(countryRecord('NG')).toEqual({ name: 'Nigeria', code: 'NG', currency: 'NGN' });
    expect(countryRecord('KE')).toEqual({ name: 'Kenya', code: 'KE', currency: 'KES' });
    expect(countryRecord('DE')).toEqual({ name: 'Germany', code: 'DE', currency: 'EUR' });
    expect(countryRecord('SN').currency).toBe('XOF');
  });

  it('knows a currency for every country it offers, and none for one it does not', () => {
    for (const { iso } of [...businessCountries.african, ...businessCountries.other]) {
      expect(isBusinessCountry(iso)).toBe(true);
      expect(countryRecord(iso)).toMatchObject({ code: iso, currency: expect.stringMatching(/^[A-Z]{3}$/) as string });
      expect(countryRecord(iso).name.length).toBeGreaterThanOrEqual(3);
    }
    expect(isBusinessCountry('XX')).toBe(false);
    expect(() => countryRecord('XX')).toThrow(/No currency/);
  });

  it('lists Nigeria’s thirty-six states and the capital territory', () => {
    expect(nigerianStates).toHaveLength(37);
    expect(nigerianStates).toContain('Lagos');
    expect(nigerianStates).toContain('FCT Abuja');
  });
});
