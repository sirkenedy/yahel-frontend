import { isEmailShaped, newPasswordProblem as problemOf } from '../../flow/credentials';
import { signInMessages as m } from './messages';

export { passwordStrength } from '../../flow/credentials';
export type { StrengthScore } from '../../flow/credentials';

export const emailProblem = (email: string) => (email.trim() === '' ? m.emailRequired : isEmailShaped(email) ? null : m.emailInvalid);

export const newPasswordProblem = (password: string) => problemOf(password, m);
