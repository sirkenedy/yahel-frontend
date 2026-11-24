import type { PasskeyAttestation, PasskeyCreationOptions, PasskeyRegistration } from '@yahel/api-client';
import type { PasskeyEnvironment } from './passkeys';
import { isDismissal, toBase64Url, toBytes } from './webauthn';

/** What creating a passkey needs of the browser: the same as signing in with one, but the means to make a credential. */
export type PasskeyCreationEnvironment = Omit<PasskeyEnvironment, 'credentials'> & { credentials: Pick<CredentialsContainer, 'create'> | undefined };

/** A passkey made on the device, with the token of the challenge it answers: `save` needs both. */
export interface NewPasskey {
  attestation: PasskeyAttestation;
  challengeToken: string;
}

/**
 * `cancelled` covers dismissing the prompt and a timeout: neither is an error to show. `unprepared`: no fresh
 * challenge was ready at the press, so no prompt opened; one is being fetched for the next press.
 */
export type NewPasskeyResult = ({ status: 'created' } & NewPasskey) | { status: 'cancelled' } | { status: 'unprepared' };

/** How the device labels the passkey. These stay on the device; the server is not sent them. */
export interface PasskeyOwner {
  /** The address the person signs in with. */
  address: string;
  name: string;
}

/** The server keeps a challenge 60 seconds; one fetched ahead is used only while it has time left for the prompt. */
const CHALLENGE_FRESH_FOR = 50_000;

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
 * The browser half of creating a passkey for the signed-in account (WebAuthn). The server binds each challenge
 * to the session, and `save` attaches the passkey to that account.
 */
export function createPasskeyRegistrar(registration: PasskeyRegistration, environment: PasskeyCreationEnvironment) {
  let ready: { options: PasskeyCreationOptions; at: number } | null = null;
  let latest: Promise<void> | null = null;

  const registrar = {
    isSupported() {
      return environment.supported && environment.credentials !== undefined;
    },
    /**
     * Fetches the server's challenge ahead of the press, so `create` can open the prompt inside it, replacing any
     * fetched before. Settles once a challenge is ready or could not be had; never rejects.
     */
    prepare(): Promise<void> {
      if (!registrar.isSupported()) return Promise.resolve();
      ready = null;
      const fetching: Promise<void> = registration.beginForAccount().then(
        (options) => {
          if (latest === fetching) ready = { options, at: Date.now() };
        },
        () => undefined,
      );
      latest = fetching;
      return fetching;
    },
    /**
     * Call from a press handler: browsers only show the prompt in response to a user action, so it opens at once
     * with a challenge prepared ahead, never after waiting for one. A challenge is used once; the next is fetched
     * as soon as this one is taken, so a retry has one ready while it is fresh.
     */
    async create(owner: PasskeyOwner): Promise<NewPasskeyResult> {
      if (!environment.credentials) return { status: 'cancelled' };
      const options = ready && Date.now() - ready.at < CHALLENGE_FRESH_FOR ? ready.options : null;
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
      return { status: 'created', attestation: describeAttestation(credential as PublicKeyCredential), challengeToken: options.challengeToken };
    },
    /** Attaches a passkey made by `create` to the signed-in account. */
    save({ attestation, challengeToken }: NewPasskey) {
      return registration.finish(challengeToken, attestation);
    },
  };
  return registrar;
}

export type PasskeyRegistrar = ReturnType<typeof createPasskeyRegistrar>;
