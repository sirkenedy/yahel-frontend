/** A country a phone number can belong to: its ISO code and what is dialled first. Names come from the browser, in the reader's language. */
export interface PhoneCountry {
  iso: string;
  dial: string;
}

const parse = (list: string): PhoneCountry[] => list.split(' ').map((entry) => ({ iso: entry.slice(0, 2), dial: `+${entry.slice(2)}` }));

export const africanCountries = parse(
  'DZ213 AO244 BJ229 BW267 BF226 BI257 CV238 CM237 CF236 TD235 KM269 CG242 CI225 CD243 DJ253 EG20 GQ240 ER291 SZ268 ET251 GA241 GM220 GH233 GN224 GW245 KE254 LS266 LR231 LY218 MG261 MW265 ML223 MR222 MU230 MA212 MZ258 NA264 NE227 NG234 RW250 ST239 SN221 SC248 SL232 SO252 ZA27 SS211 SD249 TZ255 TG228 TN216 UG256 ZM260 ZW263',
);

export const otherCountries = parse('AU61 BR55 CA1 CN86 FR33 DE49 IN91 IE353 IT39 JM1 JP81 NL31 PT351 QA974 SA966 ES34 TT1 TR90 AE971 GB44 US1');

const all = [...africanCountries, ...otherCountries];

export const dialCodeOf = (iso: string) => all.find((country) => country.iso === iso)?.dial ?? '';

/** The number as the backend wants it: `+`, the country's code, then the digits without a leading zero. */
export const internationalNumber = (iso: string, national: string) => `${dialCodeOf(iso)}${national.replace(/\D/g, '').replace(/^0+/, '')}`;

/** Enough to recognise the number, not enough to learn it. */
export const maskedNumber = (iso: string, national: string) => `${dialCodeOf(iso)} ••• ••• ••${national.replace(/\D/g, '').slice(-2)}`;

/** Names the countries in the reader's language and sorts them by that name. */
export function namedCountries(countries: readonly PhoneCountry[], locale: string) {
  const names = new Intl.DisplayNames(locale, { type: 'region' });
  return countries.map((country) => ({ ...country, name: names.of(country.iso) ?? country.iso })).sort((a, b) => a.name.localeCompare(b.name, locale));
}
