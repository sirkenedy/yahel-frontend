// STAND-IN. Missing endpoints: POST /v1/auth/passkeys/registration/options (no session) and
// POST /v1/me/passkeys/registration/verify (session). The browser half (WebAuthn) is real and lives in
// @yahel/auth; this plays the server. It hands out a fixed challenge and a fixed user handle, checks
// nothing cryptographic, and refuses an attestation with no attestation object, as a server would refuse
// one it cannot verify.
//
// The real `options` endpoint runs during sign-up, before the account exists. It must take nothing that
// names a person (no address, no name: the device labels the passkey itself) and so can reveal nothing;
// use the server's own relying-party id, ignoring the `rpId` this stand-in echoes; return a fresh random
// user handle and a single-use challenge that lives long enough to finish sign-up (about 30 minutes);
// and be rate limited by caller. The real `verify` endpoint checks the origin and the challenge itself,
// binds the credential and its user handle to the signed-in account, refuses a challenge that has
// been used or has expired, in which case the account simply has no passkey yet, and refuses an attestation
// whose authenticator data lacks the user-verified (UV) flag. The account is emailed whenever a passkey is
// added.
//
// Missing too: POST /v1/me/passkeys/registration/options (session), `beginForAccount`, for someone already
// signed in. It answers with the account's own stable user handle, its existing passkeys in
// `excludeCredentials`, and a challenge bound to the session; it is never the session-less endpoint with a
// fresh handle. For an administrator it registers only what the rules in admin-access.ts allow.
import type { PasskeyRegistration } from '../capabilities';
import { ApiError } from '../errors';
import type { Delay } from './timing';

const CHALLENGE = 'c3RhbmQtaW4tcmVnaXN0cmF0aW9uLTAwMDE';
const USER_HANDLE = 'c3RhbmQtaW4tdXNlci1oYW5kbGU';
const CREDENTIAL = 'c3RhbmQtaW4tY3JlZGVudGlhbA';
const ES256 = -7;
const RS256 = -257;

/** `hasSaved` lets the admin-access stand-in say whether the person now has a passkey, as the real server would know. */
export const createPasskeyRegistrationStandIn = (delay: Delay): PasskeyRegistration & { hasSaved(): boolean } => {
  let saved = false;
  const begin = async ({ rpId }: { rpId: string }) => {
    await delay(350);
    return { challenge: CHALLENGE, rp: { id: rpId, name: 'Yahel' }, userHandle: USER_HANDLE, timeoutMs: 60_000, algorithms: [ES256, RS256] };
  };
  return {
    begin,
    async beginForAccount(input) {
      return { ...(await begin(input)), excludeCredentials: saved ? [CREDENTIAL] : [] };
    },
    async finish(attestation) {
      await delay(500);
      if (!attestation.attestationObject) throw new ApiError({ status: 400, code: 'INVALID_TOKEN', message: 'Passkey could not be verified' });
      saved = true;
    },
    hasSaved: () => saved,
  };
};
