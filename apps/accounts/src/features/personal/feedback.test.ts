import { ApiError } from '@yahel/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowMessages as shared } from '../../flow/messages';
import { describePersonalFailure, hasCode, isRefusal, refusals } from './feedback';
import type { FailureContext } from './feedback';
import { personalMessages as m } from './messages';

const SERVER_WORDS = 'An account with this email already exists (stack: auth.service.ts:63)';
const answer = (status: number, code: string, extra: { requestId?: string; retryAfter?: number } = {}) => new ApiError({ status, code, message: SERVER_WORDS, ...extra });
const noAnswer = () => answer(0, 'NETWORK_ERROR');
const contexts: FailureContext[] = ['create', 'code', 'passkey', 'other'];

const serverError = { place: 'banner', tone: 'danger', title: shared.serverErrorTitle, text: shared.serverErrorText, next: 'retry' };
const wrongCode = { place: 'field', field: 'code', text: m.wrongCode };
const detailsRefused = { place: 'banner', tone: 'danger', title: m.detailsRefusedTitle, text: m.detailsRefused, next: 'review' };

afterEach(() => void vi.restoreAllMocks());

describe('describePersonalFailure: the connection and the server, the same at every step', () => {
  it.each(contexts)('shows the offline banner when the device has no connection (%s)', (context) => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    expect(describePersonalFailure(noAnswer(), context)).toEqual({ place: 'banner', tone: 'offline', title: shared.offlineTitle, text: shared.offlineText, next: 'retry' });
  });

  it.each(contexts)('keeps the step, with a banner and Try again, when nothing answers while the device is online (%s)', (context) => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    expect(describePersonalFailure(noAnswer(), context)).toEqual({ place: 'banner', tone: 'offline', title: shared.unreachableTitle, text: shared.unreachableText, next: 'retry' });
  });

  it.each(contexts)('shows the maintenance screen for a 503 (%s)', (context) => {
    expect(describePersonalFailure(answer(503, 'SERVICE_UNAVAILABLE'), context)).toEqual({ place: 'screen', screen: 'maintenance' });
    expect(describePersonalFailure(answer(503, 'BAD_GATEWAY', { retryAfter: 600 }), context)).toMatchObject({ place: 'screen', screen: 'maintenance', retryAt: expect.any(Number) });
  });

  it.each(contexts)('shows a server error as a banner with the reference to quote (%s)', (context) => {
    expect(describePersonalFailure(answer(500, 'INTERNAL_ERROR', { requestId: 'Y-7F3K-2Q' }), context)).toEqual({ ...serverError, reference: 'Y-7F3K-2Q' });
    expect(describePersonalFailure(answer(500, 'INTERNAL_ERROR'), context)).toEqual(serverError);
    expect(describePersonalFailure(answer(502, 'SOMETHING_NEW'), context)).toEqual(serverError);
  });

  it('quotes a reference only when it is an id, never the server’s placeholder or anything else', () => {
    expect(describePersonalFailure(answer(500, 'INTERNAL_ERROR', { requestId: 'unknown' }), 'other')).toEqual(serverError);
    expect(describePersonalFailure(answer(500, 'INTERNAL_ERROR', { requestId: '<b>x</b> see http://evil.example' }), 'other')).toEqual(serverError);
  });

  it.each(contexts)('says there were too many tries, and until when if the server says (%s)', (context) => {
    const tooMany = { place: 'banner', tone: 'warning', title: shared.tooManyTitle, text: shared.tooManyText };
    // The backend's rate limiter answers 429 under a general code.
    expect(describePersonalFailure(answer(429, 'BAD_REQUEST'), context)).toEqual(tooMany);
    expect(describePersonalFailure(answer(429, 'TOO_MANY_REQUESTS'), context)).toEqual(tooMany);

    const before = Date.now();
    const timed = describePersonalFailure(answer(429, 'TOO_MANY_REQUESTS', { retryAfter: 24 }), context);
    expect(timed).toMatchObject(tooMany);
    expect(timed).toHaveProperty('retryAt');
    const { retryAt } = timed as { retryAt: number };
    expect(retryAt).toBeGreaterThanOrEqual(before + 24_000);
    expect(retryAt).toBeLessThanOrEqual(Date.now() + 24_000);
  });

  it.each(contexts)('sends someone whose session ended, or was ended for them, to the whole screen that says so (%s)', (context) => {
    expect(describePersonalFailure(answer(401, 'SESSION_EXPIRED'), context)).toEqual({ place: 'screen', screen: 'session-ended' });
    expect(describePersonalFailure(answer(401, 'TOKEN_REUSE_DETECTED'), context)).toEqual({ place: 'screen', screen: 'signed-out-everywhere' });
  });

  it.each(contexts)('knows the states only a whole screen can tell (%s)', (context) => {
    expect(describePersonalFailure(answer(403, 'ACCOUNT_SUSPENDED'), context)).not.toMatchObject({ place: 'screen' });
    expect(describePersonalFailure(answer(403, 'TENANT_SUSPENDED'), context)).not.toMatchObject({ place: 'screen' });
    expect(describePersonalFailure(answer(410, 'INVITE_EXPIRED'), context)).toEqual({ place: 'screen', screen: 'link-expired' });
    expect(describePersonalFailure(answer(409, 'INVITE_ALREADY_USED'), context)).toEqual({ place: 'screen', screen: 'link-used' });
    expect(describePersonalFailure(answer(409, 'INVITE_ALREADY_ACCEPTED'), context)).toEqual({ place: 'screen', screen: 'link-used' });
  });
});

describe('describePersonalFailure: creating the account', () => {
  it('says the details were refused, with the way back to the review', () => {
    expect(describePersonalFailure(answer(422, 'VALIDATION_ERROR'), 'create')).toEqual(detailsRefused);
    expect(describePersonalFailure(answer(400, 'VALIDATION_ERROR'), 'create')).toEqual(detailsRefused);
    expect(describePersonalFailure(answer(400, 'BAD_REQUEST'), 'create')).toEqual(detailsRefused);
    expect(describePersonalFailure(answer(422, 'SOMETHING_NEW'), 'create')).toEqual(detailsRefused);
  });

  it('treats anything it has no row for as a fault on our side', () => {
    expect(describePersonalFailure(answer(403, 'FORBIDDEN'), 'create')).toEqual(serverError);
    expect(describePersonalFailure(new Error('boom'), 'create')).toEqual(serverError);
  });
});

describe('describePersonalFailure: the emailed and texted codes', () => {
  it.each([
    [401, 'INVALID_TOKEN'],
    [400, 'BAD_REQUEST'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'USER_NOT_FOUND'],
  ])('puts a code that did not work beside the code (%i %s)', (status, code) => {
    expect(describePersonalFailure(answer(status, code), 'code')).toEqual(wrongCode);
  });

  it('says a code that was tried too often no longer works, and offers a new one', () => {
    expect(describePersonalFailure(answer(429, 'TOKEN_MAX_ATTEMPTS'), 'code')).toEqual({ place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyCodes, next: 'resend' });
  });

  it('keeps a wrong code apart from the same answers at other steps', () => {
    expect(describePersonalFailure(answer(401, 'INVALID_TOKEN'), 'other')).toEqual(serverError);
    expect(describePersonalFailure(answer(403, 'FORBIDDEN'), 'other')).toEqual(serverError);
  });
});

describe('describePersonalFailure: the passkey and everything else', () => {
  it('says a device that could not make a passkey can carry on with the password', () => {
    expect(describePersonalFailure(new DOMException('x', 'InvalidStateError'), 'passkey')).toEqual({ place: 'banner', tone: 'warning', text: m.passkeyFailed });
    expect(describePersonalFailure(answer(500, 'INTERNAL_ERROR'), 'passkey')).toEqual(serverError);
  });

  it('is vague on purpose about a phone number that cannot be used', () => {
    expect(describePersonalFailure(answer(409, 'PHONE_ALREADY_IN_USE'), 'other')).toEqual({ place: 'banner', tone: 'warning', text: m.phoneRefused });
    expect(m.phoneRefused).not.toMatch(/another account|already|in use/i);
  });

  it('treats a failure that is not the server’s as a fault on our side', () => {
    expect(describePersonalFailure(new Error('Trusted contacts are not offered'), 'other')).toEqual(serverError);
  });
});

describe('what the feedback never gives away', () => {
  const everyAnswer = [
    answer(409, 'EMAIL_ALREADY_EXISTS'),
    answer(409, 'DUPLICATE_RECORD'),
    answer(404, 'USER_NOT_FOUND'),
    answer(401, 'INVALID_CREDENTIALS'),
    answer(403, 'EMAIL_NOT_VERIFIED'),
    answer(409, 'PHONE_ALREADY_IN_USE'),
    answer(422, 'VALIDATION_ERROR'),
    answer(500, 'INTERNAL_ERROR', { requestId: 'req-1' }),
    answer(429, 'TOKEN_MAX_ATTEMPTS'),
    noAnswer(),
    new Error(SERVER_WORDS),
  ];
  const wordsOf = (feedback: object) => JSON.stringify(feedback);

  it.each(contexts)('never says whether an address has an account (%s)', (context) => {
    for (const code of ['EMAIL_ALREADY_EXISTS', 'DUPLICATE_RECORD']) {
      const words = wordsOf(describePersonalFailure(answer(409, code), context));
      expect(words).not.toMatch(/already (has|have|exists?)|account (exists|already)|is taken|registered|sign in/i);
    }
  });

  it.each(contexts)('never passes on what the server wrote, or its code (%s)', (context) => {
    for (const failure of everyAnswer) {
      const words = wordsOf(describePersonalFailure(failure, context));
      expect(words).not.toContain('already exists');
      expect(words).not.toContain('auth.service');
      expect(words).not.toMatch(/[A-Z]{4,}_[A-Z_]+/);
    }
  });
});

describe('refusals carried to a step', () => {
  it('belong beside the field that holds the answer', () => {
    expect(refusals.underage).toEqual({ place: 'field', field: 'year', text: m.tooYoungForAccount });
    expect(refusals['not-personal']).toEqual({ place: 'field', field: 'email', text: m.ownEmailNotPersonal });
  });
});

describe('hasCode', () => {
  it('is true for any of the codes named, and only for an answer from the server', () => {
    expect(hasCode(answer(409, 'EMAIL_ALREADY_EXISTS'), 'EMAIL_ALREADY_EXISTS')).toBe(true);
    expect(hasCode(answer(409, 'DUPLICATE_RECORD'), 'EMAIL_ALREADY_EXISTS', 'DUPLICATE_RECORD')).toBe(true);
    expect(hasCode(answer(409, 'PHONE_ALREADY_IN_USE'), 'EMAIL_ALREADY_EXISTS', 'DUPLICATE_RECORD')).toBe(false);
    expect(hasCode(answer(409, 'EMAIL_ALREADY_EXISTS'))).toBe(false);
    expect(hasCode(new Error('EMAIL_ALREADY_EXISTS'), 'EMAIL_ALREADY_EXISTS')).toBe(false);
    expect(hasCode({ code: 'EMAIL_ALREADY_EXISTS' }, 'EMAIL_ALREADY_EXISTS')).toBe(false);
  });
});

describe('isRefusal', () => {
  it.each([
    [400, 'BAD_REQUEST'],
    [401, 'INVALID_TOKEN'],
    [403, 'FORBIDDEN'],
    [409, 'PHONE_ALREADY_IN_USE'],
    [422, 'VALIDATION_ERROR'],
  ])('is an answer the server will repeat however often it is asked (%i %s)', (status, code) => {
    expect(isRefusal(answer(status, code))).toBe(true);
  });

  it.each([
    [429, 'TOO_MANY_REQUESTS'],
    [429, 'BAD_REQUEST'],
    [401, 'SESSION_EXPIRED'],
    [401, 'TOKEN_REUSE_DETECTED'],
    [500, 'INTERNAL_ERROR'],
    [503, 'SERVICE_UNAVAILABLE'],
    [0, 'NETWORK_ERROR'],
  ])('is not a wait, an ended session, a fault or a dropped connection (%i %s)', (status, code) => {
    expect(isRefusal(answer(status, code))).toBe(false);
  });

  it('is not a failure of the device', () => {
    expect(isRefusal(new Error('x'))).toBe(false);
  });
});
