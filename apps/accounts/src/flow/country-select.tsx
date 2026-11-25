import { FlowSearchSelect } from '@yahel/ui';
import { useEffect, useMemo } from 'react';
import type { Ref } from 'react';
import { browserPlace, detectCountry, namedCountries, useCountries } from './countries';
import { ListUnavailable } from './list-unavailable';
import { flowMessages as m } from './messages';

export interface CountrySelectProps {
  label: string;
  /** The locale country names are given in. */
  locale: string;
  /** The country chosen, or `''` for none yet: the person's location is then filled in where the browser tells it. */
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  inputRef?: Ref<HTMLButtonElement>;
  /** The country of a phone number: each choice shows its dialling code, and the closed field shows the flag and code. */
  forPhone?: boolean;
}

/** A country from the backend's list, A to Z, each flagged and named in the reader's language, searchable by name, ISO code or dialling code. It starts on where the person is. */
export function CountrySelect({ label, locale, value, onChange, error, inputRef, forPhone = false }: CountrySelectProps) {
  const countries = useCountries();
  const items = useMemo(
    () =>
      countries.data &&
      namedCountries(countries.data, locale).map((country) => ({
        id: country.iso,
        label: country.name,
        leading: country.flag,
        detail: forPhone ? country.dial : country.iso,
        display: forPhone ? country.dial : undefined,
        textValue: `${country.name} ${country.iso} ${country.dial}`,
      })),
    [countries.data, locale, forPhone],
  );

  // A choice already made, in this step or an earlier visit to it, is never replaced.
  useEffect(() => {
    const detected = value === '' && countries.data ? detectCountry(countries.data, browserPlace()) : '';
    if (detected) onChange(detected);
  }, [value, countries.data, onChange]);

  if (!items) return <ListUnavailable label={label} failed={countries.isError} onRetry={() => void countries.refetch()} />;
  return (
    <FlowSearchSelect
      label={label}
      items={items}
      value={value}
      onChange={onChange}
      placeholder={m.chooseCountry}
      searchLabel={forPhone ? m.searchCountryCode : m.searchCountry}
      searchPlaceholder={m.search}
      emptyText={m.noMatches}
      error={error}
      inputRef={inputRef}
      isSensitive={forPhone}
    />
  );
}
