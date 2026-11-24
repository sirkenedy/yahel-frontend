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
    expect(rejected).toMatchObject({ resetCode: null, resetCodeRejected: true, resetCodeSpent: false });

    expect(reduce(rejected, { type: 'reset-code-entered', code: 'B8mYr3' })).toMatchObject({ resetCode: 'B8mYr3', resetCodeRejected: false });
    expect(reduce(rejected, { type: 'reset-code-sent', method: 'phone', destination: 'y' })).toMatchObject({ resetCodeRejected: false, recovery: { method: 'phone', destination: 'y' } });

    const spent = reduce(rejected, { type: 'reset-code-rejected', spent: true });
    expect(spent).toMatchObject({ resetCodeRejected: true, resetCodeSpent: true });
    expect(reduce(spent, { type: 'reset-code-sent', method: 'email', destination: 'x' })).toMatchObject({ resetCodeRejected: false, resetCodeSpent: false });
    expect(reduce(spent, { type: 'reset-code-entered', code: 'B8mYr3' })).toMatchObject({ resetCodeRejected: false, resetCodeSpent: false });
  });

  it('drops an expired challenge and says why the person is back at the password step', () => {
    const expired = after({ type: 'email-entered', email }, { type: 'second-step-required', challengeToken: 'c-1' }, { type: 'challenge-expired' });

    expect(expired).toMatchObject({ email, challengeToken: null, passwordPrompt: 'challenge-expired' });
    expect(resumeStep('code', expired, facts())).toBe('password');
    expect(reduce(expired, { type: 'second-step-required', challengeToken: 'c-2' }).passwordPrompt).toBeNull();
  });

  it('treats a completed reset as final: the code is gone and only signing in remains', () => {
    const done = after({ type: 'email-entered', email }, { type: 'email-unconfirmed', password: 'proven' }, { type: 'reset-code-sent', method: 'email', destination: 'x' }, { type: 'reset-code-entered', code: 'A7kZq2' }, { type: 'password-reset' });

    expect(done).toMatchObject({ email, resetCode: null, recovery: null, provenPassword: null, passwordPrompt: 'reset-done' });
    expect(resumeStep('new-password', done, facts())).toBe('recover');
    expect(resumeStep('password', done, facts())).toBe('password');
  });

  it('forgets everything on sign-out', () => {
    expect(after({ type: 'email-entered', email }, { type: 'passkey-started' }, { type: 'help-requested' }, { type: 'signed-out' })).toEqual(initialSignInState);
  });
});

describe('resumeStep', () => {
  it('opens Done only once signed in, and keeps every other step open to add another account', () => {
    expect(resumeStep('done', initialSignInState, facts({ signedIn: true }))).toBe('done');
    expect(resumeStep('done', initialSignInState, facts())).toBe('email');
    expect(resumeStep('email', initialSignInState, facts({ signedIn: true }))).toBe('email');
    expect(resumeStep('choose', initialSignInState, facts({ signedIn: true, knownAccounts: 1 }))).toBe('choose');
  });

  it('shows the chooser, to say so, when the list of this device’s accounts could not be read', () => {
    expect(resumeStep('choose', initialSignInState, facts({ knownAccounts: null }))).toBe('choose');
    expect(backOf('email', initialSignInState, facts({ knownAccounts: null }))).toBe('choose');
  });

  it('enters and leaves the chooser’s remove mode, which a new start forgets', () => {
    const removing = reduce(initialSignInState, { type: 'removing', on: true });
    expect(removing.removing).toBe(true);
    expect(reduce(removing, { type: 'removing', on: false }).removing).toBe(false);
    expect(reduce(removing, { type: 'another-account-wanted' }).removing).toBe(false);
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

describe('confirming an email', () => {
  const proven = after({ type: 'email-entered', email }, { type: 'email-unconfirmed', password: 'p' });

  it('holds the proven password only until the address is confirmed or the step is left', () => {
    expect(proven.provenPassword).toBe('p');
    expect(reduce(proven, { type: 'email-confirmed' })).toMatchObject({ provenPassword: null, passwordPrompt: 'email-confirmed', email });
    expect(reduce(proven, { type: 'proof-dropped' }).provenPassword).toBeNull();
    expect(reduce(proven, { type: 'signed-in' }).provenPassword).toBeNull();
    expect(reduce(proven, { type: 'another-account-wanted' }).provenPassword).toBeNull();
    expect(reduce(proven, { type: 'email-entered', email: 'kofi@northwind.example' }).provenPassword).toBeNull();
  });

  it('leaves the state alone when there is no proof to drop', () => {
    expect(reduce(initialSignInState, { type: 'proof-dropped' })).toBe(initialSignInState);
  });

  it('shows the confirm step only while the proof is held, and the password step otherwise', () => {
    expect(resumeStep('confirm-email', proven, facts())).toBe('confirm-email');
    expect(resumeStep('confirm-email', reduce(proven, { type: 'proof-dropped' }), facts())).toBe('password');
    expect(resumeStep('confirm-email', initialSignInState, facts())).toBe('email');
    expect(resumeStep('confirm-email', proven, facts({ signedIn: true }))).toBe('confirm-email');
    expect(backOf('confirm-email', proven, facts())).toBe('password');
    expect(stepOfPath('/signin/confirm-email')).toBe('confirm-email');
  });
});
