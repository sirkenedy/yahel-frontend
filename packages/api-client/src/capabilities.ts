import type { AuthTokens, Profile } from './types';

// Things the account flows need that the backend may not offer yet. Each is a small interface so the
// interface code never knows whether a real endpoint or a stand-in is answering. See account-capabilities.ts.

/** A signed-in session as a sign-in method other than the password endpoint would return it. */
export interface SignedIn {
  tokens: AuthTokens;
  profile: Profile;
}

/** What the server asks the device to sign. Binary values are base64url text. */
export interface PasskeyAssertionOptions {
  challenge: string;
  rpId: string;
  timeoutMs: number;
  /** Empty lets the device offer any passkey it holds for this site. */
  allowCredentials: { id: string }[];
  userVerification: 'required' | 'preferred';
}

/** The device's answer. Binary values are base64url text. */
export interface PasskeyAssertion {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string | null;
}

/**
 * The server half of signing in with a passkey. A real server uses its own relying-party id and ignores
 * the one passed here, which exists for the stand-in; see docs/roadmap.md, "What each real endpoint must do".
 */
export interface PasskeyCeremony {
  begin(input: { email?: string; rpId: string }): Promise<PasskeyAssertionOptions>;
  finish(assertion: PasskeyAssertion): Promise<SignedIn>;
}

/** Sends the second-step code by text message instead of an authenticator app. */
export interface TextCodeSender {
  /** Resolves with the masked number the code went to. */
  send(challengeToken: string): Promise<{ destination: string }>;
}

export interface KnownAccount {
  name: string;
  email: string;
  kind: 'person' | 'organisation';
  /** The organisation's name, for organisation accounts. */
  organisation?: string;
  signedOut?: boolean;
}

/** The accounts that have signed in on this device, for the account chooser. */
export interface AccountDirectory {
  list(): Promise<KnownAccount[]>;
  /** Stand-in only: a real server records sign-ins itself, and this leaves the interface when it does. */
  remember(account: KnownAccount): Promise<void>;
  remove(email: string): Promise<void>;
}

export type RecoveryMethod = 'email' | 'phone';

export interface RecoveryOption {
  method: RecoveryMethod;
  /** Masked: enough to recognise, not enough to learn. */
  destination: string;
}

/** Where a password-reset code can be sent, and sending it. */
export interface RecoveryChannels {
  /** Must answer the same way, in shape and in time, whether or not the address has an account. */
  options(email: string): Promise<RecoveryOption[]>;
  send(email: string, method: RecoveryMethod): Promise<void>;
}

/** Takes a request from someone who cannot tell us which account is theirs. */
export interface AccountHelpDesk {
  request(input: { contact: string }): Promise<void>;
}

/** What the server asks the device to create. Binary values are base64url text. */
export interface PasskeyCreationOptions {
  challenge: string;
  rp: { id: string; name: string };
  /** A random handle for the account-to-be. It says nothing about the person. */
  userHandle: string;
  timeoutMs: number;
  /** COSE algorithm identifiers the server accepts, most preferred first. */
  algorithms: number[];
}

/** The new passkey's public half, as the device describes it. Binary values are base64url text. */
export interface PasskeyAttestation {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  transports: string[];
}

/**
 * The server half of creating a passkey during sign-up. `begin` runs before the account exists, so it
 * takes and reveals nothing about a person; `finish` runs once they are signed in and attaches the
 * passkey to the account. See docs/roadmap.md, "What each real endpoint must do".
 */
export interface PasskeyRegistration {
  begin(input: { rpId: string }): Promise<PasskeyCreationOptions>;
  finish(attestation: PasskeyAttestation): Promise<void>;
}

export interface AddressCheck {
  /** Only ever "available" or not: never why, and never whose it is. */
  available: boolean;
  /** Free addresses close to the one asked about. */
  alternatives: string[];
}

/** Whether a Yahel address (the part before the @) can still be had. */
export interface AddressAvailability {
  check(name: string, signal?: AbortSignal): Promise<AddressCheck>;
}

/** Someone the person trusts to vouch for them if every other way back in is lost. Needs a session. */
export interface TrustedContacts {
  /** Answers the same way whether or not the invited address has a Yahel account. */
  invite(email: string): Promise<void>;
}

/** The two choices on the review screen. Both are off unless the person turns them on. Needs a session. */
export interface SignUpPreferences {
  save(choices: { productNews: boolean; activityHistory: boolean }): Promise<void>;
}

/** A planned interruption, as the server announces it. Times are ISO 8601. */
export interface ServiceWindow {
  from: string;
  until: string;
}

/** What the service says about itself while it cannot answer, so the wait can be given an end. */
export interface ServiceStatus {
  /** The maintenance window in progress, or `null` when none is announced. */
  window(): Promise<ServiceWindow | null>;
}

export type StandInName = 'passkeys' | 'textCodes' | 'directory' | 'recoveryByPhone' | 'helpDesk' | 'passkeyRegistration' | 'addresses' | 'trustedContacts' | 'preferences' | 'serviceStatus';

export interface AccountCapabilities {
  /** `null` when the feature is not available; the interface then does not offer it. */
  passkeys: PasskeyCeremony | null;
  textCodes: TextCodeSender | null;
  directory: AccountDirectory | null;
  recovery: RecoveryChannels;
  helpDesk: AccountHelpDesk | null;
  passkeyRegistration: PasskeyRegistration | null;
  addresses: AddressAvailability | null;
  trustedContacts: TrustedContacts | null;
  preferences: SignUpPreferences | null;
  serviceStatus: ServiceStatus | null;
  /** The capabilities currently answered by stand-ins. Empty in a normal build. */
  standIns: readonly StandInName[];
}
