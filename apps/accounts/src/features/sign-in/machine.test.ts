import { describe, expect, it } from 'vitest';
import { backOf, directionOf, initialSignInState, reduce, resumeStep, signInSteps, stepOfPath, stepPath } from './machine';
import type { SignInEvent, SignInFacts, SignInState } from './machine';

const facts = (overrides: Partial<SignInFacts> = {}): SignInFacts => ({ signedIn: false, knownAccounts: 0, passkeysOffered: true, helpOffered: true, ...overrides });
const after = (...events: SignInEvent[]): SignInState => events.reduce(reduce, initialSignInState);
const email = 'amara@northwind.example';

describe('reduce', () => {
  it('remembers who is signing in and whether they came from the chooser', () => {
    expect(after({ type: 'email-entered', email })).toMatchObject({ email, fromChooser: false });
    expect(after({ type: 'account-chosen', email })).toMatchObject({ email, fromChooser: true });
  });

  it('starts clean for a different account, dropping anything collected for the last one', () => {
    const state = after({ type: 'email-entered', email }, { type: 'second-step-required', challengeToken: 'c-1' }, { type: 'email-entered', email: 'kofi@northwind.example' });

    expect(state).toEqual({ ...initialSignInState, email: 'kofi@northwind.example' });
    expect(after({ type: 'email-entered', email }, { type: 'another-account-wanted' })).toEqual(initialSignInState);
  });

  it('holds the challenge until sign-in completes, then drops every credential-like value', () => {
    const waiting = after({ type: 'email-entered', email }, { type: 'second-step-required', challengeToken: 'c-1' });
    expect(waiting.challengeToken).toBe('c-1');

    const recovering = after({ type: 'email-entered', email }, { type: 'reset-code-sent', method: 'email', destination: 'a•••@northwind.example' }, { type: 'reset-code-entered', code: 'A7kZq2' });
    expect(recovering).toMatchObject({ resetCode: 'A7kZq2', recovery: { method: 'email' } });

    for (const state of [waiting, recovering]) expect(reduce(state, { type: 'signed-in' })).toEqual({ ...initialSignInState, email });
  });

  it('clears a rejected reset code and says so, until a new one is sent or entered', () => {
    const rejected = after({ type: 'email-entered', email }, { type: 'reset-code-sent', method: 'email', destination: 'x' }, { type: 'reset-code-entered', code: 'A7kZq2' }, { type: 'reset-code-rejected' });
    expect(rejected).toMatchObject({ resetCode: null, resetCodeRejected: true });

    expect(reduce(rejected, { type: 'reset-code-entered', code: 'B8mYr3' })).toMatchObject({ resetCode: 'B8mYr3', resetCodeRejected: false });
    expect(reduce(rejected, { type: 'reset-code-sent', method: 'phone', destination: 'y' })).toMatchObject({ resetCodeRejected: false, recovery: { method: 'phone', destination: 'y' } });
  });

  it('forgets everything on sign-out', () => {
    expect(after({ type: 'email-entered', email }, { type: 'passkey-started' }, { type: 'help-requested' }, { type: 'signed-out' })).toEqual(initialSignInState);
  });
});

describe('resumeStep', () => {
  it('sends every step to Done once signed in', () => {
    for (const step of signInSteps) expect(resumeStep(step, initialSignInState, facts({ signedIn: true }))).toBe('done');
  });

  it('starts at the chooser when this device knows accounts, otherwise at the email step', () => {
    expect(resumeStep('choose', initialSignInState, facts())).toBe('email');
    expect(resumeStep('choose', initialSignInState, facts({ knownAccounts: 2 }))).toBe('choose');
    expect(resumeStep('done', initialSignInState, facts({ knownAccounts: 2 }))).toBe('choose');
  });

  it('lands a reload of any later step on the first step, because nothing was kept', () => {
    for (const step of signInSteps.filter((name) => !name.startsWith('help'))) expect(resumeStep(step, initialSignInState, facts())).toBe('email');
    for (const step of ['help', 'help-sent'] as const) expect(resumeStep(step, initialSignInState, facts())).toBe('help');
  });

  it('allows a step only when what it depends on is present', () => {
    const withEmail = after({ type: 'email-entered', email });
    expect(resumeStep('password', withEmail, facts())).toBe('password');
    expect(resumeStep('recover', withEmail, facts())).toBe('recover');
    expect(resumeStep('code', withEmail, facts())).toBe('password');
    expect(resumeStep('code', reduce(withEmail, { type: 'second-step-required', challengeToken: 'c' }), facts())).toBe('code');

    expect(resumeStep('recover-code', withEmail, facts())).toBe('recover');
    const sent = reduce(withEmail, { type: 'reset-code-sent', method: 'email', destination: 'x' });
    expect(resumeStep('recover-code', sent, facts())).toBe('recover-code');
    expect(resumeStep('new-password', sent, facts())).toBe('recover-code');
    expect(resumeStep('new-password', reduce(sent, { type: 'reset-code-entered', code: 'A7kZq2' }), facts())).toBe('new-password');
  });

  it('shows the passkey wait only after the person asked for it, on a device that offers passkeys', () => {
    const started = after({ type: 'passkey-started' });
    expect(resumeStep('passkey', initialSignInState, facts())).toBe('email');
    expect(resumeStep('passkey', started, facts())).toBe('passkey');
    expect(resumeStep('passkey', started, facts({ passkeysOffered: false }))).toBe('email');
  });

  it('shows help only where it is offered, and its confirmation only after a request', () => {
    expect(resumeStep('help', initialSignInState, facts({ helpOffered: false }))).toBe('email');
    expect(resumeStep('help-sent', initialSignInState, facts())).toBe('help');
    expect(resumeStep('help-sent', after({ type: 'help-requested' }), facts())).toBe('help-sent');
  });
});

describe('backOf', () => {
  it('leads to the step before, and nowhere from the first and last steps', () => {
    const typed = after({ type: 'email-entered', email });
    const chosen = after({ type: 'account-chosen', email });

    expect(backOf('choose', initialSignInState, facts({ knownAccounts: 2 }))).toBeNull();
    expect(backOf('email', initialSignInState, facts())).toBeNull();
    expect(backOf('email', initialSignInState, facts({ knownAccounts: 2 }))).toBe('choose');
    expect(backOf('password', typed, facts())).toBe('email');
    expect(backOf('password', chosen, facts({ knownAccounts: 2 }))).toBe('choose');
    expect(backOf('passkey', typed, facts())).toBe('email');
    expect(backOf('code', typed, facts())).toBe('password');
    expect(backOf('recover', typed, facts())).toBe('password');
    expect(backOf('recover-code', typed, facts())).toBe('recover');
    expect(backOf('new-password', typed, facts())).toBe('recover-code');
    expect(backOf('help', initialSignInState, facts())).toBe('email');
    expect(backOf('help', typed, facts())).toBe('recover');
    expect(backOf('help-sent', typed, facts())).toBeNull();
    expect(backOf('done', typed, facts())).toBeNull();
  });
});

describe('addresses and direction', () => {
  it('gives every step its own address and reads it back', () => {
    for (const step of signInSteps) expect(stepOfPath(stepPath(step))).toBe(step);
    expect(stepPath('recover-code')).toBe('/signin/recover-code');
    expect(stepOfPath('/signin/password/')).toBe('password');
    expect(stepOfPath('/signin')).toBeNull();
  });

  it('knows which way a move goes', () => {
    expect(directionOf('email', 'password')).toBe('forward');
    expect(directionOf('password', 'email')).toBe('back');
    expect(directionOf('new-password', 'done')).toBe('forward');
  });
});
