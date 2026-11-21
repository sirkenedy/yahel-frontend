import { describe, expect, it, vi } from 'vitest';
import { createAccountCapabilities, maskEmail } from './account-capabilities';
import { createStandIns } from './standins';

const api = () => ({ auth: { forgotPassword: vi.fn().mockResolvedValue({ message: 'ok' }) } }) as unknown as Parameters<typeof createAccountCapabilities>[0] & { auth: { forgotPassword: ReturnType<typeof vi.fn> } };
const instant = async () => undefined;

describe('createAccountCapabilities', () => {
  it('offers only what the backend has when there are no stand-ins', async () => {
    const client = api();
    const capabilities = createAccountCapabilities(client);

    expect(capabilities).toMatchObject({ passkeys: null, textCodes: null, directory: null, helpDesk: null, standIns: [] });
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
    expect([...capabilities.standIns].sort()).toEqual(['directory', 'helpDesk', 'passkeys', 'recoveryByPhone', 'textCodes']);
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
