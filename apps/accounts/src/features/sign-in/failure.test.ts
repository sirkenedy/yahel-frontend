import { ApiError } from '@yahel/api-client';
import { describe, expect, it } from 'vitest';
import { describeFailure, isRejectedResetCode } from './failure';
import { signInMessages as m } from './messages';

const failure = (status: number, code = 'X') => new ApiError({ status, code, message: 'server detail that must never be shown' });

describe('describeFailure', () => {
  it('reads the same for a wrong password, an unknown address and a malformed request', () => {
    for (const error of [failure(401, 'INVALID_CREDENTIALS'), failure(404, 'USER_NOT_FOUND'), failure(400, 'VALIDATION_ERROR')]) {
      expect(describeFailure(error, 'password')).toBe(m.wrongCredentials);
    }
  });

  it.each([
    [failure(0, 'NETWORK_ERROR'), 'password', m.offline],
    [failure(429, 'TOO_MANY_REQUESTS'), 'password', m.tooManyAttempts],
    [failure(403, 'EMAIL_NOT_VERIFIED'), 'password', m.emailNotConfirmed],
    [failure(403, 'FORBIDDEN'), 'password', m.cannotSignIn],
    [failure(403, 'SSO_REQUIRED'), 'password', m.singleSignOnRequired],
    [failure(401, 'MFA_INVALID'), 'code', m.wrongCode],
    [failure(429, 'MFA_MAX_ATTEMPTS'), 'code', m.tooManyCodes],
    [failure(401, 'INVALID_TOKEN'), 'reset', m.recoverCodeRejected],
    [failure(429, 'TOKEN_MAX_ATTEMPTS'), 'reset', m.tooManyResetCodes],
    [failure(400, 'VALIDATION_ERROR'), 'reset', m.passwordRefused],
    [failure(401, 'INVALID_CREDENTIALS'), 'other', m.unexpected],
    [failure(500, 'INTERNAL_ERROR'), 'password', m.unexpected],
    [new Error('boom'), 'password', m.unexpected],
    [new DOMException('broken', 'UnknownError'), 'passkey', m.passkeyFailed],
    [failure(401, 'INVALID_CREDENTIALS'), 'passkey', m.passkeyFailed],
    [failure(0, 'NETWORK_ERROR'), 'passkey', m.offline],
  ] as const)('explains %o while doing "%s"', (error, context, expected) => {
    expect(describeFailure(error, context)).toBe(expected);
  });

  it('never repeats what the server said', () => {
    for (const status of [0, 400, 401, 403, 404, 429, 500]) expect(describeFailure(failure(status), 'password')).not.toContain('server detail');
  });
});

describe('isRejectedResetCode', () => {
  it('tells a bad code from a bad password', () => {
    expect(isRejectedResetCode(failure(401, 'INVALID_TOKEN'))).toBe(true);
    expect(isRejectedResetCode(failure(429, 'TOKEN_MAX_ATTEMPTS'))).toBe(true);
    expect(isRejectedResetCode(failure(400, 'VALIDATION_ERROR'))).toBe(false);
    expect(isRejectedResetCode(new Error('boom'))).toBe(false);
  });
});
