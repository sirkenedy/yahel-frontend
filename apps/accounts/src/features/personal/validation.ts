import { isEmailShaped, newPasswordProblem } from '../../flow/credentials';
import type { BirthDate } from './machine';
import { personalMessages as m } from './messages';

const MAX_NAME = 50;
const MIN_AGE = 13;
const MIN_ADDRESS = 4;
const MAX_ADDRESS = 30;
const addressCharacters = /^[a-z0-9.]+$/;
const misplacedDot = /^\.|\.$|\.\./;
const wholeNumber = /^\d+$/;
export const CODE_LENGTH = 6;

export const firstNameProblem = (name: string) => (name.trim() === '' ? m.firstNameRequired : name.trim().length > MAX_NAME ? m.nameTooLong : null);
export const lastNameProblem = (name: string) => (name.trim().length > MAX_NAME ? m.nameTooLong : null);

/** Whole years lived, counted the way the backend counts them (UTC calendar dates). */
export function ageOn(birth: BirthDate, today: Date) {
  const years = today.getUTCFullYear() - birth.year;
  const birthdayPassed = today.getUTCMonth() + 1 > birth.month || (today.getUTCMonth() + 1 === birth.month && today.getUTCDate() >= birth.day);
  return birthdayPassed ? years : years - 1;
}

const daysIn = (month: number, year: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** What is wrong with a date of birth as typed, field by field, and the date itself when nothing is. */
export function readBirthDate(typed: { day: string; month: string; year: string }, today = new Date()): { problems: { day?: string; month?: string; year?: string }; birth: BirthDate | null } {
  const day = wholeNumber.test(typed.day.trim()) ? Number(typed.day) : NaN;
  const month = Number(typed.month);
  const year = /^\d{4}$/.test(typed.year.trim()) ? Number(typed.year) : NaN;
  const problems: { day?: string; month?: string; year?: string } = {};
  if (!typed.month) problems.month = m.monthRequired;
  if (!(year >= 1900 && year <= today.getUTCFullYear())) problems.year = m.yearInvalid;
  // A day is checked against the month and year it belongs to once those are known, and against 31 until then.
  const longest = problems.month || problems.year ? 31 : daysIn(month, year);
  if (!(day >= 1 && day <= longest)) problems.day = m.dayInvalid;
  if (problems.day || problems.month || problems.year) return { problems, birth: null };
  const birth = { day, month, year };
  return ageOn(birth, today) < MIN_AGE ? { problems: { year: m.tooYoung }, birth: null } : { problems: {}, birth };
}

/** The date as the backend takes it: midnight UTC of that calendar day. */
export const isoBirthDate = ({ day, month, year }: BirthDate) => new Date(Date.UTC(year, month - 1, day)).toISOString();

/** What is typed into the address field becomes a candidate name: lower case, spaces as full stops. */
export const normaliseAddress = (typed: string) => typed.toLowerCase().replace(/\s+/g, '.');

export function addressProblem(name: string) {
  if (name === '') return m.addressRequired;
  if (!addressCharacters.test(name)) return m.addressCharacters;
  if (misplacedDot.test(name)) return m.addressDots;
  if (name.length < MIN_ADDRESS) return m.addressTooShort;
  return name.length > MAX_ADDRESS ? m.addressTooLong : null;
}

/** A first guess at an address from the person's name, to ask about before they type one. */
export const addressFromName = (firstName: string, lastName: string) => {
  const part = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return [part(firstName), part(lastName)].filter(Boolean).join('.');
};

export const ownEmailProblem = (email: string) => (isEmailShaped(email) ? null : m.ownEmailInvalid);

export const passwordProblem = (password: string) => newPasswordProblem(password, m);

const sameAddress = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The recovery step asks for a phone, an email, or both; skipping is a separate action. */
export function recoveryProblems({ phone, email }: { phone: string; email: string }, signInAddress: string): { phone?: string; email?: string } {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim() === '' && email.trim() === '') return { phone: m.recoveryEmpty };
  return {
    ...(phone.trim() !== '' && digits.length < 7 ? { phone: m.phoneInvalid } : {}),
    ...(email.trim() === '' ? {} : !isEmailShaped(email) ? { email: m.recoveryEmailInvalid } : sameAddress(email, signInAddress) ? { email: m.recoveryEmailSame } : {}),
  };
}

export const codeProblem = (code: string) => (code.length === CODE_LENGTH ? null : m.codeIncomplete);

export function contactProblem(contact: string, ownAddresses: readonly string[]) {
  if (contact.trim() === '') return m.contactRequired;
  if (!isEmailShaped(contact)) return m.contactInvalid;
  return ownAddresses.some((own) => own !== '' && sameAddress(own, contact)) ? m.contactOwn : null;
}
