import { isApiError } from '@yahel/api-client';
import { signInMessages as m } from './messages';

/** What was being attempted, because the same status means different things at different steps. */
export type FailureContext = 'password' | 'passkey' | 'code' | 'reset' | 'other';

const byCode: Record<string, string> = {
  EMAIL_NOT_VERIFIED: m.emailNotConfirmed,
  SSO_REQUIRED: m.singleSignOnRequired,
  MFA_MAX_ATTEMPTS: m.tooManyCodes,
  TOKEN_MAX_ATTEMPTS: m.tooManyResetCodes,
};

const refused: Record<FailureContext, string> = {
  password: m.wrongCredentials,
  passkey: m.passkeyFailed,
  code: m.wrongCode,
  reset: m.recoverCodeRejected,
  other: m.unexpected,
};

/**
 * Turns a failure into words for the person. Nothing from the server is shown as it came, and a wrong
 * password reads exactly like an unknown address, so the answer never reveals whether an account exists.
 */
export function describeFailure(error: unknown, context: FailureContext): string {
  // Outside the API, only the device can fail: a broken or unsupported authenticator.
  if (!isApiError(error)) return context === 'passkey' ? m.passkeyFailed : m.unexpected;
  if (error.isNetwork) return m.offline;
  const known = byCode[error.code];
  if (known) return known;
  if (error.status === 429) return m.tooManyAttempts;
  if (error.status === 403) return m.cannotSignIn;
  if (error.status === 400 && context === 'reset') return m.passwordRefused;
  if (error.status === 400 || error.status === 401 || error.status === 404) return refused[context];
  return m.unexpected;
}

/** A reset that failed because of the code, not the password: the person has to go back one step. */
export const isRejectedResetCode = (error: unknown) => isApiError(error) && (error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_MAX_ATTEMPTS');
