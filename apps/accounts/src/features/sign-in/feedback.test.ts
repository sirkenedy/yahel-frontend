import { ApiError } from '@yahel/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowMessages as fm } from '../../flow/messages';
import { carried, describeSignInFailure, rejectedResetCode } from './feedback';
import type { FailureContext } from './feedback';
import { signInMessages as m } from './messages';

// What the server wrote. It must never reach the person.
const SERVER_WORDS = 'zx-internal-detail-from-the-server';
const answer = (status: number, code: string, more: { requestId?: string; retryAfter?: number } = {}) => new ApiError({ status, code, message: SERVER_WORDS, ...more });
const contexts: FailureContext[] = ['password', 'passkey', 'code', 'reset', 'other'];

const wrongCredentials = { place: 'field', field: 'password', text: m.wrongCredentials };
const wrongCode = { place: 'field', field: 'code', text: m.wrongCode };
const refusedPassword = { place: 'field', field: 'password', text: m.passwordRefused };
const passkeyFailed = { place: 'banner', tone: 'danger', text: m.passkeyFailed };
const deadCode = { place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyCodes, next: 'sign-in-again' };
const serverError = { place: 'banner', tone: 'danger', title: fm.serverErrorTitle, text: fm.serverErrorText, next: 'retry' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('describeSignInFailure: the password', () => {
  it('reads exactly the same for a wrong password and an unknown address, beside the password field', () => {
    const wrongPassword = describeSignInFailure(answer(401, 'INVALID_CREDENTIALS'), 'password');
    const unknownAddress = describeSignInFailure(answer(404, 'USER_NOT_FOUND'), 'password');
    const uncoded = describeSignInFailure(answer(401, 'UNKNOWN_ERROR'), 'password');
    const badRequest = describeSignInFailure(answer(400, 'BAD_REQUEST'), 'password');

    expect(wrongPassword).toEqual(wrongCredentials);
    for (const other of [unknownAddress, uncoded, badRequest]) expect(other).toEqual(wrongPassword);
    // Neither says which half was wrong, or that the account exists.
    expect(m.wrongCredentials).not.toMatch(/wrong password|no account|not found|doesn’t exist/i);
  });

  it('says to confirm the email first, as information rather than an error', () => {
    expect(describeSignInFailure(answer(403, 'EMAIL_NOT_VERIFIED'), 'password')).toEqual({ place: 'banner', tone: 'info', title: m.confirmEmailTitle, text: m.emailNotConfirmed });
  });

  it('says the organisation signs people in itself', () => {
    expect(describeSignInFailure(answer(403, 'SSO_REQUIRED'), 'password')).toEqual({ place: 'banner', tone: 'info', title: m.singleSignOnTitle, text: m.singleSignOnRequired });
  });

  it('warns that a new password is needed and offers to reset it', () => {
    expect(describeSignInFailure(answer(403, 'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED'), 'password')).toEqual({ place: 'banner', tone: 'warning', title: m.newPasswordNeededTitle, text: m.newPasswordNeeded, next: 'reset-password' });
  });

  it.each<FailureContext>(['password', 'passkey'])('pauses sign-in on too many tries by %s, whatever code the limiter used, and says until when if the server does', (context) => {
    expect(describeSignInFailure(answer(429, 'BAD_REQUEST'), context)).toEqual({ place: 'screen', screen: 'locked' });
    expect(describeSignInFailure(answer(429, 'TOO_MANY_REQUESTS'), context)).toEqual({ place: 'screen', screen: 'locked' });

    const before = Date.now();
    const timed = describeSignInFailure(answer(429, 'BAD_REQUEST', { retryAfter: 900 }), context);
    expect(timed).toMatchObject({ place: 'screen', screen: 'locked' });
    expect(timed.place === 'screen' ? timed.retryAt : 0).toBeGreaterThanOrEqual(before + 900_000);
    expect(timed.place === 'screen' ? timed.retryAt : Infinity).toBeLessThanOrEqual(Date.now() + 900_000);
  });

  it.each<FailureContext>(['password', 'passkey'])('shows an account that may not sign in (by %s) as the turned-off screen, by today’s 403 or by its own code', (context) => {
    expect(describeSignInFailure(answer(403, 'FORBIDDEN'), context)).toEqual({ place: 'screen', screen: 'suspended' });
    expect(describeSignInFailure(answer(403, 'ACCOUNT_SUSPENDED'), context)).toEqual({ place: 'screen', screen: 'suspended' });
  });

  it.each(contexts)('shows a paused organisation as its own screen (%s)', (context) => {
    expect(describeSignInFailure(answer(403, 'TENANT_SUSPENDED'), context)).toEqual({ place: 'screen', screen: 'org-paused' });
  });
});

describe('describeSignInFailure: the passkey', () => {
  it('says the passkey did not work when the device or the server refused it', () => {
    expect(describeSignInFailure(new DOMException('broken', 'UnknownError'), 'passkey')).toEqual(passkeyFailed);
    expect(describeSignInFailure(new Error(SERVER_WORDS), 'passkey')).toEqual(passkeyFailed);
    expect(describeSignInFailure(answer(401, 'INVALID_CREDENTIALS'), 'passkey')).toEqual(passkeyFailed);
    expect(describeSignInFailure(answer(400, 'BAD_REQUEST'), 'passkey')).toEqual(passkeyFailed);
  });
});

describe('describeSignInFailure: the second-step code', () => {
  it.each([
    [401, 'MFA_INVALID'],
    [401, 'INVALID_MFA_CODE'],
    [401, 'INVALID_TOKEN'],
    [400, 'BAD_REQUEST'],
  ])('puts a wrong code (%i %s) beside the code', (status, code) => {
    expect(describeSignInFailure(answer(status, code), 'code')).toEqual(wrongCode);
  });

  it.each(['MFA_MAX_ATTEMPTS', 'TOKEN_MAX_ATTEMPTS'])('says the code is dead after %s and leads back to signing in again, not to a wait', (code) => {
    expect(describeSignInFailure(answer(429, code), 'code')).toEqual(deadCode);
  });
});

describe('describeSignInFailure: the new password', () => {
  it('puts a refused password beside the password field', () => {
    expect(describeSignInFailure(answer(400, 'VALIDATION_ERROR'), 'reset')).toEqual(refusedPassword);
    expect(describeSignInFailure(answer(422, 'VALIDATION_ERROR'), 'reset')).toEqual(refusedPassword);
    expect(describeSignInFailure(answer(400, 'BAD_REQUEST'), 'reset')).toEqual(refusedPassword);
  });
});

describe('describeSignInFailure: what reads the same at every step', () => {
  it.each(contexts)('reports a server error as a banner with the reference to quote and a retry (%s)', (context) => {
    expect(describeSignInFailure(answer(500, 'INTERNAL_ERROR', { requestId: 'req-7F3K-2Q' }), context)).toEqual({ ...serverError, reference: 'req-7F3K-2Q' });
    expect(describeSignInFailure(answer(502, 'BAD_GATEWAY'), context)).toEqual(serverError);
  });

  it('shows a reference only when it is an id, never free text or the backend’s placeholder', () => {
    expect(describeSignInFailure(answer(500, 'INTERNAL_ERROR', { requestId: 'unknown' }), 'other')).toEqual(serverError);
    expect(describeSignInFailure(answer(500, 'INTERNAL_ERROR', { requestId: '<b>not an id</b>' }), 'other')).toEqual(serverError);
  });

  it.each(contexts)('shows the service being down as the maintenance screen (%s)', (context) => {
    expect(describeSignInFailure(answer(503, 'SERVICE_UNAVAILABLE'), context)).toEqual({ place: 'screen', screen: 'maintenance' });
    expect(describeSignInFailure(answer(503, 'UNKNOWN_ERROR'), context)).toEqual({ place: 'screen', screen: 'maintenance' });
  });

  it.each(contexts)('tells the person being offline from the service not answering (%s)', (context) => {
    const online = vi.spyOn(navigator, 'onLine', 'get');
    const dropped = answer(0, 'NETWORK_ERROR');

    online.mockReturnValue(false);
    expect(describeSignInFailure(dropped, context)).toEqual({ place: 'banner', tone: 'offline', title: fm.offlineTitle, text: fm.offlineText, next: 'retry' });

    online.mockReturnValue(true);
    expect(describeSignInFailure(dropped, context)).toEqual({ place: 'screen', screen: 'unreachable' });
  });

  it('counts down a rate limit away from sign-in itself, as a warning', () => {
    const limited = { place: 'banner', tone: 'warning', title: fm.tooManyTitle, text: fm.tooManyText };
    for (const context of ['code', 'reset', 'other'] as const) expect(describeSignInFailure(answer(429, 'BAD_REQUEST'), context)).toEqual(limited);
    expect(describeSignInFailure(answer(429, 'TOO_MANY_REQUESTS', { retryAfter: 30 }), 'other')).toMatchObject({ ...limited, retryAt: expect.any(Number) });
  });

  it.each(contexts)('ends the session as a whole screen (%s)', (context) => {
    expect(describeSignInFailure(answer(401, 'SESSION_EXPIRED'), context)).toEqual({ place: 'screen', screen: 'session-ended' });
    expect(describeSignInFailure(answer(401, 'TOKEN_REUSE_DETECTED'), context)).toEqual({ place: 'screen', screen: 'signed-out-everywhere' });
  });

  it('falls back to the server-error banner for anything it has no row for', () => {
    expect(describeSignInFailure(answer(403, 'FORBIDDEN'), 'other')).toEqual(serverError);
    expect(describeSignInFailure(answer(409, 'SOMETHING_NEW'), 'password')).toEqual(serverError);
    expect(describeSignInFailure(new Error(SERVER_WORDS), 'other')).toEqual(serverError);
    expect(describeSignInFailure(answer(403, 'EMAIL_NOT_VERIFIED'), 'other')).toEqual(serverError);
  });
});

describe('what the server wrote', () => {
  const answers = [
    answer(400, 'BAD_REQUEST'), answer(400, 'VALIDATION_ERROR'), answer(401, 'INVALID_CREDENTIALS'), answer(401, 'MFA_INVALID'), answer(401, 'INVALID_MFA_CODE'), answer(401, 'INVALID_TOKEN'), answer(401, 'SESSION_EXPIRED'),
    answer(401, 'TOKEN_REUSE_DETECTED'), answer(403, 'FORBIDDEN'), answer(403, 'EMAIL_NOT_VERIFIED'), answer(403, 'SSO_REQUIRED'), answer(403, 'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED'), answer(403, 'TENANT_SUSPENDED'),
    answer(404, 'USER_NOT_FOUND'), answer(409, 'SOMETHING_NEW'), answer(429, 'MFA_MAX_ATTEMPTS'), answer(429, 'TOKEN_MAX_ATTEMPTS'), answer(429, 'BAD_REQUEST', { retryAfter: 60 }), answer(500, 'INTERNAL_ERROR', { requestId: 'req-1' }),
    answer(503, 'SERVICE_UNAVAILABLE'), answer(0, 'NETWORK_ERROR'), new Error(SERVER_WORDS),
  ]; // prettier-ignore

  it('is never passed on, at any step, for any answer', () => {
    for (const context of contexts) for (const error of answers) expect(JSON.stringify(describeSignInFailure(error, context))).not.toContain(SERVER_WORDS);
  });

  it('is never a code either', () => {
    for (const context of contexts) for (const error of answers) expect(JSON.stringify(describeSignInFailure(error, context))).not.toMatch(/[A-Z]{3,}_[A-Z_]+/);
  });
});

describe('rejectedResetCode', () => {
  it('tells a wrong or expired code from one that can never work again, and from everything else', () => {
    expect(rejectedResetCode(answer(401, 'INVALID_TOKEN'))).toBe('wrong');
    expect(rejectedResetCode(answer(429, 'TOKEN_MAX_ATTEMPTS'))).toBe('spent');
    expect(rejectedResetCode(answer(400, 'VALIDATION_ERROR'))).toBeNull();
    expect(rejectedResetCode(answer(0, 'NETWORK_ERROR'))).toBeNull();
    expect(rejectedResetCode(new Error('INVALID_TOKEN'))).toBeNull();
  });
});

describe('carried', () => {
  it('explains each reason a person is sent back to a step', () => {
    expect(carried['challenge-expired']).toEqual({ place: 'banner', tone: 'warning', title: m.challengeExpiredTitle, text: m.challengeExpired });
    expect(carried['reset-done']).toEqual({ place: 'banner', tone: 'warning', title: m.resetDoneTitle, text: m.resetDoneSignInFailed });
    expect(carried.wrong).toEqual({ place: 'field', field: 'code', text: m.recoverCodeRejected });
    expect(carried.spent).toEqual({ place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyResetCodes, next: 'resend' });
  });
});
