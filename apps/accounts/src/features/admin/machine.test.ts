import { describe, expect, it } from 'vitest';
import { adminSteps, backOf, directionOf, initialAdminState, reduce, resumeStep, stepOfPath, stepPath } from './machine';
import type { AdminEvent, AdminFacts } from './machine';

const facts = (overrides: Partial<AdminFacts> = {}): AdminFacts => ({ signedIn: false, phoneVerified: false, hasPasskey: false, ...overrides });
const signedIn = (overrides: Partial<AdminFacts> = {}) => facts({ signedIn: true, ...overrides });
const after = (...events: AdminEvent[]) => events.reduce(reduce, initialAdminState);
const handover = { email: 'amara@harbourline.example', organisation: 'Harbourline Studio' };

describe('admin machine: what is remembered', () => {
  it('takes the address and the name workspace sign-up hands over, and keeps them against a typed address', () => {
    const state = after({ type: 'handed-over', handover }, { type: 'email-entered', email: 'someone@else.example' });

    expect(state).toMatchObject({ email: handover.email, organisation: handover.organisation, handedOver: true });
  });

  it('starts again for a different typed address, and keeps everything for the same one', () => {
    const typed = after({ type: 'email-entered', email: 'kayode@northwind.example' }, { type: 'email-unconfirmed', password: 'pw' });

    expect(reduce(typed, { type: 'email-entered', email: 'kayode@northwind.example' })).toBe(typed);
    expect(reduce(typed, { type: 'email-entered', email: 'ada@northwind.example' })).toEqual({ ...initialAdminState, email: 'ada@northwind.example' });
  });

  it('holds a proven password only until the address is confirmed, the proof is dropped, or sign-in finishes', () => {
    const proven = after({ type: 'handed-over', handover }, { type: 'email-unconfirmed', password: 'pw' });
    expect(proven.provenPassword).toBe('pw');

    expect(reduce(proven, { type: 'email-confirmed' })).toMatchObject({ provenPassword: null, signInPrompt: 'email-confirmed' });
    expect(reduce(proven, { type: 'proof-dropped' }).provenPassword).toBeNull();
    expect(reduce(proven, { type: 'signed-in' })).toMatchObject({ provenPassword: null, signInPrompt: null });
    expect(reduce(proven, { type: 'second-step-required' })).toMatchObject({ provenPassword: null, signInPrompt: 'second-step' });
    expect(reduce(proven, { type: 'reset' })).toBe(initialAdminState);
  });

  it('dropping a proof that is not held changes nothing', () => {
    const state = after({ type: 'handed-over', handover });

    expect(reduce(state, { type: 'proof-dropped' })).toBe(state);
  });

  it('keeps the number a code was texted to until it is confirmed', () => {
    const sent = after({ type: 'phone-code-sent', country: 'NG', number: '803 555 0142' });
    expect(sent.phone).toEqual({ country: 'NG', number: '803 555 0142' });

    expect(reduce(sent, { type: 'phone-verified' })).toMatchObject({ phone: null, phoneVerified: true });
  });

  it('records the welcome and the passkey', () => {
    expect(after({ type: 'welcomed' }, { type: 'passkey-started' }, { type: 'passkey-saved' })).toMatchObject({ welcomed: true, passkeyStarted: true, passkeySaved: true });
  });
});

describe('admin machine: which step can honestly be shown', () => {
  it('signed out, only sign-in, and the confirm step while a proven password is held', () => {
    const proven = after({ type: 'email-entered', email: 'kayode@northwind.example' }, { type: 'email-unconfirmed', password: 'pw' });

    for (const step of adminSteps.filter((step) => step !== 'confirm-email')) expect(resumeStep(step, proven, facts())).toBe('signin');
    expect(resumeStep('confirm-email', proven, facts())).toBe('confirm-email');
    expect(resumeStep('confirm-email', reduce(proven, { type: 'proof-dropped' }), facts())).toBe('signin');
    expect(resumeStep('confirm-email', initialAdminState, facts())).toBe('signin');
  });

  it('signed in, the phone comes first, and its code only once one was texted', () => {
    expect(resumeStep('signin', initialAdminState, signedIn())).toBe('phone');
    expect(resumeStep('confirm-email', initialAdminState, signedIn())).toBe('phone');
    expect(resumeStep('code', initialAdminState, signedIn())).toBe('phone');
    expect(resumeStep('code', after({ type: 'phone-code-sent', country: 'NG', number: '8035550142' }), signedIn())).toBe('code');
  });

  it('the welcome needs a confirmed phone, from this visit or from the server', () => {
    expect(resumeStep('welcome', initialAdminState, signedIn())).toBe('phone');
    expect(resumeStep('welcome', after({ type: 'phone-verified' }), signedIn())).toBe('welcome');
    expect(resumeStep('welcome', initialAdminState, signedIn({ phoneVerified: true }))).toBe('welcome');
    expect(resumeStep('phone', initialAdminState, signedIn({ phoneVerified: true }))).toBe('welcome');
    expect(resumeStep('code', after({ type: 'phone-code-sent', country: 'NG', number: '8035550142' }), signedIn({ phoneVerified: true }))).toBe('welcome');
  });

  it('nothing past the welcome can be reached around it, and the passkey prompt only once asked for', () => {
    const verified = after({ type: 'phone-verified' });
    expect(resumeStep('add-passkey', verified, signedIn())).toBe('welcome');
    expect(resumeStep('passkey', verified, signedIn())).toBe('welcome');

    const welcomed = reduce(verified, { type: 'welcomed' });
    expect(resumeStep('add-passkey', welcomed, signedIn())).toBe('add-passkey');
    expect(resumeStep('passkey', welcomed, signedIn())).toBe('add-passkey');
    expect(resumeStep('passkey', reduce(welcomed, { type: 'passkey-started' }), signedIn())).toBe('passkey');
  });

  it('once a passkey exists the prompt is not shown again: the passkey step leads on to Admin', () => {
    const started = after({ type: 'phone-verified' }, { type: 'welcomed' }, { type: 'passkey-started' });

    expect(resumeStep('passkey', reduce(started, { type: 'passkey-saved' }), signedIn())).toBe('add-passkey');
    expect(resumeStep('passkey', started, signedIn({ hasPasskey: true }))).toBe('add-passkey');
  });

  it('arriving signed in at any step lands on the first thing still to do', () => {
    const verified = signedIn({ phoneVerified: true });

    expect(resumeStep('signin', initialAdminState, verified)).toBe('welcome');
    expect(resumeStep('signin', after({ type: 'welcomed' }), verified)).toBe('add-passkey');
  });
});

describe('admin machine: addresses and directions', () => {
  it('has a Back only where there is a step to return to', () => {
    expect(adminSteps.map((step) => [step, backOf(step)])).toEqual([
      ['signin', null],
      ['confirm-email', 'signin'],
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
    expect(directionOf('signin', 'phone')).toBe('forward');
    expect(directionOf('code', 'phone')).toBe('back');
  });
});
