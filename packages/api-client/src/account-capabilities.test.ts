import { describe, expect, it, vi } from 'vitest';
import { createAccountCapabilities, maskEmail, usableWindow } from './account-capabilities';
import { createStandIns } from './standins';

const api = () => ({ auth: { forgotPassword: vi.fn().mockResolvedValue({ message: 'ok' }) } }) as unknown as Parameters<typeof createAccountCapabilities>[0] & { auth: { forgotPassword: ReturnType<typeof vi.fn> } };
const instant = async () => undefined;

describe('createAccountCapabilities', () => {
  it('offers only what the backend has when there are no stand-ins', async () => {
    const client = api();
    const capabilities = createAccountCapabilities(client);

    expect(capabilities).toMatchObject({ passkeys: null, textCodes: null, directory: null, helpDesk: null, passkeyRegistration: null, addresses: null, trustedContacts: null, preferences: null, serviceStatus: null, domainMarket: null, domainClaims: null, workspaceBilling: null, adminAccess: null, standIns: [] });
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
    expect(capabilities.directory).toBe(standIns.directory);
    expect(capabilities.helpDesk).toBe(standIns.helpDesk);
    expect(capabilities.passkeyRegistration).toBe(standIns.passkeyRegistration);
    expect(capabilities.addresses).toBe(standIns.addresses);
    expect(capabilities.trustedContacts).toBe(standIns.trustedContacts);
    expect(capabilities.preferences).toBe(standIns.preferences);
    await expect(capabilities.serviceStatus!.window()).resolves.toEqual(await standIns.serviceStatus.window());
    expect([...capabilities.standIns].sort()).toEqual(['addresses', 'adminAccess', 'directory', 'domainClaims', 'domainMarket', 'helpDesk', 'passkeyRegistration', 'passkeys', 'preferences', 'recoveryByPhone', 'serviceStatus', 'textCodes', 'trustedContacts', 'workspaceBilling']);
    expect(capabilities).toMatchObject({ domainMarket: standIns.domainMarket, domainClaims: standIns.domainClaims, workspaceBilling: standIns.workspaceBilling, adminAccess: standIns.adminAccess });
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

    await expect(createAccountCapabilities({ auth: {} as never }, standIns).serviceStatus!.window()).resolves.toBeNull();
  });
});
