import { describe, expect, it, vi } from 'vitest';
import { adminAccessOf, createAccountCapabilities, maskEmail, usableWindow } from './account-capabilities';
import type { ApiClient } from './client';
import type { AuthContext } from './types';
import { createStandIns } from './standins';

const api = () =>
  ({
    auth: { forgotPassword: vi.fn().mockResolvedValue({ message: 'ok' }), accounts: vi.fn().mockResolvedValue([]), removeAccount: vi.fn().mockResolvedValue({ handle: 'h-1' }) },
    tenants: { checkDomainClaim: vi.fn().mockResolvedValue({ standing: 'claimed' }) },
  }) as unknown as Parameters<typeof createAccountCapabilities>[0] & {
    auth: { forgotPassword: ReturnType<typeof vi.fn>; accounts: ReturnType<typeof vi.fn>; removeAccount: ReturnType<typeof vi.fn> };
    tenants: { checkDomainClaim: ReturnType<typeof vi.fn> };
  };
const instant = async () => undefined;

describe('createAccountCapabilities', () => {
  it('offers only what the backend has when there are no stand-ins', async () => {
    const client = api();
    const capabilities = createAccountCapabilities(client);

    expect(capabilities).toMatchObject({ passkeys: null, textCodes: null, helpDesk: null, passkeyRegistration: null, preferences: null, serviceStatus: null, domainMarket: null, workspaceBilling: null, standIns: [] });
    expect(capabilities.addresses).not.toBeNull();
    expect(capabilities.trustedContacts).not.toBeNull();
    expect(await capabilities.recovery.options('amara@northwind.example')).toEqual([{ method: 'email', destination: 'a•••@northwind.example' }]);

    await capabilities.recovery.send('amara@northwind.example', 'email');
    expect(client.auth.forgotPassword).toHaveBeenCalledWith({ email: 'amara@northwind.example' });
  });

  it('adds the stand-ins and names each one when they are passed in', async () => {
    const client = api();
    const standIns = createStandIns(instant);
    const capabilities = createAccountCapabilities(client, standIns);

    expect(capabilities.passkeys).toBe(standIns.passkeys);
    expect(capabilities.textCodes).toBe(standIns.textCodes);
    expect(capabilities.helpDesk).toBe(standIns.helpDesk);
    expect(capabilities.passkeyRegistration).toBe(standIns.passkeyRegistration);
    expect(capabilities.preferences).toBe(standIns.preferences);
    await expect(capabilities.serviceStatus!.window()).resolves.toEqual(await standIns.serviceStatus.window());
    expect([...capabilities.standIns].sort()).toEqual(['domainMarket', 'helpDesk', 'passkeyRegistration', 'passkeys', 'preferences', 'recoveryByPhone', 'serviceStatus', 'textCodes', 'workspaceBilling']);
    expect(capabilities).toMatchObject({ domainMarket: standIns.domainMarket, workspaceBilling: standIns.workspaceBilling });
  });

  it('sends an emailed reset code through the real endpoint even with stand-ins, and a texted one through the stand-in', async () => {
    const client = api();
    const capabilities = createAccountCapabilities(client, createStandIns(instant));

    expect((await capabilities.recovery.options('amara@northwind.example')).map((option) => option.method)).toEqual(['phone', 'email']);

    await capabilities.recovery.send('amara@northwind.example', 'phone');
    expect(client.auth.forgotPassword).not.toHaveBeenCalled();

    await capabilities.recovery.send('amara@northwind.example', 'email');
    expect(client.auth.forgotPassword).toHaveBeenCalledTimes(1);
  });

  it('asks the backend whether a domain can be claimed, in every build', async () => {
    for (const standIns of [undefined, createStandIns(instant)]) {
      const client = api();
      const { domainClaims } = createAccountCapabilities(client, standIns);

      await expect(domainClaims.check('northwind.example')).resolves.toBe('claimed');
      expect(client.tenants.checkDomainClaim).toHaveBeenCalledWith({ domain: 'northwind.example' });
    }
  });

  it('lists the accounts on this browser and removes one by its handle, in every build', async () => {
    for (const standIns of [undefined, createStandIns(instant)]) {
      const client = api();
      const { directory } = createAccountCapabilities(client, standIns);

      await expect(directory.list()).resolves.toEqual([]);
      await expect(directory.remove('h-1')).resolves.toBeUndefined();
      expect(client.auth.removeAccount).toHaveBeenCalledWith('h-1');
    }
  });

  describe('admin access, from the session’s contexts and passkeys', () => {
    const context = (overrides: Partial<AuthContext>): AuthContext => ({ type: 'tenant', tenantId: 't-1', displayName: 'Northwind Studio', logoUrl: null, role: 'OWNER', isCurrent: true, ...overrides });
    const accessWith = (contexts: AuthContext[], passkeys: unknown[]) => {
      const client = { auth: { contexts: vi.fn().mockResolvedValue(contexts), passkeys: { list: vi.fn().mockResolvedValue(passkeys) } } } as unknown as Pick<ApiClient, 'auth'>;
      return adminAccessOf(client);
    };

    it('names the current workspace and whether its owner or admin has a passkey', async () => {
      await expect(accessWith([context({ type: 'personal', tenantId: null, displayName: null, role: null, isCurrent: false }), context({})], []).membership()).resolves.toEqual({ organisation: 'Northwind Studio', administrator: true, hasPasskey: false, passkeyRequired: false });
      await expect(accessWith([context({ role: 'ADMIN' })], [{ credentialId: 'c-1' }]).membership()).resolves.toMatchObject({ administrator: true, hasPasskey: true });
      await expect(accessWith([context({ role: 'MEMBER' })], []).membership()).resolves.toMatchObject({ administrator: false });
    });

    it('answers null for a session in no workspace', async () => {
      await expect(accessWith([context({ type: 'personal', tenantId: null, isCurrent: true }), context({ isCurrent: false })], []).membership()).resolves.toBeNull();
    });
  });

  it('masks an address using only what was typed', () => {
    expect(maskEmail(' amara@northwind.example ')).toBe('a•••@northwind.example');
  });
});

describe('usableWindow', () => {
  const now = Date.parse('2026-11-22T10:00:00.000Z');
  const at = (hours: number) => new Date(now + hours * 3_600_000).toISOString();

  it('passes on a window in progress or still to come', () => {
    expect(usableWindow({ from: at(-1), until: at(1) }, now)).toEqual({ from: at(-1), until: at(1) });
    expect(usableWindow({ from: at(2), until: at(4) }, now)).toEqual({ from: at(2), until: at(4) });
  });

  it.each([
    ['no window', null],
    ['times that are not times', { from: 'soon', until: 'later' }],
    ['an end that is not a time', { from: at(-1), until: '' }],
    ['an end before its start', { from: at(2), until: at(1) }],
    ['a window already over', { from: at(-3), until: at(-1) }],
    ['an end absurdly far off', { from: at(-1), until: at(24 * 400) }],
  ])('treats %s as no window', (_, window) => {
    expect(usableWindow(window, now)).toBeNull();
  });

  it('checks whatever answers the capability, so a bad window never reaches a screen', async () => {
    const standIns = { ...createStandIns(async () => undefined), serviceStatus: { window: async () => ({ from: 'x', until: 'y' }) } };

    await expect(createAccountCapabilities({ auth: {} as never, me: {} as never, tenants: {} as never }, standIns).serviceStatus!.window()).resolves.toBeNull();
  });
});
