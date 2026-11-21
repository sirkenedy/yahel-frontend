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

/** The server half of signing in with a passkey. */
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
  /** Must answer the same way whether or not the address has an account. */
  options(email: string): Promise<RecoveryOption[]>;
  send(email: string, method: RecoveryMethod): Promise<void>;
}

/** Takes a request from someone who cannot tell us which account is theirs. */
export interface AccountHelpDesk {
  request(input: { contact: string }): Promise<void>;
}

export type StandInName = 'passkeys' | 'textCodes' | 'directory' | 'recoveryByPhone' | 'helpDesk';

export interface AccountCapabilities {
  /** `null` when the feature is not available; the interface then does not offer it. */
  passkeys: PasskeyCeremony | null;
  textCodes: TextCodeSender | null;
  directory: AccountDirectory | null;
  recovery: RecoveryChannels;
  helpDesk: AccountHelpDesk | null;
  /** The capabilities currently answered by stand-ins. Empty in a normal build. */
  standIns: readonly StandInName[];
}
