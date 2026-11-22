import { isEmailShaped, newPasswordFault } from '../../flow/credentials';
import { signInMessages as m } from './messages';

export { passwordStrength } from '../../flow/credentials';
export type { StrengthScore } from '../../flow/credentials';

export const emailProblem = (email: string) => (email.trim() === '' ? m.emailRequired : isEmailShaped(email) ? null : m.emailInvalid);

const newPasswordFaults = { 'too-short': m.newPasswordTooShort, 'too-plain': m.newPasswordTooPlain } as const;

export const newPasswordProblem = (password: string) => {
  const fault = newPasswordFault(password);
  return fault ? newPasswordFaults[fault] : null;
};
