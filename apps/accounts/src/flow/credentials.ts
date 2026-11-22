// The rules both flows apply to what a person types, as facts. Each flow puts them into its own words.

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const letter = /[a-z]/i;
const nonLetter = /[^a-z]/i;
// The backend's rule for a new password: upper case, lower case, a number and a symbol.
const backendClasses = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
export const MIN_NEW_PASSWORD = 12;

export const isEmailShaped = (value: string) => emailShape.test(value.trim());

/** What stops a new password being accepted: the design asks for length, the backend for variety, and both apply. */
export const newPasswordFault = (password: string): 'too-short' | 'too-plain' | null =>
  password.length < MIN_NEW_PASSWORD ? 'too-short' : backendClasses.every((pattern) => pattern.test(password)) ? null : 'too-plain';

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
