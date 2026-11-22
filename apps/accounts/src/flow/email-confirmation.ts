import type { Session, SignInResult } from '@yahel/auth';
import { hasCode } from './feedback';

type SignInSession = Pick<Session, 'signIn' | 'api'>;

/** How signing in with a password ended, including with the address still to be confirmed. */
export type PasswordSignIn = SignInResult | { ok: false; reason: 'unconfirmed' };

/** How submitting the emailed code ended: signed in, or confirmed while the sign-in after it failed. */
export type ConfirmedSignIn = SignInResult | { ok: false; reason: 'sign-in-failed' };

/**
 * Signs in with a password. When the backend answers that the address has never been confirmed, which it
 * says only once the password has matched, a fresh code is asked for (the one sent at registration may be
 * long gone) and the answer is `unconfirmed`: the password is then proven, and only then may the caller
 * hold it while the code is typed (decisions F-50, F-68).
 */
export async function signInOrConfirm(session: SignInSession, email: string, password: string): Promise<PasswordSignIn> {
  try {
    return await session.signIn(email, password);
  } catch (error) {
    if (!hasCode(error, 'EMAIL_NOT_VERIFIED')) throw error;
    await session.api.auth.resendVerification({ email }).catch(() => undefined);
    return { ok: false, reason: 'unconfirmed' };
  }
}

/**
 * Submits the emailed code, then signs in with the password this visit proved. Refuses to run without that
 * proof: a code is never submitted for a registration whose password is not in hand. `onConfirmed` runs the
 * moment the address is confirmed, which is final whatever the sign-in after it does.
 */
export async function confirmAndSignIn(session: SignInSession, email: string, code: string, proven: string | null, onConfirmed: () => void): Promise<ConfirmedSignIn> {
  if (proven === null) throw new Error('No password has been proven in this visit');
  await session.api.auth.verifyEmail({ email, token: code });
  onConfirmed();
  try {
    return await session.signIn(email, proven);
  } catch {
    return { ok: false, reason: 'sign-in-failed' };
  }
}

/** Asks for another emailed code, only while a password proven in this visit is held. */
export async function resendConfirmation(session: SignInSession, email: string, proven: string | null) {
  if (proven === null) throw new Error('No password has been proven in this visit');
  await session.api.auth.resendVerification({ email });
}
