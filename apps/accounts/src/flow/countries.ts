import { queryOptions, useQuery } from '@tanstack/react-query';
import type { Country } from '@yahel/api-client';
import { session } from '../session';
import { flowMessages as m } from './messages';

// Public lists that change with a backend release, not while a page is open: every step reads one cached copy (F-113).
// No abort signal: a step that unmounts while the list is loading would cancel it, and the next step would ask again.
export const countriesQuery = queryOptions({ queryKey: ['countries'], queryFn: () => session.api.reference.countries(), staleTime: Infinity });

/** A country's states; none for a country that is not divided into them. */
export const statesQuery = (country: string) => queryOptions({ queryKey: ['countries', country, 'states'], queryFn: () => session.api.reference.states(country), staleTime: Infinity });

export const useCountries = () => useQuery(countriesQuery);

export const countryProblem = (iso: string) => (iso ? null : m.countryRequired);

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

/** Every country A to Z by its name in the reader's language, as Google's pickers list them. */
export function namedCountries(countries: readonly Country[], locale: string): NamedCountry[] {
  const names = new Intl.DisplayNames(locale, { type: 'region', fallback: 'none' });
  return countries.map((country) => ({ iso: country.isoCode, name: names.of(country.isoCode) ?? country.name, flag: country.flag, dial: dialCodeOf(country) })).sort((a, b) => a.name.localeCompare(b.name, locale));
}

export interface BrowserPlace {
  timeZone?: string;
  language?: string;
}

const regionOf = (language: string) => {
  try {
    return new Intl.Locale(language).region;
  } catch {
    return undefined;
  }
};

/** Where the person probably is, with no prompt and no request: the country that lists the browser's time zone, else its language's region, else none. */
export function detectCountry(countries: readonly Country[], { timeZone, language }: BrowserPlace) {
  const byZone = timeZone ? countries.find((country) => country.timezones.some((zone) => zone.zoneName === timeZone)) : undefined;
  if (byZone) return byZone.isoCode;
  const region = language ? regionOf(language) : undefined;
  return region && countries.some((country) => country.isoCode === region) ? region : '';
}

export const browserPlace = (): BrowserPlace => ({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: globalThis.navigator?.language });
