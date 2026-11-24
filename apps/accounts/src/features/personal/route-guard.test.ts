import { createAccountCapabilities } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { arriveAtReview, forgetSignUp, isSignedInElsewhere, personalFacts, stepInsteadOf } from './route-guard';
import { createPersonalStore } from './store';

const instant = async () => undefined;
const api = { auth: { forgotPassword: vi.fn() } } as unknown as Session['api'];
const sessionWith = (status: 'signed-in' | 'signed-out') => ({ store: { getState: () => ({ status, profile: null }) } }) as unknown as Session;
const registrar = (supported: boolean) => ({ isSupported: () => supported }) as PasskeyRegistrar;

describe('personalFacts', () => {
  it('reports what this browser and build offer', () => {
    expect(personalFacts({ capabilities: createAccountCapabilities(api, createStandIns(instant)), registrar: registrar(true) })).toEqual({ passkeysOffered: true, contactOffered: true });
  });

  it('offers no passkey without stand-ins or in a browser without WebAuthn, and always a trusted contact', () => {
    expect(personalFacts({ capabilities: createAccountCapabilities(api), registrar: null })).toEqual({ passkeysOffered: false, contactOffered: true });
    expect(personalFacts({ capabilities: createAccountCapabilities(api, createStandIns(instant)), registrar: registrar(false) }).passkeysOffered).toBe(false);
  });
});

describe('isSignedInElsewhere', () => {
  it('is true for someone signed in who did not create the account in this visit', () => {
    expect(isSignedInElsewhere({ session: sessionWith('signed-in'), personal: createPersonalStore() })).toBe(true);
    expect(isSignedInElsewhere({ session: sessionWith('signed-out'), personal: createPersonalStore() })).toBe(false);
  });

  it('is false for the person who has just been signed in to their new account', () => {
    const personal = createPersonalStore();
    personal.dispatch({ type: 'signed-in' });

    expect(isSignedInElsewhere({ session: sessionWith('signed-in'), personal })).toBe(false);
  });
});

describe('stepInsteadOf', () => {
  const facts = { passkeysOffered: true, contactOffered: true };

  it('lets a step through when everything it needs is present, and names the step to show when not', () => {
    const personal = createPersonalStore();
    expect(stepInsteadOf('name', personal, facts)).toBeNull();
    expect(stepInsteadOf('review', personal, facts)).toBe('name');

    personal.dispatch({ type: 'name-entered', firstName: 'Amara', lastName: '' });
    expect(stepInsteadOf('birth', personal, facts)).toBeNull();
  });
});

describe('forgetSignUp', () => {
  const answered = () => {
    const personal = createPersonalStore();
    personal.dispatch({ type: 'name-entered', firstName: 'Amara', lastName: '' });
    personal.dispatch({ type: 'password-chosen', password: 'Sunrise over Lekki 94' });
    personal.dispatch({ type: 'passkey-created', attestation: { credentialId: 'id', clientDataJSON: 'c', attestationObject: 'a', transports: [] } });
    return personal;
  };

  it('forgets every answer, the password and the passkey', () => {
    const personal = answered();

    forgetSignUp(personal);

    expect(personal.getState()).toEqual(personal.getInitialState());
  });

  it('forgets even an account that is underway when the flow is left', () => {
    const personal = answered();
    personal.dispatch({ type: 'account-created' });

    forgetSignUp(personal);

    expect(personal.getState().password).toBeNull();
  });

  it('can spare a visit whose account already exists, which needs its answers to finish', () => {
    const personal = answered();
    forgetSignUp(personal, { unlessUnderway: true });
    expect(personal.getState()).toEqual(personal.getInitialState());

    const underway = answered();
    underway.dispatch({ type: 'account-created' });
    forgetSignUp(underway, { unlessUnderway: true });
    expect(underway.getState()).toMatchObject({ firstName: 'Amara', password: 'Sunrise over Lekki 94' });
  });
});

describe('arriveAtReview', () => {
  it('ends a change that was being made, however the review was reached', () => {
    const personal = createPersonalStore();
    personal.dispatch({ type: 'edit-started' });

    arriveAtReview(personal);

    expect(personal.getState().editing).toBe(false);
  });

  it('leaves the state alone when nothing was being changed', () => {
    const personal = createPersonalStore();
    const before = personal.getState();

    arriveAtReview(personal);

    expect(personal.getState()).toBe(before);
  });
});
