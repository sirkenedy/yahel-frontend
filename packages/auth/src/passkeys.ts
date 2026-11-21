import type { PasskeyAssertion, PasskeyCeremony, SignedIn } from '@yahel/api-client';

/** The parts of the browser a passkey sign-in needs, passed in so they can be replaced in tests. */
export interface PasskeyEnvironment {
  credentials: Pick<CredentialsContainer, 'get'> | undefined;
  /** Resolves true when the device has a built-in authenticator: fingerprint, face or screen lock. */
  platformAuthenticatorAvailable: (() => Promise<boolean>) | undefined;
  /** The site the passkey belongs to: this page's host name. */
  rpId: string;
}

/** `cancelled` covers dismissing the prompt, a timeout and a device with no passkey for this site: none is an error to show. */
export type PasskeyResult = { status: 'signed-in'; signedIn: SignedIn } | { status: 'cancelled' };

const toBytes = (base64url: string) => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

const toBase64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const isDismissal = (error: unknown) => error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError');

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
  return {
    /** Passkey sign-in is offered only when this resolves true. Never throws. */
    async isAvailable() {
      if (!environment.credentials || !environment.platformAuthenticatorAvailable) return false;
      return environment.platformAuthenticatorAvailable().catch(() => false);
    },

    /** Call from a press handler: browsers only show the prompt in response to a user action. */
    async signIn(email?: string): Promise<PasskeyResult> {
      if (!environment.credentials) return { status: 'cancelled' };
      const options = await ceremony.begin({ email, rpId: environment.rpId });
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

export const browserPasskeyEnvironment = (): PasskeyEnvironment => ({
  credentials: window.navigator.credentials,
  platformAuthenticatorAvailable: window.PublicKeyCredential ? () => window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() : undefined,
  rpId: window.location.hostname,
});
