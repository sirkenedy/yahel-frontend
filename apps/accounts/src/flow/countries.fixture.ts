import { QueryClient } from '@tanstack/react-query';
import type { Country, CountryState } from '@yahel/api-client';
import { countriesQuery, statesQuery } from './countries';

// A few countries as `GET /v1/countries/public` lists them, for unit tests.
const country = (isoCode: string, name: string, flag: string, phonecode: string, currency: string, zoneName: string): Country => ({ isoCode, name, flag, phonecode, currency, timezones: [{ zoneName }] });

export const countriesFixture: Country[] = [
  country('NG', 'Nigeria', '🇳🇬', '234', 'NGN', 'Africa/Lagos'),
  country('GH', 'Ghana', '🇬🇭', '233', 'GHS', 'Africa/Accra'),
  country('KE', 'Kenya', '🇰🇪', '254', 'KES', 'Africa/Nairobi'),
  country('GB', 'United Kingdom', '🇬🇧', '44', 'GBP', 'Europe/London'),
  country('JM', 'Jamaica', '🇯🇲', '+1-876', 'JMD', 'America/Jamaica'),
];

export const nigerianStatesFixture: CountryState[] = [
  { name: 'Lagos', isoCode: 'LA', countryCode: 'NG' },
  { name: 'Oyo', isoCode: 'OY', countryCode: 'NG' },
];

/** A query client that already holds the lists, as one does once any step has loaded them. */
export const withCountries = (queryClient = new QueryClient()) => {
  queryClient.setQueryData(countriesQuery.queryKey, countriesFixture);
  for (const { isoCode } of countriesFixture) queryClient.setQueryData(statesQuery(isoCode).queryKey, isoCode === 'NG' ? nigerianStatesFixture : []);
  return queryClient;
};
