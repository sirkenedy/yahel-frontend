import { FlowSelect } from '@yahel/ui';
import { useMemo } from 'react';
import { groupedCountries, useCountries } from './countries';
import type { NamedCountry } from './countries';
import { ListUnavailable } from './list-unavailable';

export interface CountrySelectProps {
  label: string;
  /** The names of the three groups, in the flow's words. */
  groups: { suggested: string; all: string };
  /** The locale country names are given in. */
  locale: string;
  /** The country offered first. */
  suggested: string;
  value: string;
  onChange: (iso: string) => void;
  /** The country of a phone number: each choice shows its dialling code. */
  forPhone?: boolean;
}

/** A country from the backend's list: the suggested one, then every other A to Z, each flagged and named in the reader's language. */
export function CountrySelect({ label, groups, locale, suggested, value, onChange, forPhone = false }: CountrySelectProps) {
  const countries = useCountries();
  const grouped = useMemo(() => countries.data && groupedCountries(countries.data, locale, suggested), [countries.data, locale, suggested]);
  if (!grouped) return <ListUnavailable label={label} failed={countries.isError} onRetry={() => void countries.refetch()} />;

  // The dialling code comes before the name so it stays in view when the closed field is too narrow for the whole name.
  const options = (list: NamedCountry[]) =>
    list.map((country) => (
      <option key={country.iso} value={country.iso}>
        {forPhone ? `${country.flag} ${country.dial} ${country.name}` : `${country.flag} ${country.name}`}
      </option>
    ));
  return (
    <FlowSelect label={label} name={forPhone ? 'tel-country-code' : 'country'} autoComplete={forPhone ? 'tel-country-code' : 'country'} value={value} onChange={onChange} isSensitive={forPhone}>
      <optgroup label={groups.suggested}>{options(grouped.suggested)}</optgroup>
      <optgroup label={groups.all}>{options(grouped.all)}</optgroup>
    </FlowSelect>
  );
}
