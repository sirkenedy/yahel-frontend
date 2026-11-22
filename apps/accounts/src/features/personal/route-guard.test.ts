import { createAccountCapabilities } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { isSignedInElsewhere, personalFacts, stepInsteadOf } from './route-guard';
import { createPersonalStore } from './store';

const instant = async () => undefined;
const api = { auth: { forgotPassword: vi.fn() } } as unknown as Session['api'];
const sessionWith = (status: 'signed-in' | 'signed-out') => ({ store: { getState: () => ({ status, profile: null }) } }) as unknown as Session;
const registrar = (supported: boolean) => ({ isSupported: () => supported }) as PasskeyRegistrar;

describe('personalFacts', () => {
  it('reports what this browser and build offer', () => {
    expect(personalFacts({ capabilities: createAccountCapabilities(api, createStandIns(instant)), registrar: registrar(true) })).toEqual({ passkeysOffered: true, contactOffered: true });
  });

  it('offers neither a passkey nor a trusted contact without stand-ins, or in a browser without WebAuthn', () => {
    expect(personalFacts({ capabilities: createAccountCapabilities(api), registrar: null })).toEqual({ passkeysOffered: false, contactOffered: false });
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
