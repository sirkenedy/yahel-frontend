import { signInMessages as m } from './messages';

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const letter = /[a-z]/i;
const nonLetter = /[^a-z]/i;
// The backend's rule for a new password: upper case, lower case, a number and a symbol.
const backendClasses = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
const MIN_NEW_PASSWORD = 12;

export const emailProblem = (email: string) => (email.trim() === '' ? m.emailRequired : emailShape.test(email.trim()) ? null : m.emailInvalid);

export const newPasswordProblem = (password: string) =>
  password.length < MIN_NEW_PASSWORD ? m.newPasswordTooShort : backendClasses.every((pattern) => pattern.test(password)) ? null : m.newPasswordTooPlain;

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

/** The design's meter: length first, then variety, then not containing the person's own name. */
export function passwordStrength(password: string, ownName = ''): StrengthScore {
  if (password === '') return 0;
  const points = [
    password.length >= MIN_NEW_PASSWORD,
    password.length >= 16,
    letter.test(password) && nonLetter.test(password),
    password.length >= MIN_NEW_PASSWORD && (ownName === '' || !password.toLowerCase().includes(ownName.toLowerCase())),
  ].filter(Boolean).length;
  return Math.max(1, points) as StrengthScore;
}
