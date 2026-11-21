import type { PasskeyAssertion, PasskeyAssertionOptions, PasskeyCeremony, SignedIn } from '@yahel/api-client';
import { isDismissal, toBase64Url, toBytes } from './webauthn';

/** The parts of the browser a passkey sign-in needs, passed in so they can be replaced in tests. */
export interface PasskeyEnvironment {
  credentials: Pick<CredentialsContainer, 'get'> | undefined;
  /** Whether the browser has WebAuthn at all. The passkey itself may be on this device, a phone or a security key. */
  supported: boolean;
  /** The site the passkey belongs to: this page's host name. */
  rpId: string;
}

/** `cancelled` covers dismissing the prompt, a timeout and a device with no passkey for this site: none is an error to show. */
export type PasskeyResult = { status: 'signed-in'; signedIn: SignedIn } | { status: 'cancelled' };


const describeAssertion = (credential: PublicKeyCredential): PasskeyAssertion => {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    credentialId: toBase64Url(credential.rawId),
    clientDataJSON: toBase64Url(response.clientDataJSON),
    authenticatorData: toBase64Url(response.authenticatorData),
    signature: toBase64Url(response.signature),
    userHandle: response.userHandle ? toBase64Url(response.userHandle) : null,
  };
};

/** The browser half of signing in with a passkey (WebAuthn). The server half is the ceremony. */
export function createPasskeyClient(ceremony: PasskeyCeremony, environment: PasskeyEnvironment) {
  let prepared: { email: string | undefined; options: Promise<PasskeyAssertionOptions> } | null = null;
  const begin = (email: string | undefined) => ceremony.begin({ email, rpId: environment.rpId });

  return {
    /** Passkey sign-in is offered only when this is true. */
    isSupported() {
      return environment.supported && environment.credentials !== undefined;
    },

    /**
     * Fetches the server's challenge ahead of the press, so that `signIn` can open the browser prompt
     * without a network round trip in between: some browsers only allow the prompt inside the press itself.
     * Never throws; if it fails, `signIn` asks again.
     */
    prepare(email?: string) {
      if (!this.isSupported()) return;
      const options = begin(email);
      options.catch(() => undefined);
      prepared = { email, options };
    },

    /** Call from a press handler: browsers only show the prompt in response to a user action. */
    async signIn(email?: string): Promise<PasskeyResult> {
      if (!environment.credentials) return { status: 'cancelled' };
      // A challenge is used once. One fetched ahead for this account is taken; anything else is asked for now.
      const ready = prepared && prepared.email === email ? prepared.options : null;
      prepared = null;
      const options = await (ready ? ready.catch(() => begin(email)) : begin(email));
      let credential: Credential | null;
      try {
        credential = await environment.credentials.get({
          publicKey: {
            challenge: toBytes(options.challenge),
            rpId: options.rpId,
            timeout: options.timeoutMs,
            userVerification: options.userVerification,
            allowCredentials: options.allowCredentials.map(({ id }) => ({ type: 'public-key' as const, id: toBytes(id) })),
          },
        });
      } catch (error) {
        if (isDismissal(error)) return { status: 'cancelled' };
        throw error;
      }
      if (!credential) return { status: 'cancelled' };
      return { status: 'signed-in', signedIn: await ceremony.finish(describeAssertion(credential as PublicKeyCredential)) };
    },
  };
}

export type PasskeyClient = ReturnType<typeof createPasskeyClient>;

export const browserPasskeyEnvironment = () => ({
  credentials: window.navigator.credentials,
  supported: Boolean(window.PublicKeyCredential),
  rpId: window.location.hostname,
});
