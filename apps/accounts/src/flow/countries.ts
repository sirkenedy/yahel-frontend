import { queryOptions, useQuery } from '@tanstack/react-query';
import type { Country } from '@yahel/api-client';
import { session } from '../session';

// Public lists that change with a backend release, not while a page is open: every step reads one cached copy (F-113).
export const countriesQuery = queryOptions({ queryKey: ['countries'], queryFn: ({ signal }) => session.api.reference.countries(signal), staleTime: Infinity });

/** A country's states; none for a country that is not divided into them. */
export const statesQuery = (country: string) => queryOptions({ queryKey: ['countries', country, 'states'], queryFn: ({ signal }) => session.api.reference.states(country, signal), staleTime: Infinity });

export const useCountries = () => useQuery(countriesQuery);

export const countryOf = (countries: readonly Country[] | undefined, iso: string) => countries?.find((country) => country.isoCode === iso);

/** What is dialled first. A territory listed as "+1-876" has the calling code +1; the 876 is part of its national numbers. */
export const dialCodeOf = (country: Country | undefined) => (country ? `+${/\d+/.exec(country.phonecode)?.[0] ?? ''}` : '');

/** The number in international form, for the fields that take no `countryCode`: the calling code, then the digits without a leading zero. */
export const internationalNumber = (country: Country | undefined, national: string) => `${dialCodeOf(country)}${national.replace(/\D/g, '').replace(/^0+/, '')}`;

/** Enough to recognise the number, not enough to learn it. */
export const maskedNumber = (country: Country | undefined, national: string) => `${dialCodeOf(country)} ••• ••• ••${national.replace(/\D/g, '').slice(-2)}`.trim();

/** The number masked, with its calling code once the list of countries is in. */
export const useMaskedNumber = (iso: string, national: string) => maskedNumber(countryOf(useCountries().data, iso), national);

export interface NamedCountry {
  iso: string;
  name: string;
  flag: string;
  dial: string;
}

/** The suggested country, then every other country A to Z, named in the reader's language (as Google's pickers do). */
export function groupedCountries(countries: readonly Country[], locale: string, suggested: string) {
  const names = new Intl.DisplayNames(locale, { type: 'region', fallback: 'none' });
  const named = (list: Country[]): NamedCountry[] =>
    list.map((country) => ({ iso: country.isoCode, name: names.of(country.isoCode) ?? country.name, flag: country.flag, dial: dialCodeOf(country) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  return { suggested: named(countries.filter((country) => country.isoCode === suggested)), all: named(countries.filter((country) => country.isoCode !== suggested)) };
}
