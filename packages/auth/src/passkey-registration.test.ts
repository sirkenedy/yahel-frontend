import type { PasskeyRegistration } from '@yahel/api-client';
import { describe, expect, it, vi } from 'vitest';
import { createPasskeyRegistrar } from './passkey-registration';

const options = { challenge: 'AQID', rp: { id: 'accounts.yahel.example', name: 'Yahel' }, userHandle: 'BAUG', timeoutMs: 60_000, algorithms: [-7, -257] };
const bytes = (...values: number[]) => new Uint8Array(values).buffer;
const credential = { rawId: bytes(1, 2, 3), response: { clientDataJSON: bytes(4), attestationObject: bytes(5, 6), getTransports: () => ['internal'] } };
const owner = { address: 'amara.okafor@yahel.example', name: 'Amara Okafor' };

const setup = ({ create = vi.fn().mockResolvedValue(credential), supported = true } = {}) => {
  const registration = { begin: vi.fn().mockResolvedValue(options), finish: vi.fn().mockResolvedValue(undefined) } satisfies PasskeyRegistration;
  const registrar = createPasskeyRegistrar(registration, { credentials: { create }, supported, rpId: 'accounts.yahel.example' });
  return { registration, registrar, create };
};

describe('createPasskeyRegistrar', () => {
  it('is supported only where the browser has WebAuthn', () => {
    expect(setup().registrar.isSupported()).toBe(true);
    expect(setup({ supported: false }).registrar.isSupported()).toBe(false);
    expect(createPasskeyRegistrar({ begin: vi.fn(), finish: vi.fn() }, { credentials: undefined, supported: true, rpId: 'x' }).isSupported()).toBe(false);
  });

  it('asks the device for a passkey that verifies the person, labelled with their address, and describes it as text', async () => {
    const { registrar, registration, create } = setup();

    const result = await registrar.create(owner);

    expect(registration.begin).toHaveBeenCalledWith({ rpId: 'accounts.yahel.example' });
    const { publicKey } = create.mock.calls[0]![0];
    expect([...new Uint8Array(publicKey.challenge)]).toEqual([1, 2, 3]);
    expect(publicKey).toMatchObject({
      rp: options.rp,
      user: { name: owner.address, displayName: owner.name },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      attestation: 'none',
    });
    expect([...new Uint8Array(publicKey.user.id)]).toEqual([4, 5, 6]);
    expect(result).toEqual({ status: 'created', attestation: { credentialId: 'AQID', clientDataJSON: 'BA', attestationObject: 'BQY', transports: ['internal'] } });
  });

  it('tells the server nothing about the person before the account exists', async () => {
    const { registrar, registration } = setup();

    await registrar.create(owner);

    expect(JSON.stringify(registration.begin.mock.calls)).not.toMatch(/amara|Okafor/i);
  });

  it('uses the challenge fetched ahead of the press, once', async () => {
    const { registrar, registration } = setup();

    registrar.prepare();
    await registrar.create(owner);
    expect(registration.begin).toHaveBeenCalledTimes(1);

    await registrar.create(owner);
    expect(registration.begin).toHaveBeenCalledTimes(2);
  });

  it('asks again when the challenge fetched ahead could not be had', async () => {
    const { registrar, registration } = setup();
    registration.begin.mockRejectedValueOnce(new Error('offline'));

    registrar.prepare();

    await expect(registrar.create(owner)).resolves.toMatchObject({ status: 'created' });
    expect(registration.begin).toHaveBeenCalledTimes(2);
  });

  it('does not prepare where passkeys are not supported', () => {
    const { registrar, registration } = setup({ supported: false });

    registrar.prepare();

    expect(registration.begin).not.toHaveBeenCalled();
  });

  it.each(['NotAllowedError', 'AbortError'])('treats a closed prompt (%s) as cancelled, not as a failure', async (name) => {
    const { registrar } = setup({ create: vi.fn().mockRejectedValue(new DOMException('dismissed', name)) });

    await expect(registrar.create(owner)).resolves.toEqual({ status: 'cancelled' });
  });

  it('treats a device that returns nothing as cancelled, and lets a real failure through', async () => {
    await expect(setup({ create: vi.fn().mockResolvedValue(null) }).registrar.create(owner)).resolves.toEqual({ status: 'cancelled' });
    await expect(setup({ create: vi.fn().mockRejectedValue(new DOMException('broken', 'InvalidStateError')) }).registrar.create(owner)).rejects.toMatchObject({ name: 'InvalidStateError' });
  });

  it('copes with a browser that cannot say how the passkey travels', async () => {
    const { registrar } = setup({ create: vi.fn().mockResolvedValue({ ...credential, response: { ...credential.response, getTransports: undefined } }) });

    await expect(registrar.create(owner)).resolves.toMatchObject({ attestation: { transports: [] } });
  });

  it('attaches the passkey to the account through the server', async () => {
    const { registrar, registration } = setup();
    const attestation = { credentialId: 'AQID', clientDataJSON: 'BA', attestationObject: 'BQY', transports: [] };

    await registrar.save(attestation);

    expect(registration.finish).toHaveBeenCalledWith(attestation);
  });
});
