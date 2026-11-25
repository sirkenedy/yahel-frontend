import { FlowSelect } from '@yahel/ui';
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
  inputRef?: Ref<HTMLSelectElement>;
  /** The country of a phone number: each choice shows its dialling code. */
  forPhone?: boolean;
}

/** A country from the backend's list, A to Z, each flagged and named in the reader's language. It starts on where the person is. */
export function CountrySelect({ label, locale, value, onChange, error, inputRef, forPhone = false }: CountrySelectProps) {
  const countries = useCountries();
  const named = useMemo(() => countries.data && namedCountries(countries.data, locale), [countries.data, locale]);

  // A choice already made, in this step or an earlier visit to it, is never replaced.
  useEffect(() => {
    const detected = value === '' && countries.data ? detectCountry(countries.data, browserPlace()) : '';
    if (detected) onChange(detected);
  }, [value, countries.data, onChange]);

  if (!named) return <ListUnavailable label={label} failed={countries.isError} onRetry={() => void countries.refetch()} />;
  return (
    <FlowSelect label={label} name={forPhone ? 'tel-country-code' : 'country'} autoComplete={forPhone ? 'tel-country-code' : 'country'} value={value} onChange={onChange} error={error} inputRef={inputRef} isSensitive={forPhone}>
      {value === '' ? <option value="">{m.chooseCountry}</option> : null}
      {/* The dialling code comes before the name so it stays in view when the closed field is too narrow for the whole name. */}
      {named.map((country) => (
        <option key={country.iso} value={country.iso}>
          {forPhone ? `${country.flag} ${country.dial} ${country.name}` : `${country.flag} ${country.name}`}
        </option>
      ))}
    </FlowSelect>
  );
}
