import { ApiError } from '@yahel/api-client';
import { describe, expect, it } from 'vitest';
import { describeFailure, hasCode, isRefusal } from './failure';
import { personalMessages as m } from './messages';

const api = (status: number, code = 'X') => new ApiError({ status, code, message: 'server text that must never be shown' });

describe('describeFailure', () => {
  it('says the connection dropped, whatever was being done', () => {
    expect(describeFailure(api(0, 'NETWORK_ERROR'), 'create')).toBe(m.offline);
  });

  it.each([
    [api(429), 'create', m.tooManyAttempts],
    [api(401, 'INVALID_TOKEN'), 'code', m.wrongCode],
    [api(403, 'FORBIDDEN'), 'code', m.wrongCode],
    [api(429, 'TOKEN_MAX_ATTEMPTS'), 'code', m.tooManyCodes],
    [api(409, 'PHONE_ALREADY_IN_USE'), 'other', m.phoneRefused],
    [api(422, 'VALIDATION_ERROR'), 'create', m.detailsRefused],
    [api(400, 'BAD_REQUEST'), 'create', m.detailsRefused],
    [api(500), 'create', m.unexpected],
    [api(401, 'INVALID_TOKEN'), 'other', m.unexpected],
  ] as const)('%o while doing "%s"', (error, context, message) => {
    expect(describeFailure(error, context)).toBe(message);
  });

  it('never says an address has an account, and never repeats the server', () => {
    for (const context of ['create', 'code', 'passkey', 'other'] as const) {
      const said = describeFailure(api(409, 'EMAIL_ALREADY_EXISTS'), context);
      expect(said).toBe(m.unexpected);
      expect(said).not.toContain('server text');
    }
  });

  it('blames the device for a passkey that could not be made, and nothing in particular otherwise', () => {
    expect(describeFailure(new DOMException('x', 'InvalidStateError'), 'passkey')).toBe(m.passkeyFailed);
    expect(describeFailure(new Error('x'), 'other')).toBe(m.unexpected);
  });
});

describe('hasCode and isRefusal', () => {
  it('recognises a backend code', () => {
    expect(hasCode(api(403, 'USER_UNDERAGE'), 'USER_UNDERAGE')).toBe(true);
    expect(hasCode(new Error('USER_UNDERAGE'), 'USER_UNDERAGE')).toBe(false);
  });

  it('tells a refusal that will be repeated from a failure worth trying again', () => {
    expect([400, 403, 409, 422].map((status) => isRefusal(api(status)))).toEqual([true, true, true, true]);
    expect([0, 429, 500, 503].map((status) => isRefusal(api(status)))).toEqual([false, false, false, false]);
    expect(isRefusal(new Error('x'))).toBe(false);
  });
});
