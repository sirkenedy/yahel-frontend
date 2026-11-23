import type { PasskeyAttestation, PasskeyCreationOptions, PasskeyRegistration } from '@yahel/api-client';
import type { PasskeyEnvironment } from './passkeys';
import { isDismissal, toBase64Url, toBytes } from './webauthn';

/** What creating a passkey needs of the browser: the same as signing in with one, but the means to make a credential. */
export type PasskeyCreationEnvironment = Omit<PasskeyEnvironment, 'credentials'> & { credentials: Pick<CredentialsContainer, 'create'> | undefined };

/**
 * `cancelled` covers dismissing the prompt and a timeout: neither is an error to show. `unprepared`: no
 * challenge was ready at the press, so no prompt opened; one is being fetched for the next press.
 */
export type NewPasskeyResult = { status: 'created'; attestation: PasskeyAttestation } | { status: 'cancelled' } | { status: 'unprepared' };

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
  let ready: PasskeyCreationOptions | null = null;
  let latest: Promise<void> | null = null;
  let forAccount = false;

  const registrar = {
    isSupported() {
      return environment.supported && environment.credentials !== undefined;
    },
    /**
     * Fetches the server's challenge ahead of the press, so `create` can open the prompt inside it, replacing
     * any fetched before. `account` asks for someone signed in (`beginForAccount`); a later fetch asks the
     * same way. Settles once a challenge is ready or could not be had; never rejects.
     */
    prepare(account = forAccount): Promise<void> {
      if (!registrar.isSupported()) return Promise.resolve();
      forAccount = account;
      ready = null;
      const input = { rpId: environment.rpId };
      const fetching: Promise<void> = (account ? registration.beginForAccount(input) : registration.begin(input)).then(
        (options) => {
          if (latest === fetching) ready = options;
        },
        () => undefined,
      );
      latest = fetching;
      return fetching;
    },
    /**
     * Call from a press handler: browsers only show the prompt in response to a user action, so it opens at
     * once with the challenge prepared ahead, never after waiting for one. A challenge is used once; the
     * next is fetched as soon as this one is taken, so a retry has one ready.
     */
    async create(owner: PasskeyOwner): Promise<NewPasskeyResult> {
      if (!environment.credentials) return { status: 'cancelled' };
      const options = ready;
      void registrar.prepare();
      if (!options) return { status: 'unprepared' };
      let credential: Credential | null;
      try {
        credential = await environment.credentials.create({
          publicKey: {
            challenge: toBytes(options.challenge),
            rp: options.rp,
            user: { id: toBytes(options.userHandle), name: owner.address, displayName: owner.name },
            pubKeyCredParams: options.algorithms.map((alg) => ({ type: 'public-key' as const, alg })),
            excludeCredentials: options.excludeCredentials?.map((id) => ({ type: 'public-key' as const, id: toBytes(id) })),
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
  return registrar;
}

export type PasskeyRegistrar = ReturnType<typeof createPasskeyRegistrar>;
