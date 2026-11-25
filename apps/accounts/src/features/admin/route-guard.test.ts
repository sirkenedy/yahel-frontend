import { QueryClient } from '@tanstack/react-query';
import type { AdminAccess, RecoveryMethods } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { forgetAdmin, isOffered, loadAdminFacts, pathOf, receiveHandover, stepInsteadOf, takePhoneChallenge } from './route-guard';
import { createAdminStore } from './store';

const handover = { email: 'amara@harbourline.example', organisation: 'Harbourline Studio', challengeToken: 'pc-1', phone: null, continueToPlan: true };
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
  it('follows workspace sign-up, and opens in any build for a phone check sign-in is waiting on', () => {
    const store = createAdminStore();
    expect(isOffered({ config: { businessSignUp: true }, admin: store })).toBe(true);
    expect(isOffered({ config: { businessSignUp: false }, admin: store })).toBe(false);

    takePhoneChallenge(store, profile.email, 'pc-2');
    expect(isOffered({ config: { businessSignUp: false }, admin: store })).toBe(true);
  });
});

describe('loadAdminFacts', () => {
  it('asks the server nothing while nobody is signed in', async () => {
    const { session, get } = sessionAs('signed-out');

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), admin: createAdminStore(), capabilities: access(null) })).resolves.toEqual({ signedIn: false, phoneVerified: false, hasPasskey: false, administrator: true, organisation: null });
    expect(get).not.toHaveBeenCalled();
  });

  it('reads the workspace and whether a phone is confirmed, for the signed-in account', async () => {
    const { session } = sessionAs('signed-in', phone({ configured: true, verified: true }));

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), admin: createAdminStore(), capabilities: access({ organisation: 'Northwind Studio', administrator: true, hasPasskey: true, passkeyRequired: false }) })).resolves.toEqual({ signedIn: true, phoneVerified: true, hasPasskey: true, administrator: true, organisation: 'Northwind Studio' });
  });

  it('a member who administers nothing is no administrator; a session in no workspace leaves it to the server', async () => {
    const { session } = sessionAs('signed-in');

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), admin: createAdminStore(), capabilities: access({ organisation: 'Northwind Studio', administrator: false, hasPasskey: false, passkeyRequired: false }) })).resolves.toMatchObject({ administrator: false });
    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), admin: createAdminStore(), capabilities: access(null) })).resolves.toMatchObject({ signedIn: true, administrator: true, organisation: null });
  });
});

describe('loadAdminFacts while another account is in this tab', () => {
  it('counts a session as signed in only as the address being set up, whatever its own phone and workspace say', async () => {
    const { session, get } = sessionAs('signed-in', phone({ configured: true, verified: true }));
    const admin = createAdminStore();
    receiveHandover(admin, handover);

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), admin, capabilities: access({ organisation: 'Northwind Studio', administrator: false, hasPasskey: true, passkeyRequired: false }) })).resolves.toEqual({ signedIn: false, phoneVerified: false, hasPasskey: false, administrator: true, organisation: null });
    expect(get).not.toHaveBeenCalled();
    expect(stepInsteadOf('welcome', admin, { signedIn: false, phoneVerified: false, hasPasskey: false })).toBe('phone');
  });

  it('matches the address whatever its case', async () => {
    const { session } = sessionAs('signed-in', phone({ configured: true, verified: true }));
    const admin = createAdminStore();
    receiveHandover(admin, { ...handover, email: profile.email.toUpperCase() });

    await expect(loadAdminFacts({ session, queryClient: new QueryClient(), admin, capabilities: access(null) })).resolves.toMatchObject({ signedIn: true, phoneVerified: true });
  });
});

describe('the store between steps', () => {
  it('takes a handover once, and keeps what is underway when the same address arrives again', () => {
    const store = createAdminStore();
    receiveHandover(store, null);
    expect(store.getState().email).toBeNull();

    receiveHandover(store, handover);
    store.dispatch({ type: 'phone-code-sent', country: 'NG', number: '8035550142' });
    receiveHandover(store, handover);
    expect(store.getState()).toMatchObject({ email: handover.email, handedOver: true, challengeToken: 'pc-1', phone: { number: '8035550142' } });
  });

  it('forgets everything on leaving the flow before signing in, and keeps it once signed in', () => {
    const store = createAdminStore();
    receiveHandover(store, handover);
    forgetAdmin(store, sessionAs('signed-in').session);
    expect(store.getState().email).toBeNull();

    receiveHandover(store, { ...handover, email: profile.email });
    forgetAdmin(store, sessionAs('signed-in').session);
    expect(store.getState().email).toBe(profile.email);

    forgetAdmin(store, sessionAs('signed-out').session);
    expect(store.getState().email).toBeNull();
  });

  it('says which step to show instead, sign-in when none can be, or nothing when the step can be shown', () => {
    const store = createAdminStore();
    expect(stepInsteadOf('welcome', store, { signedIn: false, phoneVerified: false, hasPasskey: false })).toBe('sign-in');
    expect(pathOf('sign-in')).toBe('/signin');
    expect(stepInsteadOf('welcome', store, { signedIn: true, phoneVerified: false, hasPasskey: false })).toBe('phone');
    expect(pathOf('phone')).toBe('/admin/phone');
    receiveHandover(store, handover);
    expect(stepInsteadOf('phone', store, { signedIn: false, phoneVerified: false, hasPasskey: false })).toBeNull();
  });
});
