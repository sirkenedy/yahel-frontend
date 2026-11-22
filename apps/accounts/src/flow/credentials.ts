// The rules both flows apply to what a person types, as facts. Each flow puts them into its own words.

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// The rule for a new password, the design's and the backend's alike: 8 characters with a capital, a lowercase letter, a number and a symbol.
const parts = { upper: /[A-Z]/, lower: /[a-z]/, digit: /\d/, symbol: /[^A-Za-z\d]/ } as const;
export type PasswordPart = keyof typeof parts;
export const MIN_NEW_PASSWORD = 8;

export const isEmailShaped = (value: string) => emailShape.test(value.trim());

const missingFrom = (password: string) => (Object.keys(parts) as PasswordPart[]).filter((part) => !parts[part].test(password));

/** A flow's words for what a new password lacks. */
export interface NewPasswordWords {
  newPasswordRequired: string;
  passwordParts: Record<PasswordPart, string>;
  listOf: (parts: readonly string[]) => string;
  newPasswordTooShort: (missing: string) => string;
  newPasswordTooPlain: (missing: string) => string;
}

/** What stops a new password being accepted, naming exactly what to add, or `null` when it can be used. */
export function newPasswordProblem(password: string, words: NewPasswordWords): string | null {
  if (password === '') return words.newPasswordRequired;
  const missing = words.listOf(missingFrom(password).map((part) => words.passwordParts[part]));
  if (password.length < MIN_NEW_PASSWORD) return words.newPasswordTooShort(missing);
  return missing ? words.newPasswordTooPlain(missing) : null;
}

/** The code the backend emails to confirm an address: six letters and numbers. */
export const EMAILED_CODE_LENGTH = 6;

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

/** The design's meter: long enough, then every kind of character, then longer still, then not containing the person's own name. */
export function passwordStrength(password: string, ownName = ''): StrengthScore {
  if (password === '') return 0;
  const acceptable = password.length >= MIN_NEW_PASSWORD && missingFrom(password).length === 0;
  if (!acceptable) return 1;
  if (password.length < 12) return 2;
  return password.length >= 14 && (ownName === '' || !password.toLowerCase().includes(ownName.toLowerCase())) ? 4 : 3;
}
