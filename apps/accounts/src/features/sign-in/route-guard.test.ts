import { QueryClient } from '@tanstack/react-query';
import { createAccountCapabilities } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { PasskeyClient, Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { chooseByHandle, loadSignInFacts, stepInsteadOf, validateSignInSearch } from './route-guard';
import { createSignInStore } from './store';

const instant = async () => undefined;
const remembered = (count: number) => Array.from({ length: count }, (_, slot) => ({ handle: `h-${slot}`, slot, displayName: null, initials: null, avatarUrl: null, email: `a${slot}@yahel.example`, kind: 'personal', organisation: null, role: null, signedIn: false }));
const apiWith = (count: number) => ({ auth: { forgotPassword: vi.fn(), accounts: vi.fn().mockResolvedValue(remembered(count)), removeAccount: vi.fn() } }) as unknown as Session['api'];
const sessionWith = (status: 'signed-in' | 'signed-out') => ({ store: { getState: () => ({ status, profile: null }) } }) as unknown as Session;

const context = ({ status = 'signed-out' as 'signed-in' | 'signed-out', standIns = true, passkeySupported = true, accounts = 2 } = {}) => {
  const capabilities = createAccountCapabilities(apiWith(accounts), standIns ? createStandIns(instant) : undefined);
  const passkeys = { isSupported: () => passkeySupported, prepare: vi.fn(), signIn: vi.fn() } as PasskeyClient;
  return { session: sessionWith(status), queryClient: new QueryClient(), capabilities, passkeys, signIn: createSignInStore() };
};

describe('loadSignInFacts', () => {
  it('reports what this device and build offer', async () => {
    await expect(loadSignInFacts(context())).resolves.toEqual({ signedIn: false, knownAccounts: 2, passkeysOffered: true, helpOffered: true });
  });

  it('offers passkeys, which are real, but no help desk without stand-ins', async () => {
    await expect(loadSignInFacts(context({ standIns: false, accounts: 0 }))).resolves.toEqual({ signedIn: false, knownAccounts: 0, passkeysOffered: true, helpOffered: false });
  });

  it('does not offer passkeys in a browser without WebAuthn', async () => {
    await expect(loadSignInFacts(context({ passkeySupported: false }))).resolves.toMatchObject({ passkeysOffered: false });
  });

  it('knows when someone is signed in', async () => {
    await expect(loadSignInFacts(context({ status: 'signed-in' }))).resolves.toMatchObject({ signedIn: true });
  });

  it('reads the known accounts once and reuses the answer on later steps', async () => {
    const shared = context();
    const list = vi.spyOn(shared.capabilities.directory, 'list');
    await loadSignInFacts(shared);
    await loadSignInFacts(shared);

    expect(list).toHaveBeenCalledTimes(1);
  });

  it('reports a list of known accounts that cannot be read as unknown, for the chooser to explain', async () => {
    const broken = context();
    broken.capabilities.directory.list = vi.fn().mockRejectedValue(new Error('unreachable'));

    await expect(loadSignInFacts(broken)).resolves.toMatchObject({ knownAccounts: null });
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
    expect(stepInsteadOf('done', store, { ...facts, signedIn: true })).toBeNull();
    expect(stepInsteadOf('done', store, facts)).toBe('email');
  });
});

describe('an account asked for by its handle', () => {
  it('accepts only a handle-shaped value, and nothing else from the address', () => {
    expect(validateSignInSearch({ account: 'handle-1-amara' })).toEqual({ account: 'handle-1-amara' });
    for (const account of ['amara@yahel.example', 'short', 'x'.repeat(65), 42, undefined, '<script>alert(1)</script>']) expect(validateSignInSearch({ account })).toEqual({});
  });

  it('opens the password for a remembered account that is signed out, with its address from this browser’s list', async () => {
    const shared = context({ accounts: 2 });
    await loadSignInFacts(shared);

    expect(chooseByHandle(shared, 'h-1')).toBe(true);
    expect(shared.signIn.getState()).toMatchObject({ email: 'a1@yahel.example', fromChooser: true });
  });

  it('falls back to the chooser for a handle this browser does not know, or an account already signed in', async () => {
    const shared = context({ accounts: 1 });
    await loadSignInFacts(shared);
    shared.queryClient.setQueryData(['accounts', 'on-this-device'], [{ ...remembered(1)[0]!, signedIn: true }]);

    expect(chooseByHandle(shared, 'h-0')).toBe(false);
    expect(chooseByHandle(shared, 'h-unknown')).toBe(false);
    expect(chooseByHandle(shared, undefined)).toBe(false);
    expect(shared.signIn.getState().email).toBeNull();
  });
});
