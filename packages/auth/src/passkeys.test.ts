import { describe, expect, it, vi } from 'vitest';
import { createPasskeyClient } from './passkeys';
import type { PasskeyEnvironment } from './passkeys';

const bytes = (...values: number[]) => new Uint8Array(values).buffer;
const signedIn = { tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900, tokenType: 'Bearer' }, profile: { id: '1', globalId: 'g', email: 'amara@northwind.example', firstName: 'Amara', lastName: null, displayName: null, photo: null } };

const setup = (overrides: Partial<PasskeyEnvironment> = {}, get = vi.fn()) => {
  const ceremony = {
    begin: vi.fn().mockResolvedValue({ challenge: '-_8B', rpId: 'accounts.yahel.example', timeoutMs: 60_000, allowCredentials: [{ id: 'AQID' }], userVerification: 'required' }),
    finish: vi.fn().mockResolvedValue(signedIn),
  };
  const environment: PasskeyEnvironment = { credentials: { get }, supported: true, rpId: 'accounts.yahel.example', ...overrides };
  return { ceremony, get, client: createPasskeyClient(ceremony, environment) };
};

describe('createPasskeyClient', () => {
  it('is offered whenever the browser has WebAuthn, wherever the passkey lives', () => {
    expect(setup().client.isSupported()).toBe(true);
    expect(setup({ supported: false }).client.isSupported()).toBe(false);
    expect(setup({ credentials: undefined }).client.isSupported()).toBe(false);
  });

  it('uses a challenge fetched ahead of the press, once, and asks for a fresh one after that', async () => {
    const credential = { rawId: bytes(1), response: { clientDataJSON: bytes(1), authenticatorData: bytes(1), signature: bytes(1), userHandle: null } };
    const { client, ceremony, get } = setup({}, vi.fn().mockResolvedValue(credential));

    client.prepare('amara@northwind.example');
    expect(ceremony.begin).toHaveBeenCalledTimes(1);

    await client.signIn('amara@northwind.example');
    expect(ceremony.begin).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);

    await client.signIn('amara@northwind.example');
    expect(ceremony.begin).toHaveBeenCalledTimes(2);
  });

  it('does not use a challenge prepared for a different account', async () => {
    const { client, ceremony } = setup({}, vi.fn().mockResolvedValue(null));

    client.prepare();
    await client.signIn('amara@northwind.example');

    expect(ceremony.begin).toHaveBeenLastCalledWith({ email: 'amara@northwind.example', rpId: 'accounts.yahel.example' });
    expect(ceremony.begin).toHaveBeenCalledTimes(2);
  });

  it('asks again when the challenge fetched ahead failed, and prepares nothing where passkeys are unsupported', async () => {
    const { client, ceremony } = setup({}, vi.fn().mockResolvedValue(null));
    ceremony.begin.mockRejectedValueOnce(new Error('offline'));

    client.prepare();
    await expect(client.signIn()).resolves.toEqual({ status: 'cancelled' });
    expect(ceremony.begin).toHaveBeenCalledTimes(2);

    const unsupported = setup({ supported: false });
    unsupported.client.prepare();
    expect(unsupported.ceremony.begin).not.toHaveBeenCalled();
  });

  it('asks the device to sign the server challenge and sends the answer back as base64url', async () => {
    const credential = { rawId: bytes(1, 2, 3), response: { clientDataJSON: bytes(251, 255), authenticatorData: bytes(4), signature: bytes(5, 6), userHandle: bytes(7) } };
    const { client, ceremony, get } = setup({}, vi.fn().mockResolvedValue(credential));

    await expect(client.signIn('amara@northwind.example')).resolves.toEqual({ status: 'signed-in', signedIn });

    expect(ceremony.begin).toHaveBeenCalledWith({ email: 'amara@northwind.example', rpId: 'accounts.yahel.example' });
    const { publicKey } = get.mock.calls[0]![0];
    expect([...publicKey.challenge]).toEqual([251, 255, 1]);
    expect(publicKey).toMatchObject({ rpId: 'accounts.yahel.example', timeout: 60_000, userVerification: 'required' });
    expect([...publicKey.allowCredentials[0].id]).toEqual([1, 2, 3]);
    expect(ceremony.finish).toHaveBeenCalledWith({ credentialId: 'AQID', clientDataJSON: '-_8', authenticatorData: 'BA', signature: 'BQY', userHandle: 'Bw' });
  });

  it('sends a null user handle when the device gives none', async () => {
    const credential = { rawId: bytes(1), response: { clientDataJSON: bytes(1), authenticatorData: bytes(1), signature: bytes(1), userHandle: null } };
    const { client, ceremony } = setup({}, vi.fn().mockResolvedValue(credential));

    await client.signIn();

    expect(ceremony.finish).toHaveBeenCalledWith(expect.objectContaining({ userHandle: null }));
  });

  it.each(['NotAllowedError', 'AbortError'])('treats a dismissed prompt (%s) as cancelled, not as a failure', async (name) => {
    const { client, ceremony } = setup({}, vi.fn().mockRejectedValue(new DOMException('dismissed', name)));

    await expect(client.signIn()).resolves.toEqual({ status: 'cancelled' });
    expect(ceremony.finish).not.toHaveBeenCalled();
  });

  it('treats no credential, or no WebAuthn at all, as cancelled', async () => {
    await expect(setup({}, vi.fn().mockResolvedValue(null)).client.signIn()).resolves.toEqual({ status: 'cancelled' });
    const without = setup({ credentials: undefined });
    await expect(without.client.signIn()).resolves.toEqual({ status: 'cancelled' });
    expect(without.ceremony.begin).not.toHaveBeenCalled();
  });

  it('passes on real failures: a broken device, or a server that refuses the assertion', async () => {
    await expect(setup({}, vi.fn().mockRejectedValue(new DOMException('broken', 'UnknownError'))).client.signIn()).rejects.toMatchObject({ name: 'UnknownError' });

    const credential = { rawId: bytes(1), response: { clientDataJSON: bytes(1), authenticatorData: bytes(1), signature: bytes(1), userHandle: null } };
    const refused = setup({}, vi.fn().mockResolvedValue(credential));
    refused.ceremony.finish.mockRejectedValue(new Error('refused'));
    await expect(refused.client.signIn()).rejects.toThrow('refused');
  });
});
