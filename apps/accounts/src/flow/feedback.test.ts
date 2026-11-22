import { ApiError } from '@yahel/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerOf, commonRows, describeFailure, forField } from './feedback';
import type { Answer, Feedback, FeedbackMap } from './feedback';
import { flowMessages as m } from './messages';

const SERVER_WORDS = 'ThrottlerException: stack at auth.service.ts:311';
const failure = (status: number, code: string, more: { requestId?: string; retryAfter?: number } = {}) => new ApiError({ status, code, message: SERVER_WORDS, ...more });
const network = new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Network request failed' });

afterEach(() => vi.restoreAllMocks());

describe('answerOf', () => {
  it('calls anything that is not an answer from the API a fault of this device', () => {
    expect(answerOf(new Error('NotAllowedError'))).toBe('CLIENT_FAULT');
    expect(answerOf('nothing')).toBe('CLIENT_FAULT');
  });

  it('separates the person being offline from the service not answering, by what the browser says', () => {
    expect(answerOf(network, false)).toBe('OFFLINE');
    expect(answerOf(network, true)).toBe('UNREACHABLE');

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(answerOf(network)).toBe('OFFLINE');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    expect(answerOf(network)).toBe('UNREACHABLE');
  });

  it.each([
    ['INTERNAL_ERROR', 500],
    ['SERVICE_UNAVAILABLE', 503],
    ['TOO_MANY_REQUESTS', 429],
    ['INVALID_CREDENTIALS', 401],
    ['EMAIL_NOT_VERIFIED', 403],
    ['MFA_INVALID', 401],
    ['INVALID_MFA_CODE', 401],
    ['MFA_MAX_ATTEMPTS', 429],
    ['TOKEN_MAX_ATTEMPTS', 429],
    ['FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED', 403],
    ['SSO_REQUIRED', 403],
    ['ACCOUNT_SUSPENDED', 403],
    ['TENANT_SUSPENDED', 403],
    ['SESSION_EXPIRED', 401],
    ['INVALID_TOKEN', 401],
    ['TOKEN_REUSE_DETECTED', 401],
    ['VALIDATION_ERROR', 422],
    ['DUPLICATE_RECORD', 409],
    ['EMAIL_ALREADY_EXISTS', 409],
    ['PERSONAL_SIGNUP_REQUIRES_PUBLIC_EMAIL', 400],
    ['USER_UNDERAGE', 403],
    ['PHONE_ALREADY_IN_USE', 409],
    ['PUBLIC_EMAIL_NOT_ALLOWED', 400],
    ['DOMAIN_CONFLICT', 409],
    ['DOMAIN_ALREADY_CLAIMED', 409],
    ['ALREADY_IN_ORG_CONTEXT', 409],
    ['INVITE_EXPIRED', 410],
    ['INVITE_ALREADY_USED', 409],
    ['INVITE_ALREADY_ACCEPTED', 409],
  ] as const)('knows the backend’s %s by its own name', (code, status) => {
    expect(answerOf(failure(status, code))).toBe(code);
  });

  it('names the rate limiter’s 429 by its status, because it arrives under a general code', () => {
    expect(answerOf(failure(429, 'BAD_REQUEST'))).toBe('TOO_MANY_REQUESTS');
  });

  it.each<[number, string, Answer]>([
    [503, 'UNKNOWN_ERROR', 'SERVICE_UNAVAILABLE'],
    [500, 'INTERNAL_SERVER_ERROR', 'INTERNAL_ERROR'],
    [502, 'UNKNOWN_ERROR', 'INTERNAL_ERROR'],
    [504, 'UNKNOWN_ERROR', 'INTERNAL_ERROR'],
    [403, 'FORBIDDEN', 'FORBIDDEN'],
    [422, 'UNPROCESSABLE', 'VALIDATION_ERROR'],
    [400, 'BAD_REQUEST', 'REFUSED'],
    [401, 'UNKNOWN_ERROR', 'REFUSED'],
    [404, 'USER_NOT_FOUND', 'REFUSED'],
    [409, 'PASSWORD_ALREADY_SET', 'UNKNOWN'],
    [402, 'SEAT_LIMIT_REACHED', 'UNKNOWN'],
    [418, 'UNKNOWN_ERROR', 'UNKNOWN'],
  ])('names a %i under the code %s as %s', (status, code, answer) => {
    expect(answerOf(failure(status, code))).toBe(answer);
  });
});

describe('describeFailure with the rows every flow shares', () => {
  const NOW = Date.parse('2026-11-22T13:07:00.000Z');
  const told = (error: unknown) => describeFailure(error, commonRows, NOW);
  const serverError = { place: 'banner', tone: 'danger', title: m.serverErrorTitle, text: m.serverErrorText, next: 'retry' };

  it('tells a device with no connection in the offline banner, with Try again', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    expect(told(network)).toEqual({ place: 'banner', tone: 'offline', title: m.offlineTitle, text: m.offlineText, next: 'retry' });
  });

  it('tells a request that got no answer while the device is online in a banner on the step, with Try again', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    expect(told(network)).toEqual({ place: 'banner', tone: 'offline', title: m.unreachableTitle, text: m.unreachableText, next: 'retry' });
  });

  it('tells a server error, an unknown code and a fault of the device in the error banner, with Try again', () => {
    expect(told(failure(500, 'INTERNAL_ERROR'))).toEqual(serverError);
    expect(told(failure(418, 'TEAPOT'))).toEqual(serverError);
    expect(told(new Error('boom'))).toEqual(serverError);
  });

  it('shows the maintenance screen for a 503', () => {
    expect(told(failure(503, 'SERVICE_UNAVAILABLE'))).toEqual({ place: 'screen', screen: 'maintenance' });
  });

  it('does not know an account’s or an organisation’s standing: a signed-out request never shows it', () => {
    expect(told(failure(403, 'ACCOUNT_SUSPENDED'))).toEqual(serverError);
    expect(told(failure(403, 'TENANT_SUSPENDED'))).toEqual(serverError);
  });

  it('tells too many requests in a warning banner, with when to try again if the server says', () => {
    expect(told(failure(429, 'TOO_MANY_REQUESTS'))).toEqual({ place: 'banner', tone: 'warning', title: m.tooManyTitle, text: m.tooManyText });
    expect(told(failure(429, 'BAD_REQUEST', { retryAfter: 24 }))).toEqual({ place: 'banner', tone: 'warning', title: m.tooManyTitle, text: m.tooManyText, retryAt: NOW + 24_000 });
  });

  it.each([
    ['SESSION_EXPIRED', 401, 'session-ended'],
    ['TOKEN_REUSE_DETECTED', 401, 'signed-out-everywhere'],
    ['INVITE_EXPIRED', 410, 'link-expired'],
    ['INVITE_ALREADY_USED', 409, 'link-used'],
    ['INVITE_ALREADY_ACCEPTED', 409, 'link-used'],
  ] as const)('shows a whole screen for %s', (code, status, screen) => {
    expect(told(failure(status, code))).toEqual({ place: 'screen', screen });
  });

  it('falls back to the error banner for an answer the rows do not name', () => {
    expect(told(failure(401, 'INVALID_CREDENTIALS'))).toEqual(serverError);
    expect(told(failure(403, 'FORBIDDEN'))).toEqual(serverError);
    expect(told(failure(422, 'VALIDATION_ERROR'))).toEqual(serverError);
    expect(told(failure(409, 'EMAIL_ALREADY_EXISTS'))).toEqual(serverError);
  });

  it('quotes the request id on error banners and screens only, and only when it is plainly an id', () => {
    expect(told(failure(500, 'INTERNAL_ERROR', { requestId: 'Y-7F3K-2Q' }))).toEqual({ ...serverError, reference: 'Y-7F3K-2Q' });
    expect(told(failure(503, 'SERVICE_UNAVAILABLE', { requestId: 'req_9f2c' }))).toEqual({ place: 'screen', screen: 'maintenance', reference: 'req_9f2c' });
    expect(told(failure(429, 'TOO_MANY_REQUESTS', { requestId: 'Y-7F3K-2Q' }))).not.toHaveProperty('reference');
    for (const requestId of ['unknown', '<img src=x onerror=alert(1)>', 'has spaces', 'ab', 'x'.repeat(65)]) expect(told(failure(500, 'INTERNAL_ERROR', { requestId }))).toEqual(serverError);
  });

  it('carries how long to wait onto a screen', () => {
    expect(told(failure(503, 'SERVICE_UNAVAILABLE', { retryAfter: 3600 }))).toEqual({ place: 'screen', screen: 'maintenance', retryAt: NOW + 3_600_000 });
  });

  it('never passes on what the server wrote', () => {
    const everything = [network, new Error(SERVER_WORDS), ...[400, 401, 403, 404, 409, 410, 422, 429, 500, 503].flatMap((status) => ['UNKNOWN_ERROR', 'INTERNAL_ERROR', 'SESSION_EXPIRED', 'INVITE_EXPIRED'].map((code) => failure(status, code, { requestId: 'Y-7F3K-2Q' })))];

    for (const error of everything) expect(JSON.stringify(told(error))).not.toMatch(/Throttler|auth\.service|stack|Network request failed/);
  });
});

describe('describeFailure with a flow’s own rows', () => {
  const rows: FeedbackMap<'password', 'retry' | 'reset-password'> = {
    ...commonRows,
    INVALID_CREDENTIALS: { place: 'field', field: 'password', text: 'That email and password don’t match.', next: 'reset-password' },
    TOO_MANY_REQUESTS: { place: 'screen', screen: 'locked' },
  };

  it('uses the flow’s row in place of the shared one, and adds nothing to a field message', () => {
    const wrong = describeFailure(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: SERVER_WORDS, requestId: 'Y-7F3K-2Q', retryAfter: 5 }), rows);

    expect(wrong).toEqual({ place: 'field', field: 'password', text: 'That email and password don’t match.', next: 'reset-password' });
    expect(wrong).not.toBe(rows.INVALID_CREDENTIALS);
    expect(describeFailure(failure(429, 'BAD_REQUEST'), rows)).toEqual({ place: 'screen', screen: 'locked' });
  });

  it('describes each failure afresh, so two with the same words can be told apart', () => {
    const error = failure(401, 'INVALID_CREDENTIALS');

    expect(describeFailure(error, rows)).not.toBe(describeFailure(error, rows));
  });

  it('counts the wait from now when no time is given', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);

    expect(describeFailure(failure(429, 'BAD_REQUEST', { retryAfter: 30 }), rows)).toEqual({ place: 'screen', screen: 'locked', retryAt: 1_030_000 });
  });
});

describe('forField', () => {
  const beside: Feedback<'password' | 'code'> = { place: 'field', field: 'password', text: 'Wrong.' };

  it('gives the feedback itself when it belongs beside the named field, and nothing otherwise', () => {
    expect(forField(beside, 'password')).toBe(beside);
    expect(forField(beside, 'code')).toBeNull();
    expect(forField({ place: 'banner', tone: 'danger', text: 'x' }, 'password')).toBeNull();
    expect(forField({ place: 'screen', screen: 'locked' }, 'password')).toBeNull();
    expect(forField(null, 'password')).toBeNull();
    expect(forField(undefined, 'password')).toBeNull();
  });
});
