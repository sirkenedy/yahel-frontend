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
});
