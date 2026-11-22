import { africanCountries, otherCountries } from '../../flow/countries';

// ISO 4217, by ISO 3166 country: what the backend's country record asks for alongside the name and code.
const currencies =
  'DZDZD AOAOA BJXOF BWBWP BFXOF BIBIF CVCVE CMXAF CFXAF TDXAF KMKMF CGXAF CIXOF CDCDF DJDJF EGEGP GQXAF ERERN SZSZL ETETB GAXAF GMGMD GHGHS GNGNF GWXOF KEKES LSLSL LRLRD LYLYD MGMGA MWMWK MLXOF MRMRU MUMUR MAMAD MZMZN NANAD NEXOF NGNGN RWRWF STSTN SNXOF SCSCR SLSLE SOSOS ZAZAR SSSSP SDSDG TZTZS TGXOF TNTND UGUGX ZMZMW ZWZWG AUAUD BRBRL CACAD CNCNY FREUR DEEUR ININR IEEUR ITEUR JMJMD JPJPY NLEUR PTEUR QAQAR SASAR ESEUR TTTTD TRTRY AEAED GBGBP USUSD';
const currencyBy = new Map(currencies.split(' ').map((entry) => [entry.slice(0, 2), entry.slice(2)]));

export const businessCountries = { african: africanCountries, other: otherCountries };

export const isBusinessCountry = (iso: string) => currencyBy.has(iso);

/** The country as the backend records it. The name is English, whatever language the page is in, so records read alike. */
export function countryRecord(iso: string) {
  const currency = currencyBy.get(iso);
  if (!currency) throw new Error(`No currency is known for ${iso}`);
  return { name: new Intl.DisplayNames('en', { type: 'region' }).of(iso) ?? iso, code: iso, currency };
}

export const NIGERIA = 'NG';

export const nigerianStates = 'Abia|Adamawa|Akwa Ibom|Anambra|Bauchi|Bayelsa|Benue|Borno|Cross River|Delta|Ebonyi|Edo|Ekiti|Enugu|FCT Abuja|Gombe|Imo|Jigawa|Kaduna|Kano|Katsina|Kebbi|Kogi|Kwara|Lagos|Nasarawa|Niger|Ogun|Ondo|Osun|Oyo|Plateau|Rivers|Sokoto|Taraba|Yobe|Zamfara'.split('|');
