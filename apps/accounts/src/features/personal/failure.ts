import { isApiError } from '@yahel/api-client';
import { personalMessages as m } from './messages';

/** What was being attempted, because the same status means different things at different steps. */
export type FailureContext = 'create' | 'code' | 'passkey' | 'other';

const byCode: Record<string, string> = {
  TOKEN_MAX_ATTEMPTS: m.tooManyCodes,
  PHONE_ALREADY_IN_USE: m.phoneRefused,
};

/**
 * Turns a failure into words for the person. Nothing from the server is shown as it came, and nothing
 * here says whether an address has an account: the two cases that could (a taken Yahel address, an
 * existing email) are handled by the flow, which sends the person to a step instead of showing a failure.
 */
export function describeFailure(error: unknown, context: FailureContext): string {
  if (!isApiError(error)) return context === 'passkey' ? m.passkeyFailed : m.unexpected;
  if (error.isNetwork) return m.offline;
  const known = byCode[error.code];
  if (known) return known;
  if (error.status === 429) return m.tooManyAttempts;
  if (context === 'code' && (error.status === 400 || error.status === 401 || error.status === 403)) return m.wrongCode;
  if (context === 'create' && (error.status === 400 || error.status === 422)) return m.detailsRefused;
  return m.unexpected;
}

export const hasCode = (error: unknown, code: string) => isApiError(error) && error.code === code;

/** A refusal the server will repeat however often it is asked, as opposed to a connection that dropped or a server that fell over. */
export const isRefusal = (error: unknown) => isApiError(error) && error.status >= 400 && error.status < 500 && error.status !== 429;
