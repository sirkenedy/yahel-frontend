import { flowMessages as shared } from '../../flow/messages';
import { adminMessages as m } from './messages';

/** The code texted to a phone: six letters and numbers, as the backend issues them (decisions F-42). */
export const CODE_LENGTH = 6;

const MIN_DIGITS = 7;
const MAX_DIGITS = 15;
const allowed = /^[\d\s()-]+$/;

/** What is wrong with a mobile number typed without its country code, or `null` when it can be sent. */
export function phoneProblem(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits === '') return m.phoneRequired;
  return allowed.test(value.trim()) && digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS ? null : m.phoneInvalid;
}

export const codeProblem = (value: string) => (value.length === CODE_LENGTH ? null : shared.emailedCode.codeIncomplete);
