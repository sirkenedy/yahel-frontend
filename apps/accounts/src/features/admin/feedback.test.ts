import { ApiError } from '@yahel/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowMessages as fm } from '../../flow/messages';
import { carried, describeAdminFailure } from './feedback';
import type { FailureContext } from './feedback';
import { adminMessages as m } from './messages';

const answer = (status: number, code: string, more: { requestId?: string; retryAfter?: number } = {}) => new ApiError({ status, code, message: 'SERVER WORDS that must never be shown', ...more });
const contexts: FailureContext[] = ['password', 'code', 'phone', 'passkey', 'other'];
const serverError = { place: 'banner', tone: 'danger', title: fm.serverErrorTitle, text: fm.serverErrorText, next: 'retry' };

afterEach(() => vi.restoreAllMocks());

describe('describeAdminFailure', () => {
  it.each(contexts)('tells the connection and the server the way every flow does (%s)', (context) => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    expect(describeAdminFailure(answer(0, 'NETWORK_ERROR'), context)).toEqual({ place: 'banner', tone: 'offline', title: fm.unreachableTitle, text: fm.unreachableText, next: 'retry' });
    expect(describeAdminFailure(answer(500, 'INTERNAL_ERROR', { requestId: 'req-7F3K' }), context)).toEqual({ ...serverError, reference: 'req-7F3K' });
    expect(describeAdminFailure(answer(503, 'SERVICE_UNAVAILABLE'), context)).toEqual({ place: 'screen', screen: 'maintenance' });
    expect(describeAdminFailure(answer(401, 'SESSION_EXPIRED'), context)).toEqual({ place: 'screen', screen: 'session-ended' });
  });

  it('a wrong password reads like an unknown address, beside the password', () => {
    for (const failure of [answer(401, 'INVALID_CREDENTIALS'), answer(401, 'UNAUTHORIZED')]) expect(describeAdminFailure(failure, 'password')).toEqual({ place: 'field', field: 'password', text: fm.wrongCredentials });
  });

  it('tells what sign-in tells once the password has matched, and only there', () => {
    expect(describeAdminFailure(answer(429, 'BAD_REQUEST'), 'password')).toEqual({ place: 'screen', screen: 'locked' });
    expect(describeAdminFailure(answer(403, 'TENANT_SUSPENDED'), 'password')).toEqual({ place: 'screen', screen: 'org-paused' });
    expect(describeAdminFailure(answer(403, 'FORBIDDEN'), 'password')).toMatchObject({ place: 'banner', title: fm.cannotSignInTitle, next: 'support' });
    expect(describeAdminFailure(answer(403, 'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED'), 'password')).toMatchObject({ place: 'banner', next: 'reset-password' });
    for (const context of contexts.filter((context) => context !== 'password')) expect(describeAdminFailure(answer(403, 'TENANT_SUSPENDED'), context)).not.toMatchObject({ place: 'screen' });
    expect(describeAdminFailure(answer(429, 'BAD_REQUEST'), 'phone')).toMatchObject({ place: 'banner', tone: 'warning', title: fm.tooManyTitle });
  });

  it('a wrong code and an expired one read alike beside the boxes; a spent one offers a new code', () => {
    for (const failure of [answer(401, 'INVALID_TOKEN'), answer(403, 'FORBIDDEN'), answer(400, 'BAD_REQUEST')]) expect(describeAdminFailure(failure, 'code')).toEqual({ place: 'field', field: 'code', text: fm.emailCodeRefused });
    expect(describeAdminFailure(answer(429, 'TOKEN_MAX_ATTEMPTS'), 'code')).toEqual({ place: 'banner', tone: 'danger', title: fm.codeDeadTitle, text: fm.tooManyEmailCodes, next: 'resend' });
  });

  it('a number the backend will not take is told beside it, without saying why', () => {
    for (const failure of [answer(409, 'PHONE_ALREADY_IN_USE'), answer(400, 'BAD_REQUEST'), answer(422, 'VALIDATION_ERROR')]) expect(describeAdminFailure(failure, 'phone')).toEqual({ place: 'field', field: 'phone', text: m.phoneRefused });
  });

  it('a passkey that could not be saved is a warning with another try', () => {
    expect(describeAdminFailure(new Error('boom'), 'passkey')).toEqual({ place: 'banner', tone: 'warning', text: m.passkeyFailed, next: 'retry' });
    expect(describeAdminFailure(answer(400, 'INVALID_TOKEN'), 'passkey')).toEqual({ place: 'banner', tone: 'warning', text: m.passkeyFailed, next: 'retry' });
  });

  it('passes on nothing the server wrote', () => {
    const answers = [answer(400, 'BAD_REQUEST'), answer(409, 'PHONE_ALREADY_IN_USE'), answer(403, 'DOMAIN_NOT_VERIFIED'), answer(500, 'INTERNAL_ERROR', { requestId: '<b>not an id</b>' }), new Error('SERVER WORDS')];
    for (const failure of answers) for (const context of contexts) expect(JSON.stringify(describeAdminFailure(failure, context))).not.toMatch(/SERVER WORDS|not an id/);
  });
});

describe('what the sign-in step is told when the person is brought back to it', () => {
  it('a confirmed address whose sign-in failed, and a second step this flow cannot take', () => {
    expect(carried['email-confirmed']).toMatchObject({ tone: 'success', title: fm.emailConfirmedTitle });
    expect(carried['second-step']).toMatchObject({ tone: 'info', title: m.secondStepTitle, next: 'sign-in' });
  });
});
