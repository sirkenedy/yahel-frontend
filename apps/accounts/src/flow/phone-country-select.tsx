import { FlowSelect } from '@yahel/ui';
import { africanCountries, namedCountries, otherCountries } from './countries';
import type { PhoneCountry } from './countries';

export interface PhoneCountrySelectProps {
  label: string;
  /** The names of the three groups, in the flow's words. */
  groups: { suggested: string; africa: string; world: string };
  /** The locale country names are given in. */
  locale: string;
  /** The country offered first. */
  suggested: string;
  value: string;
  onChange: (iso: string) => void;
}

// The dialling code comes first so it stays in view when the closed field is too narrow for the whole name.
const options = (countries: (PhoneCountry & { name: string })[]) =>
  countries.map((country) => (
    <option key={country.iso} value={country.iso}>
      {country.dial} {country.name}
    </option>
  ));

// Naming and sorting every country is done once per locale, not on every render.
const named = new Map<string, { africa: (PhoneCountry & { name: string })[]; world: (PhoneCountry & { name: string })[] }>();
const countriesIn = (locale: string) => named.get(locale) ?? named.set(locale, { africa: namedCountries(africanCountries, locale), world: namedCountries(otherCountries, locale) }).get(locale)!;

/** The country of a phone number: the suggested one, then Africa, then the rest of the world, each named in the reader's language. */
export function PhoneCountrySelect({ label, groups, locale, suggested, value, onChange }: PhoneCountrySelectProps) {
  const { africa, world } = countriesIn(locale);
  return (
    <FlowSelect label={label} name="tel-country-code" autoComplete="tel-country-code" value={value} onChange={onChange} isSensitive>
      <optgroup label={groups.suggested}>{options(africa.filter((country) => country.iso === suggested))}</optgroup>
      <optgroup label={groups.africa}>{options(africa.filter((country) => country.iso !== suggested))}</optgroup>
      <optgroup label={groups.world}>{options(world)}</optgroup>
    </FlowSelect>
  );
}
