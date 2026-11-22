import type { PasskeyAttestation, PasskeyCreationOptions, PasskeyRegistration } from '@yahel/api-client';
import type { PasskeyEnvironment } from './passkeys';
import { isDismissal, toBase64Url, toBytes } from './webauthn';

/** What creating a passkey needs of the browser: the same as signing in with one, but the means to make a credential. */
export type PasskeyCreationEnvironment = Omit<PasskeyEnvironment, 'credentials'> & { credentials: Pick<CredentialsContainer, 'create'> | undefined };

/** `cancelled` covers dismissing the prompt and a timeout: neither is an error to show. */
export type NewPasskeyResult = { status: 'created'; attestation: PasskeyAttestation } | { status: 'cancelled' };

/** How the device labels the passkey. These stay on the device; the server is not sent them. */
export interface PasskeyOwner {
  /** The address the person will sign in with. */
  address: string;
  name: string;
}

const describeAttestation = (credential: PublicKeyCredential): PasskeyAttestation => {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    credentialId: toBase64Url(credential.rawId),
    clientDataJSON: toBase64Url(response.clientDataJSON),
    attestationObject: toBase64Url(response.attestationObject),
    transports: response.getTransports?.() ?? [],
  };
};

/**
 * The browser half of creating a passkey while an account is being created (WebAuthn). The passkey is made
 * on the device before the account exists and attached to it by `save` once the person is signed in; what
 * is held in between is the passkey's public half, never anything secret.
 */
export function createPasskeyRegistrar(registration: PasskeyRegistration, environment: PasskeyCreationEnvironment) {
  let prepared: Promise<PasskeyCreationOptions> | null = null;
  const begin = () => registration.begin({ rpId: environment.rpId });

  return {
    isSupported() {
      return environment.supported && environment.credentials !== undefined;
    },
    /** Fetches the server's challenge ahead of the press, so `create` can open the prompt inside it. Never throws. */
    prepare() {
      if (!this.isSupported()) return;
      prepared = begin();
      prepared.catch(() => undefined);
    },
    /** Call from a press handler: browsers only show the prompt in response to a user action. */
    async create(owner: PasskeyOwner): Promise<NewPasskeyResult> {
      if (!environment.credentials) return { status: 'cancelled' };
      const ready = prepared;
      prepared = null;
      const options = await (ready ? ready.catch(begin) : begin());
      let credential: Credential | null;
      try {
        credential = await environment.credentials.create({
          publicKey: {
            challenge: toBytes(options.challenge),
            rp: options.rp,
            user: { id: toBytes(options.userHandle), name: owner.address, displayName: owner.name },
            pubKeyCredParams: options.algorithms.map((alg) => ({ type: 'public-key' as const, alg })),
            timeout: options.timeoutMs,
            authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
            attestation: 'none',
          },
        });
      } catch (error) {
        if (isDismissal(error)) return { status: 'cancelled' };
        throw error;
      }
      if (!credential) return { status: 'cancelled' };
      return { status: 'created', attestation: describeAttestation(credential as PublicKeyCredential) };
    },
    /** Attaches a passkey made by `create` to the account that is now signed in. */
    save(attestation: PasskeyAttestation) {
      return registration.finish(attestation);
    },
  };
}

export type PasskeyRegistrar = ReturnType<typeof createPasskeyRegistrar>;
