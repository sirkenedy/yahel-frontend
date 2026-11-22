import type { BirthDate } from './dates';

const wholeNumber = /^\d+$/;
const fourDigits = /^\d{4}$/;

/** A flow's words for what is wrong with a date of birth. */
export interface BirthDateWords {
  dayInvalid: string;
  monthRequired: string;
  yearInvalid: string;
  tooYoung: string;
}

/** Whole years lived, counted the way the backend counts them (UTC calendar dates). */
export function ageOn(birth: BirthDate, today: Date) {
  const years = today.getUTCFullYear() - birth.year;
  const birthdayPassed = today.getUTCMonth() + 1 > birth.month || (today.getUTCMonth() + 1 === birth.month && today.getUTCDate() >= birth.day);
  return birthdayPassed ? years : years - 1;
}

const daysIn = (month: number, year: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

export type TypedBirthDate = Record<'day' | 'month' | 'year', string>;

/** What is wrong with a date of birth as typed, field by field, and the date itself when nothing is. */
export function readBirthDate(typed: TypedBirthDate, words: BirthDateWords, minAge: number, today = new Date()): { problems: Partial<TypedBirthDate>; birth: BirthDate | null } {
  const day = wholeNumber.test(typed.day.trim()) ? Number(typed.day) : NaN;
  const month = Number(typed.month);
  const year = fourDigits.test(typed.year.trim()) ? Number(typed.year) : NaN;
  const problems: Partial<TypedBirthDate> = {};
  if (!typed.month) problems.month = words.monthRequired;
  if (!(year >= 1900 && year <= today.getUTCFullYear())) problems.year = words.yearInvalid;
  // A day is checked against the month and year it belongs to once those are known, and against 31 until then.
  const longest = problems.month || problems.year ? 31 : daysIn(month, year);
  if (!(day >= 1 && day <= longest)) problems.day = words.dayInvalid;
  if (problems.day || problems.month || problems.year) return { problems, birth: null };
  const birth = { day, month, year };
  return ageOn(birth, today) < minAge ? { problems: { year: words.tooYoung }, birth: null } : { problems: {}, birth };
}

/** The date as the backend takes it: midnight UTC of that calendar day. */
export const isoBirthDate = ({ day, month, year }: BirthDate) => new Date(Date.UTC(year, month - 1, day)).toISOString();
