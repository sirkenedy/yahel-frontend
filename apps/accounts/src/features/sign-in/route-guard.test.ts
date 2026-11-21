import { QueryClient } from '@tanstack/react-query';
import { createAccountCapabilities } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { PasskeyClient, Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { loadSignInFacts, stepInsteadOf } from './route-guard';
import { createSignInStore } from './store';

const instant = async () => undefined;
const api = { auth: { forgotPassword: vi.fn() } } as unknown as Session['api'];
const sessionWith = (status: 'signed-in' | 'signed-out') => ({ store: { getState: () => ({ status, profile: null }) } }) as unknown as Session;

const context = ({ status = 'signed-out' as 'signed-in' | 'signed-out', standIns = true, passkeySupported = true } = {}) => {
  const capabilities = createAccountCapabilities(api, standIns ? createStandIns(instant) : undefined);
  const passkeys = capabilities.passkeys ? ({ isSupported: () => passkeySupported, prepare: vi.fn(), signIn: vi.fn() } as PasskeyClient) : null;
  return { session: sessionWith(status), queryClient: new QueryClient(), capabilities, passkeys, signIn: createSignInStore() };
};

describe('loadSignInFacts', () => {
  it('reports what this device and build offer', async () => {
    await expect(loadSignInFacts(context())).resolves.toEqual({ signedIn: false, knownAccounts: 2, passkeysOffered: true, helpOffered: true });
  });

  it('offers nothing extra without stand-ins', async () => {
    await expect(loadSignInFacts(context({ standIns: false }))).resolves.toEqual({ signedIn: false, knownAccounts: 0, passkeysOffered: false, helpOffered: false });
  });

  it('does not offer passkeys in a browser without WebAuthn', async () => {
    await expect(loadSignInFacts(context({ passkeySupported: false }))).resolves.toMatchObject({ passkeysOffered: false });
  });

  it('knows when someone is signed in', async () => {
    await expect(loadSignInFacts(context({ status: 'signed-in' }))).resolves.toMatchObject({ signedIn: true });
  });

  it('reads the known accounts once and reuses the answer on later steps', async () => {
    const shared = context();
    const list = vi.spyOn(shared.capabilities.directory!, 'list');
    await loadSignInFacts(shared);
    await loadSignInFacts(shared);

    expect(list).toHaveBeenCalledTimes(1);
  });

  it('starts from the email step when the list of known accounts cannot be read', async () => {
    const broken = context();
    broken.capabilities.directory!.list = vi.fn().mockRejectedValue(new Error('unreachable'));

    await expect(loadSignInFacts(broken)).resolves.toMatchObject({ knownAccounts: 0 });
  });
});

describe('stepInsteadOf', () => {
  const facts = { signedIn: false, knownAccounts: 0, passkeysOffered: false, helpOffered: false };

  it('is null when the step can be shown, and names the honest step when it cannot', () => {
    const store = createSignInStore();
    expect(stepInsteadOf('email', store, facts)).toBeNull();
    expect(stepInsteadOf('password', store, facts)).toBe('email');

    store.dispatch({ type: 'email-entered', email: 'amara@northwind.example' });
    expect(stepInsteadOf('password', store, facts)).toBeNull();
    expect(stepInsteadOf('password', store, { ...facts, signedIn: true })).toBe('done');
  });
});
