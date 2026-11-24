import type { PasskeyRegistration } from '@yahel/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPasskeyRegistrar } from './passkey-registration';

const options = { challengeToken: 'pk-1', challenge: 'AQID', rp: { id: 'accounts.yahel.example', name: 'Yahel' }, userHandle: 'BAUG', timeoutMs: 60_000, algorithms: [-7, -257], excludeCredentials: ['AQID'] };
const bytes = (...values: number[]) => new Uint8Array(values).buffer;
const credential = { rawId: bytes(1, 2, 3), response: { clientDataJSON: bytes(4), attestationObject: bytes(5, 6), getTransports: () => ['internal'] } };
const owner = { address: 'amara.okafor@yahel.example', name: 'Amara Okafor' };

const setup = ({ create = vi.fn().mockResolvedValue(credential), supported = true } = {}) => {
  const registration = { beginForAccount: vi.fn().mockResolvedValue(options), finish: vi.fn().mockResolvedValue(undefined) } satisfies PasskeyRegistration;
  const registrar = createPasskeyRegistrar(registration, { credentials: { create }, supported });
  return { registration, registrar, create };
};

describe('createPasskeyRegistrar', () => {
  afterEach(() => vi.useRealTimers());

  it('is supported only where the browser has WebAuthn', () => {
    expect(setup().registrar.isSupported()).toBe(true);
    expect(setup({ supported: false }).registrar.isSupported()).toBe(false);
    expect(createPasskeyRegistrar({ beginForAccount: vi.fn(), finish: vi.fn() }, { credentials: undefined, supported: true }).isSupported()).toBe(false);
  });

  it('asks the device for a passkey that verifies the person, labelled with their address, excluding the account’s own, and describes it as text', async () => {
    const { registrar, create } = setup();

    await registrar.prepare();
    const result = await registrar.create(owner);

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
    expect(publicKey.excludeCredentials[0].type).toBe('public-key');
    expect([...new Uint8Array(publicKey.excludeCredentials[0].id)]).toEqual([1, 2, 3]);
    expect(result).toEqual({ status: 'created', challengeToken: 'pk-1', attestation: { credentialId: 'AQID', clientDataJSON: 'BA', attestationObject: 'BQY', transports: ['internal'] } });
  });

  it('uses the challenge fetched ahead of the press once, and fetches the next as soon as it is taken', async () => {
    const { registrar, registration, create } = setup();

    await registrar.prepare();
    await registrar.create(owner);
    expect(registration.beginForAccount).toHaveBeenCalledTimes(2);

    // A retry opens the prompt straight away with the challenge fetched after the first was taken.
    await Promise.resolve();
    await expect(registrar.create(owner)).resolves.toMatchObject({ status: 'created' });
    expect(create).toHaveBeenCalledTimes(2);
    expect(registration.beginForAccount).toHaveBeenCalledTimes(3);
  });

  it('does not use a challenge the server will have forgotten: unprepared, and a fresh one is fetched', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { registrar, registration, create } = setup();

    await registrar.prepare();
    vi.setSystemTime(Date.now() + 51_000);

    await expect(registrar.create(owner)).resolves.toEqual({ status: 'unprepared' });
    expect(create).not.toHaveBeenCalled();
    expect(registration.beginForAccount).toHaveBeenCalledTimes(2);
  });

  it('opens no prompt when no challenge is ready at the press, says so, and fetches one for the next press', async () => {
    const { registrar, registration, create } = setup();
    let answer: (value: typeof options) => void = () => undefined;
    registration.beginForAccount.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));

    void registrar.prepare();
    await expect(registrar.create(owner)).resolves.toEqual({ status: 'unprepared' });
    expect(create).not.toHaveBeenCalled();
    answer(options);

    await vi.waitFor(() => expect(registration.beginForAccount).toHaveBeenCalledTimes(2));
    await Promise.resolve();
    await expect(registrar.create(owner)).resolves.toMatchObject({ status: 'created' });
  });

  it('says it is unprepared when the challenge fetched ahead could not be had, and asks again', async () => {
    const { registrar, registration, create } = setup();
    registration.beginForAccount.mockRejectedValueOnce(new Error('offline'));

    await registrar.prepare();

    await expect(registrar.create(owner)).resolves.toEqual({ status: 'unprepared' });
    expect(create).not.toHaveBeenCalled();
    expect(registration.beginForAccount).toHaveBeenCalledTimes(2);
  });

  it('does not prepare where passkeys are not supported', () => {
    const { registrar, registration } = setup({ supported: false });

    void registrar.prepare();

    expect(registration.beginForAccount).not.toHaveBeenCalled();
  });

  it.each(['NotAllowedError', 'AbortError'])('treats a closed prompt (%s) as cancelled, not as a failure', async (name) => {
    const { registrar } = setup({ create: vi.fn().mockRejectedValue(new DOMException('dismissed', name)) });
    await registrar.prepare();

    await expect(registrar.create(owner)).resolves.toEqual({ status: 'cancelled' });
  });

  it('treats a device that returns nothing as cancelled, and lets a real failure through', async () => {
    const nothing = setup({ create: vi.fn().mockResolvedValue(null) }).registrar;
    await nothing.prepare();
    await expect(nothing.create(owner)).resolves.toEqual({ status: 'cancelled' });
    const broken = setup({ create: vi.fn().mockRejectedValue(new DOMException('broken', 'InvalidStateError')) }).registrar;
    await broken.prepare();
    await expect(broken.create(owner)).rejects.toMatchObject({ name: 'InvalidStateError' });
  });

  it('copes with a browser that cannot say how the passkey travels', async () => {
    const { registrar } = setup({ create: vi.fn().mockResolvedValue({ ...credential, response: { ...credential.response, getTransports: undefined } }) });
    await registrar.prepare();

    await expect(registrar.create(owner)).resolves.toMatchObject({ attestation: { transports: [] } });
  });

  it('attaches the passkey to the account through the server, with the challenge it answers', async () => {
    const { registrar, registration } = setup();
    const attestation = { credentialId: 'AQID', clientDataJSON: 'BA', attestationObject: 'BQY', transports: [] };

    await registrar.save({ attestation, challengeToken: 'pk-1' });

    expect(registration.finish).toHaveBeenCalledWith('pk-1', attestation);
  });
});
