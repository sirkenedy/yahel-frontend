// STAND-IN. Missing endpoints: POST /v1/auth/passkeys/assertion/options and POST /v1/auth/passkeys/assertion/verify.
// The browser half (WebAuthn) is real and lives in @yahel/auth; this plays the server. It hands out a fixed
// challenge, checks nothing cryptographic, and signs in the demo person. An assertion with an empty
// signature is refused, as a server would refuse one it cannot verify.
//
// The real endpoints must use the server's own relying-party id and check the origin themselves, ignoring
// the `rpId` this stand-in echoes back; return the same (empty) `allowCredentials` for every address,
// with or without an account; issue single-use, short-lived challenges; and in `finish`, give the account a
// slot in this browser and set its refresh cookie, as /auth/login does. This stand-in sets no cookie, so its
// session lasts until the access token is refused.
import type { PasskeyCeremony } from '../capabilities';
import { ApiError } from '../errors';
import { demoProfile } from './demo-data';
import type { Delay } from './timing';

const CHALLENGE = 'c3RhbmQtaW4tY2hhbGxlbmdlLTAwMDE';

export const createPasskeyStandIn = (delay: Delay): PasskeyCeremony => ({
  async begin({ rpId }) {
    await delay(350);
    return { challenge: CHALLENGE, rpId, timeoutMs: 60_000, allowCredentials: [], userVerification: 'required' };
  },
  async finish(assertion) {
    await delay(600);
    if (!assertion.signature) throw new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Passkey not recognised' });
    return { tokens: { accessToken: 'stand-in-access', expiresIn: 900, tokenType: 'Bearer', slot: 0, handle: 'stand-in-handle' }, profile: demoProfile };
  },
});
