import { describe, expect, it } from 'vitest';
import { adminSteps, backOf, directionOf, initialAdminState, reduce, resumeStep, stepOfPath, stepPath } from './machine';
import type { AdminEvent, AdminFacts, Handover } from './machine';

const facts = (overrides: Partial<AdminFacts> = {}): AdminFacts => ({ signedIn: false, phoneVerified: false, hasPasskey: false, ...overrides });
const signedIn = (overrides: Partial<AdminFacts> = {}) => facts({ signedIn: true, ...overrides });
const after = (...events: AdminEvent[]) => events.reduce(reduce, initialAdminState);
const handover: Handover = { email: 'amara@harbourline.example', organisation: 'Harbourline Studio', challengeToken: 'pc-1', phone: { country: 'NG', number: '803 555 0142' }, continueToPlan: true };

describe('admin machine: what is remembered', () => {
  it('takes what workspace sign-up hands over: the address, the name, the phone check and a number to start from', () => {
    expect(after({ type: 'handed-over', handover })).toMatchObject({ email: handover.email, organisation: handover.organisation, challengeToken: 'pc-1', suggestedPhone: handover.phone, continueToPlan: true, handedOver: true });
  });

  it('takes a phone check sign-in answered with, starting afresh for that address', () => {
    const before = after({ type: 'handed-over', handover }, { type: 'welcomed' });

    expect(reduce(before, { type: 'phone-required', email: 'kayode@northwind.example', challengeToken: 'pc-2' })).toEqual({ ...initialAdminState, email: 'kayode@northwind.example', challengeToken: 'pc-2' });
  });

  it('keeps the number a code was texted to until it is confirmed, and spends the check when it is', () => {
    const sent = after({ type: 'handed-over', handover }, { type: 'phone-code-sent', country: 'NG', number: '803 555 0142' });
    expect(sent.phone).toEqual({ country: 'NG', number: '803 555 0142' });

    expect(reduce(sent, { type: 'phone-verified' })).toMatchObject({ phone: null, phoneVerified: true, challengeToken: null });
  });

  it('forgets a check that can no longer be met', () => {
    expect(after({ type: 'handed-over', handover }, { type: 'phone-code-sent', country: 'NG', number: '8035550142' }, { type: 'challenge-lost' })).toMatchObject({ challengeToken: null, phone: null });
  });

  it('records the welcome and the passkey', () => {
    expect(after({ type: 'welcomed' }, { type: 'passkey-started' }, { type: 'passkey-saved' })).toMatchObject({ welcomed: true, passkeyStarted: true, passkeySaved: true });
  });
});

describe('admin machine: which step can honestly be shown', () => {
  it('with no session and no phone check, nothing here: sign-in comes first', () => {
    for (const step of adminSteps) expect(resumeStep(step, initialAdminState, facts())).toBe('sign-in');
  });

  it('with a phone check and no session, only the phone, and its code once one was texted', () => {
    const waiting = after({ type: 'handed-over', handover });
    for (const step of adminSteps) expect(resumeStep(step, waiting, facts())).toBe('phone');
    expect(resumeStep('code', reduce(waiting, { type: 'phone-code-sent', country: 'NG', number: '8035550142' }), facts())).toBe('code');
  });

  it('signed in, the phone comes first, and its code only once one was texted', () => {
    expect(resumeStep('code', initialAdminState, signedIn())).toBe('phone');
    expect(resumeStep('code', after({ type: 'phone-code-sent', country: 'NG', number: '8035550142' }), signedIn())).toBe('code');
  });

  it('the welcome needs a confirmed phone, from this visit or from the server', () => {
    expect(resumeStep('welcome', initialAdminState, signedIn())).toBe('phone');
    expect(resumeStep('welcome', after({ type: 'phone-verified' }), signedIn())).toBe('welcome');
    expect(resumeStep('welcome', initialAdminState, signedIn({ phoneVerified: true }))).toBe('welcome');
    expect(resumeStep('phone', initialAdminState, signedIn({ phoneVerified: true }))).toBe('welcome');
  });

  it('nothing past the welcome can be reached around it, and the passkey prompt only once asked for', () => {
    const verified = after({ type: 'phone-verified' });
    expect(resumeStep('add-passkey', verified, signedIn())).toBe('welcome');

    const welcomed = reduce(verified, { type: 'welcomed' });
    expect(resumeStep('add-passkey', welcomed, signedIn())).toBe('add-passkey');
    expect(resumeStep('passkey', welcomed, signedIn())).toBe('add-passkey');
    expect(resumeStep('passkey', reduce(welcomed, { type: 'passkey-started' }), signedIn())).toBe('passkey');
  });

  it('once a passkey exists the prompt is not shown again', () => {
    const started = after({ type: 'phone-verified' }, { type: 'welcomed' }, { type: 'passkey-started' });

    expect(resumeStep('passkey', reduce(started, { type: 'passkey-saved' }), signedIn())).toBe('add-passkey');
    expect(resumeStep('passkey', started, signedIn({ hasPasskey: true }))).toBe('add-passkey');
  });
});

describe('admin machine: addresses and directions', () => {
  it('has a Back only where there is a step to return to', () => {
    expect(adminSteps.map((step) => [step, backOf(step)])).toEqual([
      ['phone', null],
      ['code', 'phone'],
      ['welcome', null],
      ['add-passkey', null],
      ['passkey', 'add-passkey'],
    ]);
  });

  it('gives each step an address and reads it back', () => {
    for (const step of adminSteps) expect(stepOfPath(stepPath(step))).toBe(step);
    expect(stepOfPath('/admin/welcome/')).toBe('welcome');
    expect(stepOfPath('/signin/welcome')).toBeNull();
  });

  it('moves forward deeper into the flow and back out of it', () => {
    expect(directionOf('phone', 'code')).toBe('forward');
    expect(directionOf('code', 'phone')).toBe('back');
  });
});
