import { describe, expect, it } from 'vitest';
import { createStandIns, demoAccounts, demoProfile } from './index';

const instant = async () => undefined;
const assertion = { credentialId: 'id', clientDataJSON: 'c', authenticatorData: 'a', signature: 's', userHandle: null };

describe('stand-ins', () => {
  it('passkeys: hands out a challenge for the asking site and signs in the demo person', async () => {
    const { passkeys } = createStandIns(instant);

    const options = await passkeys.begin({ rpId: 'accounts.yahel.example' });
    expect(options).toMatchObject({ rpId: 'accounts.yahel.example', allowCredentials: [], userVerification: 'required' });
    expect(options.challenge).toMatch(/^[A-Za-z0-9_-]+$/);

    await expect(passkeys.finish(assertion)).resolves.toMatchObject({ profile: demoProfile, tokens: { tokenType: 'Bearer' } });
  });

  it('passkeys: refuses an assertion it could not verify', async () => {
    const { passkeys } = createStandIns(instant);

    await expect(passkeys.finish({ ...assertion, signature: '' })).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('text codes: names a masked number, then refuses the fourth request', async () => {
    const { textCodes } = createStandIns(instant);

    for (let attempt = 0; attempt < 3; attempt += 1) await expect(textCodes.send('challenge')).resolves.toEqual({ destination: '+234 ••• ••• ••42' });
    await expect(textCodes.send('challenge')).rejects.toMatchObject({ status: 429 });
  });

  it('directory: starts with the demo accounts, remembers the latest first and removes', async () => {
    const { directory } = createStandIns(instant);
    expect(await directory.list()).toEqual(demoAccounts);

    await directory.remember({ name: 'Kofi Mensah', email: 'kofi@northwind.example', kind: 'person', signedOut: true });
    await directory.remember({ ...demoAccounts[1]!, signedOut: true });
    expect((await directory.list()).map((account) => account.email)).toEqual(['amara@northwind.example', 'kofi@northwind.example', 'amara.okafor@yahel.example']);

    await directory.remove('kofi@northwind.example');
    expect(await directory.list()).toHaveLength(2);
    await expect(directory.remove('kofi@northwind.example')).rejects.toMatchObject({ status: 404 });
  });

  it('recovery by phone: offers every address the same masked number', async () => {
    const { recoveryByPhone } = createStandIns(instant);

    const known = await recoveryByPhone.options('amara@northwind.example');
    const unknown = await recoveryByPhone.options('nobody@nowhere.example');
    expect(known).toEqual([{ method: 'phone', destination: '+234 ••• ••• ••42' }]);
    expect(unknown).toEqual(known);

    for (let attempt = 0; attempt < 3; attempt += 1) await recoveryByPhone.send('amara@northwind.example', 'phone');
    await expect(recoveryByPhone.send('amara@northwind.example', 'phone')).rejects.toMatchObject({ status: 429 });
  });

  it('help desk: accepts a request, then refuses the fourth', async () => {
    const { helpDesk } = createStandIns(instant);

    for (let attempt = 0; attempt < 3; attempt += 1) await expect(helpDesk.request({ contact: 'amara@northwind.example' })).resolves.toBeUndefined();
    await expect(helpDesk.request({ contact: 'amara@northwind.example' })).rejects.toMatchObject({ status: 429 });
  });

  it('keeps separate state per set, so one page session cannot exhaust another', async () => {
    const first = createStandIns(instant);
    for (let attempt = 0; attempt < 3; attempt += 1) await first.helpDesk.request({ contact: 'a@b.example' });

    await expect(createStandIns(instant).helpDesk.request({ contact: 'a@b.example' })).resolves.toBeUndefined();
  });

  it('passkey registration: hands out a challenge without being told who is asking, and accepts the new passkey', async () => {
    const { passkeyRegistration } = createStandIns(instant);

    const options = await passkeyRegistration.begin({ rpId: 'accounts.yahel.example' });

    expect(options).toMatchObject({ rp: { id: 'accounts.yahel.example', name: 'Yahel' }, algorithms: [-7, -257] });
    expect(options.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(options.userHandle).toMatch(/^[A-Za-z0-9_-]+$/);
    await expect(passkeyRegistration.finish({ credentialId: 'id', clientDataJSON: 'c', attestationObject: 'a', transports: ['internal'] })).resolves.toBeUndefined();
  });

  it('passkey registration: refuses an attestation it could not verify', async () => {
    const { passkeyRegistration } = createStandIns(instant);

    await expect(passkeyRegistration.finish({ credentialId: 'id', clientDataJSON: 'c', attestationObject: '', transports: [] })).rejects.toMatchObject({ status: 400 });
  });

  it('addresses: says only whether a name is free, and offers free names like it', async () => {
    const { addresses } = createStandIns(instant);

    expect(await addresses.check('amara.okafor')).toEqual({ available: true, alternatives: ['okafor.amara', 'amaraokafor', 'amara.okafor1'] });
    expect(await addresses.check('amara')).toEqual({ available: false, alternatives: ['amara.mail', 'amara1', 'hello.amara'] });
    expect(await addresses.check('chidi.eze')).toMatchObject({ available: true });
    expect(Object.keys(await addresses.check('admin')).sort()).toEqual(['alternatives', 'available']);
    expect((await addresses.check('okafor')).alternatives).not.toContain('okafor');
  });

  it('addresses: stops a check that was cancelled, and refuses the forty-first', async () => {
    const { addresses } = createStandIns(instant);
    const cancelled = new AbortController();
    cancelled.abort();

    await expect(addresses.check('chidi.eze', cancelled.signal)).rejects.toMatchObject({ name: 'AbortError' });
    for (let attempt = 0; attempt < 40; attempt += 1) await addresses.check('chidi.eze');
    await expect(addresses.check('chidi.eze')).rejects.toMatchObject({ status: 429 });
  });

  it('trusted contacts: accepts an invitation, then refuses the fourth', async () => {
    const { trustedContacts } = createStandIns(instant);

    for (let attempt = 0; attempt < 3; attempt += 1) await expect(trustedContacts.invite('chidi.eze@personal.example')).resolves.toBeUndefined();
    await expect(trustedContacts.invite('chidi.eze@personal.example')).rejects.toMatchObject({ status: 429 });
  });

  it('preferences: keeps the choices it was given', async () => {
    const { preferences } = createStandIns(instant);

    await expect(preferences.save({ productNews: true, activityHistory: false })).resolves.toBeUndefined();
  });

  it('service status: announces a two-hour window that is under way', async () => {
    const { createServiceStatusStandIn } = await import('./service-status');
    const now = Date.parse('2026-11-22T01:40:00.000Z');

    await expect(createServiceStatusStandIn(instant, () => now).window()).resolves.toEqual({ from: '2026-11-22T00:00:00.000Z', until: '2026-11-22T02:00:00.000Z' });
  });
});
