import type { BirthDate } from './machine';

export type DatePart = 'day' | 'month' | 'year';

const isDatePart = (type: string): type is DatePart => type === 'day' || type === 'month' || type === 'year';

/** The order a date's parts are written in for a locale: day first in Lagos, month first in New York. */
export const datePartOrder = (locale: string): DatePart[] =>
  new Intl.DateTimeFormat(locale)
    .formatToParts(new Date(Date.UTC(2000, 11, 31)))
    .map((part) => part.type)
    .filter(isDatePart);

/** The twelve months by name, in the reader's language. */
export const monthNames = (locale: string) => {
  const name = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, index) => name.format(new Date(Date.UTC(2000, index, 1))));
};

export const writtenDate = ({ day, month, year }: BirthDate, locale: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
