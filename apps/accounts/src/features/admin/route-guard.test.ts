import { QueryClient } from '@tanstack/react-query';
import { createAccountCapabilities } from '@yahel/api-client';
import type { AdminAccess, RecoveryMethods } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { dropProof, forgetAdmin, isOffered, loadAdminFacts, receiveHandover, stepInsteadOf } from './route-guard';
import { createAdminStore } from './store';

const api = { auth: {} } as never;
const instant = async () => undefined;
const handover = { email: 'amara@harbourline.example', organisation: 'Harbourline Studio' };
const profile = { id: 'p-1', globalId: 'g', email: 'kayode@northwind.example', firstName: 'Kayode', lastName: 'Balogun', displayName: 'Kayode Balogun', photo: null };
const phone = (verified: Partial<RecoveryMethods['phone']>): RecoveryMethods => ({
  recoveryEmail: { configured: false, value: null, lastUpdatedAt: null, pending: null },
  phone: { configured: false, verified: false, value: null, lastUpdatedAt: null, pending: null, ...verified },
});

const sessionAs = (status: 'signed-in' | 'signed-out', recovery: RecoveryMethods = phone({})) => {
  const get = vi.fn().mockResolvedValue(recovery);
  return { session: { store: { getState: () => ({ status, profile: status === 'signed-in' ? profile : null }) }, api: { me: { recovery: { get } } } } as unknown as Session, get };
};
const access = (membership: Awaited<ReturnType<AdminAccess['membership']>>) => ({ adminAccess: { membership: vi.fn().mockResolvedValue(membership) } }) as unknown as Parameters<typeof loadAdminFacts>[0]['capabilities'];

describe('isOffered', () => {
  it('follows workspace sign-up, and needs the server to say who administers what and to take a passkey', () => {
    const demo = createAccountCapabilities(api, createStandIns(instant));
    expect(isOffered({ config: { businessSignUp: true }, capabilities: demo })).toBe(true);
    expect(isOffered({ config: { businessSignUp: false }, capabilities: demo })).toBe(false);
    expect(isOffered({ config: { businessSignUp: true }, capabilities: createAccountCapabilities(api) })).toBe(false);
    expect(isOffered({ config: { businessSignUp: true }, capabilities: { ...demo, passkeyRegistration: null } })).toBe(false);
  });
});

describe('loadAdminFacts', () => {
  it('asks the server nothing while nobody is signed in', async () => {
    const { session, get } = sessionAs('signed-out');
    const membership = access(null);

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), capabilities: membership })).resolves.toEqual({ signedIn: false, phoneVerified: false, hasPasskey: false, administrator: true, organisation: null, passkeyRequired: false });
    expect(get).not.toHaveBeenCalled();
    expect(membership.adminAccess!.membership).not.toHaveBeenCalled();
  });

  it('reads the workspace and whether a phone is confirmed, for the signed-in account', async () => {
    const { session } = sessionAs('signed-in', phone({ configured: true, verified: true }));

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), capabilities: access({ organisation: 'Northwind Studio', administrator: true, hasPasskey: true, passkeyRequired: true }) })).resolves.toEqual({ signedIn: true, phoneVerified: true, hasPasskey: true, administrator: true, organisation: 'Northwind Studio', passkeyRequired: true });
  });

  it('counts a confirmed number still waiting to replace an older one', async () => {
    const { session } = sessionAs('signed-in', phone({ pending: { value: '***0142', verified: true, requestedAt: null, usableAt: null } }));

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), capabilities: access({ organisation: 'Northwind Studio', administrator: true, hasPasskey: false, passkeyRequired: true }) })).resolves.toMatchObject({ phoneVerified: true });
  });

  it('says Admin is closed without a passkey only when the server says it enforces that', async () => {
    const { session } = sessionAs('signed-in');
    const facts = (answer: Parameters<typeof access>[0]) => loadAdminFacts({ session, queryClient: new QueryClient(), capabilities: access(answer) });

    await expect(facts({ organisation: 'Northwind Studio', administrator: true, hasPasskey: false, passkeyRequired: false })).resolves.toMatchObject({ passkeyRequired: false });
    await expect(facts({ organisation: 'Northwind Studio', administrator: true, hasPasskey: false } as Parameters<typeof access>[0])).resolves.toMatchObject({ passkeyRequired: false });
  });

  it('a personal session, or a member who administers nothing, is no administrator', async () => {
    const { session } = sessionAs('signed-in');

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), capabilities: access(null) })).resolves.toMatchObject({ signedIn: true, administrator: false, organisation: null });
    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), capabilities: access({ organisation: 'Northwind Studio', administrator: false, hasPasskey: false, passkeyRequired: true }) })).resolves.toMatchObject({ administrator: false });
  });
});

describe('the store between steps', () => {
  it('takes a handover once, and keeps what is underway when the same address arrives again', () => {
    const store = createAdminStore();
    receiveHandover(store, null);
    expect(store.getState().email).toBeNull();

    receiveHandover(store, handover);
    store.dispatch({ type: 'email-unconfirmed', password: 'pw' });
    receiveHandover(store, handover);
    expect(store.getState()).toMatchObject({ email: handover.email, handedOver: true, provenPassword: 'pw' });
  });

  it('drops the proof on leaving the confirm step and forgets everything on leaving the flow', () => {
    const store = createAdminStore();
    receiveHandover(store, handover);
    store.dispatch({ type: 'email-unconfirmed', password: 'pw' });

    dropProof(store);
    expect(store.getState().provenPassword).toBeNull();
    forgetAdmin(store);
    expect(store.getState().email).toBeNull();
  });

  it('says which step to show instead, or nothing when the step can be shown', () => {
    const store = createAdminStore();
    expect(stepInsteadOf('signin', store, { signedIn: false, phoneVerified: false, hasPasskey: false })).toBeNull();
    expect(stepInsteadOf('welcome', store, { signedIn: false, phoneVerified: false, hasPasskey: false })).toBe('signin');
    expect(stepInsteadOf('welcome', store, { signedIn: true, phoneVerified: false, hasPasskey: false })).toBe('phone');
  });
});
