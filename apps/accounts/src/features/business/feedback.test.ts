import { ApiError } from '@yahel/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowMessages as fm } from '../../flow/messages';
import { Refused, describeBusinessFailure, domainClaimedBanner, refusalFor, refusals } from './feedback';
import type { FailureContext } from './feedback';
import { businessMessages as m } from './messages';

const answer = (status: number, code: string, more: { requestId?: string; retryAfter?: number } = {}) => new ApiError({ status, code, message: 'SERVER WORDS that must never be shown', ...more });
const contexts: FailureContext[] = ['create', 'other'];
const serverError = { place: 'banner', tone: 'danger', title: fm.serverErrorTitle, text: fm.serverErrorText, next: 'retry' };

afterEach(() => vi.restoreAllMocks());

describe('describeBusinessFailure', () => {
  it.each(contexts)('tells the connection and the server the way every flow does (%s)', (context) => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    expect(describeBusinessFailure(answer(0, 'NETWORK_ERROR'), context)).toEqual({ place: 'banner', tone: 'offline', title: fm.unreachableTitle, text: fm.unreachableText, next: 'retry' });
    expect(describeBusinessFailure(answer(500, 'INTERNAL_ERROR', { requestId: 'req-7F3K' }), context)).toEqual({ ...serverError, reference: 'req-7F3K' });
    expect(describeBusinessFailure(answer(503, 'SERVICE_UNAVAILABLE'), context)).toEqual({ place: 'screen', screen: 'maintenance' });
    expect(describeBusinessFailure(answer(429, 'BAD_REQUEST'), context)).toMatchObject({ place: 'banner', tone: 'warning', title: fm.tooManyTitle });
    expect(describeBusinessFailure(new Error('boom'), context)).toEqual(serverError);
  });

  it('sends a refused registration back to the answers', () => {
    const refused = { place: 'banner', tone: 'danger', title: m.detailsRefusedTitle, text: m.detailsRefused, next: 'answers' };
    expect(describeBusinessFailure(answer(422, 'VALIDATION_ERROR'), 'create')).toMatchObject(refused);
    expect(describeBusinessFailure(answer(400, 'BAD_REQUEST'), 'create')).toMatchObject(refused);
  });

  it('tells someone who already runs a workspace to sign in', () => {
    expect(describeBusinessFailure(answer(409, 'ALREADY_IN_ORG_CONTEXT'), 'create')).toEqual({ place: 'banner', tone: 'warning', title: m.alreadyRunTitle, text: m.alreadyRun, next: 'sign-in' });
  });

  it('never shows an account’s or an organisation’s standing: nobody is signed in here', () => {
    for (const code of ['ACCOUNT_SUSPENDED', 'TENANT_SUSPENDED']) for (const context of contexts) expect(describeBusinessFailure(answer(403, code), context)).not.toMatchObject({ place: 'screen' });
  });

  it('puts what the checkout refused where it belongs', () => {
    expect(describeBusinessFailure(new Refused('card-declined'), 'other')).toEqual({ place: 'banner', tone: 'danger', title: m.cardDeclinedTitle, text: m.cardDeclined });
    expect(describeBusinessFailure(new Refused('wrong-code'), 'other')).toEqual({ place: 'field', field: 'code', text: m.bankCodeWrong });
    expect(describeBusinessFailure(new Refused('expired-code'), 'other')).toEqual({ place: 'field', field: 'code', text: m.bankCodeExpired });
    expect(describeBusinessFailure(new Refused('code-spent'), 'other')).toEqual({ place: 'banner', tone: 'danger', title: m.bankCodeDeadTitle, text: m.bankCodeDead, next: 'resend' });
    expect(describeBusinessFailure(new Refused('promo-invalid'), 'other')).toEqual({ place: 'field', field: 'promo', text: m.promoInvalid });
  });

  it('passes on nothing the server wrote', () => {
    const answers = [answer(400, 'BAD_REQUEST'), answer(409, 'DOMAIN_CONFLICT'), answer(409, 'EMAIL_ALREADY_EXISTS'), answer(403, 'USER_UNDERAGE'), answer(500, 'INTERNAL_ERROR', { requestId: '<b>not an id</b>' }), new Error('SERVER WORDS')];
    for (const failure of answers) for (const context of contexts) expect(JSON.stringify(describeBusinessFailure(failure, context))).not.toMatch(/SERVER WORDS|not an id/);
  });
});

describe('a refusal', () => {
  it('carries a reason and nothing that was typed', () => {
    const refused = new Refused('card-declined');
    expect(refused).toBeInstanceOf(Error);
    expect(refused.message).toBe('card-declined');
    expect(Object.values(refused).sort()).toEqual(['Refused', 'card-declined']);
  });
});

describe('refusalFor', () => {
  it('tells a rejected answer beside its field, on its own step only', () => {
    expect(refusalFor({ step: 'domain', reason: 'claimed' }, 'domain')).toEqual(refusals.claimed);
    expect(refusalFor({ step: 'domain', reason: 'public' }, 'domain')).toEqual({ place: 'field', field: 'domain', text: m.domainPublic });
    expect(refusalFor({ step: 'admin', reason: 'taken' }, 'admin')).toEqual({ place: 'field', field: 'username', text: m.usernameTaken });
    expect(refusalFor({ step: 'admin', reason: 'taken' }, 'domain')).toBeNull();
    expect(refusalFor(null, 'domain')).toBeNull();
  });

  it('gives each rejection one object of its own, so the same refusal made twice is shown twice', () => {
    const first = { step: 'domain', reason: 'claimed' } as const;
    const second = { step: 'domain', reason: 'claimed' } as const;
    expect(refusalFor(first, 'domain')).toBe(refusalFor(first, 'domain'));
    expect(refusalFor(first, 'domain')).not.toBe(refusalFor(second, 'domain'));
  });

  it('never says whose the address or the domain is', () => {
    for (const told of [refusals.claimed, refusals.taken, domainClaimedBanner]) expect(JSON.stringify(told)).not.toMatch(/@|Northwind|Amara/);
    expect(domainClaimedBanner).toMatchObject({ next: 'reset-password', also: 'support' });
  });
});
