import type { components } from './schema';

export type Schemas = components['schemas'];

// The backend's OpenAPI description does not declare response bodies yet, so these are
// written by hand from the backend source. Replace with generated types once it does.
/**
 * What every token-issuing endpoint answers to a web client (login, second step, passkey, context, refresh).
 * The refresh token never reaches script: the server keeps it in an HttpOnly cookie named after the slot.
 */
export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  tokenType?: string;
  /** The account's position in this browser, 0 to 9; it appears in app addresses (`/u/<slot>/`). */
  slot: number;
  /** Names the account in this browser only. A slot that answers with another handle now holds another account. */
  handle: string;
}

/** `POST /auth/refresh`. The handle is `null` for a session made before handles existed. */
export interface RefreshedTokens extends Omit<AuthTokens, 'handle'> {
  handle: string | null;
}

/**
 * One account this browser has used and not removed, as `GET /auth/accounts` lists them (sorted by slot).
 * Written by hand: the generated schema types the nullable strings as objects.
 */
export interface ClientAccount {
  handle: string;
  slot: number;
  displayName: string | null;
  initials: string | null;
  avatarUrl: string | null;
  /** The full address: this list answers only to this browser's own secret cookie. */
  email: string;
  kind: 'personal' | 'business';
  organisation: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | null;
  signedIn: boolean;
}

export interface MfaRequired {
  mfaRequired: true;
  challengeToken: string;
}

/**
 * No session yet: the account's phone has to be checked by text first (an administrator whose phone is still
 * unverified, at sign-up and at every sign-in until it is). The challenge goes to `/auth/phone-challenge/*`.
 */
export interface PhoneRequired {
  phoneRequired: true;
  challengeToken: string;
}

export type LoginResult = AuthTokens | MfaRequired | PhoneRequired;

/** What the backend returns when the outcome is only that the request was accepted. */
export interface Acknowledgement {
  message: string;
}

export interface ProfilePhoto {
  url: string | null;
  urls: { thumbnail: string | null; medium: string | null; original: string | null } | null;
}

export interface Profile {
  id: string;
  globalId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  photo: ProfilePhoto | null;
  status?: string;
  locale?: string | null;
  timezone?: string | null;
  /** `personal` for a personal account; `business` for a workspace founder; `managed` for an account an organisation made. */
  accountType: 'personal' | 'business' | 'managed';
}

/** `GET /auth/contexts`: the personal and organisation contexts the session can act in. Hand-written: the generated schema types the nullable strings as objects. */
export interface AuthContext {
  type: 'personal' | 'tenant';
  tenantId: string | null;
  displayName: string | null;
  logoUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | null;
  isCurrent: boolean;
}

/**
 * `GET /tenants/{tenantId}`: the workspace, as the backend's lean document (`Tenant` schema). Only what the
 * interface reads is typed.
 */
export interface Workspace {
  _id: string;
  slug: string;
  displayName: string;
  status: 'pending_setup' | 'active' | 'suspended' | 'cancelled' | (string & {});
  primaryDomainId: string | null;
  logoUrl?: string | null;
}

export type DomainStatus = 'pending' | 'verified' | 'failed' | 'revoked' | 'reverification_required' | 'suspended' | 'released';

/**
 * One of a workspace's domains, as `GET /tenants/{tenantId}/domains` lists it (the `VerifiedDomain` schema).
 * While the domain is `pending` or `reverification_required`, the list also carries the TXT record's value as
 * `verificationToken`; other rows omit it. A CNAME's alias and target are listed.
 */
export interface WorkspaceDomain {
  _id: string;
  domain: string;
  method: 'TXT' | 'CNAME';
  status: DomainStatus;
  isPrimary: boolean;
  /** Whether the domain's MX records point at Yahel's mail. */
  mxConfigured?: boolean;
  verifyHost?: string | null;
  verifyTarget?: string | null;
  verificationToken?: string | null;
  verifiedAt?: string | null;
  lastCheckedAt?: string | null;
}

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type MemberStatus = 'active' | 'invited' | 'suspended' | 'removed';

/**
 * One membership of a workspace, as `GET /tenants/{tenantId}/members` lists it and `GET …/members/{memberId}`
 * answers (the lean `TenantMembership` document). It carries no name or address: those belong to the person's
 * identity (`globalIdentityId`), which no endpoint an administrator can call resolves yet.
 */
export interface WorkspaceMember {
  _id: string;
  globalIdentityId: string;
  tenantId: string;
  role: MemberRole;
  type: 'internal' | 'guest';
  status: MemberStatus;
  ouPath?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  inviteExpiresAt?: string | null;
  invitedBy?: string | null;
  joinedAt?: string | null;
  lastActiveAt?: string | null;
  suspendedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * One organisational unit, as `GET /tenants/{tenantId}/ous` lists it. The description declares `parentId` and
 * `description` as objects; the lean `OrganizationalUnit` document carries the parent's id as a string and the
 * description as text.
 */
export interface WorkspaceUnit extends Omit<Schemas['OuResponseDto'], 'parentId' | 'description'> {
  parentId: string | null;
  description?: string | null;
}

/** The DNS record that proves a domain is the workspace's (`DomainVerificationInstructions`). `host` is `@` for the domain itself. */
export interface DomainVerificationRecord {
  method: 'TXT' | 'CNAME';
  host: string;
  value: string;
  ttlSeconds: number;
}

/** `POST /tenants/{tenantId}/domains`: the new domain and, once only, the record to publish. */
export interface AddedDomain {
  domain: WorkspaceDomain;
  verificationToken: string;
  instructions: DomainVerificationRecord;
}

/** `POST …/domains/{domainId}/verify` when the record is found. A record not found is a failure (`DOMAIN_NOT_VERIFIED`, or `SERVICE_UNAVAILABLE` while DNS cannot be read). */
export interface DomainVerified {
  domain: WorkspaceDomain;
  verified: true;
  becamePrimary: boolean;
  tenantActivated: boolean;
}

/** `GET /auth/passkey/list`: one passkey of the signed-in account. */
export interface PasskeyItem {
  credentialId: string;
  deviceName: string | null;
  aaguid: string | null;
  transports: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface CredentialDescriptorJSON {
  id: string;
  type: 'public-key';
  transports?: string[];
}

/** WebAuthn request options as the backend's `@simplewebauthn/server` makes them. Binary values are base64url text. */
export interface WebAuthnRequestOptions {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: CredentialDescriptorJSON[];
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

/** WebAuthn creation options as the backend's `@simplewebauthn/server` makes them. Binary values are base64url text. */
export interface WebAuthnCreationOptions {
  challenge: string;
  rp: { name: string; id?: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { alg: number; type: 'public-key' }[];
  timeout?: number;
  excludeCredentials?: CredentialDescriptorJSON[];
}

/** What a passkey `begin` answers: the options for the device, and the opaque token that names the challenge to `finish`. It lives 60 seconds. */
export interface PasskeyChallenge<Options> {
  options: Options;
  challengeToken: string;
}

/** A passkey sign-in, as the backend verifies it (`AuthenticationResponseJSON`): `id` and `rawId` are the same base64url text. */
export interface AuthenticationResponseJSON {
  id: string;
  rawId: string;
  type: 'public-key';
  response: { clientDataJSON: string; authenticatorData: string; signature: string; userHandle?: string };
  clientExtensionResults: Record<string, never>;
}

/** A new passkey, as the backend verifies it (`RegistrationResponseJSON`). */
export interface RegistrationResponseJSON {
  id: string;
  rawId: string;
  type: 'public-key';
  response: { clientDataJSON: string; attestationObject: string; transports?: string[] };
  clientExtensionResults: Record<string, never>;
}

export interface PasskeyFinishBody<Response> {
  challengeToken: string;
  response: Response;
  /** How the passkey is labelled in the account's list. */
  deviceName?: string;
}

/** `POST /auth/passkey/authenticate/finish`: a session, or a phone check first, as a password sign-in can. */
export type PasskeySignInResult = AuthTokens | PhoneRequired;

/** `POST /auth/passkey/register/finish`. */
export interface PasskeyRegistered {
  credentialId: string;
  aaguid: string | null;
  deviceName: string | null;
}

/** A recovery contact that has been asked for but cannot be used yet. Values are masked by the backend. */
export interface PendingRecoveryContact {
  value: string | null;
  requestedAt: string | null;
  usableAt: string | null;
}

/** The ways back into an account, as `/me/recovery` returns them (backend: `buildRecoveryResponse`). Values are masked. */
export interface RecoveryMethods {
  recoveryEmail: { configured: boolean; value: string | null; lastUpdatedAt: string | null; pending: PendingRecoveryContact | null };
  phone: { configured: boolean; verified: boolean; value: string | null; lastUpdatedAt: string | null; pending: (PendingRecoveryContact & { verified: boolean }) | null };
}

export const isMfaRequired = (result: LoginResult): result is MfaRequired => 'mfaRequired' in result && result.mfaRequired === true;

export const isPhoneRequired = (result: object): result is PhoneRequired => 'phoneRequired' in result && (result as PhoneRequired).phoneRequired === true;

/**
 * What `POST /auth/register-business` answers: no session, but a phone challenge. The administrator's address is
 * taken as verified and no email is sent; the session comes once a texted code is checked. It also carries the DNS
 * instructions for proving the domain, which nothing reads yet and so is not typed here.
 */
export interface BusinessRegistration extends PhoneRequired {
  tenant: { id: string; slug: string; displayName: string; status: string };
  domain: { domain: string; status: string };
}

/** The body `POST /auth/register-business` takes: no date of birth is needed for a business, and `contactEmail` is a mailbox the person can open today. */
export type RegisterBusinessBody = Omit<Schemas['RegisterBusinessDto'], 'deviceName'>;

/** `POST /auth/phone-challenge/send`: the number to text the challenge's code to, international or national with `countryCode`. */
export type PhoneChallengeSendBody = Schemas['PhoneChallengeSendDto'];

/** `POST /auth/phone-challenge/verify`: the texted code (six letters or digits, case-sensitive). A right one issues the session. */
export type PhoneChallengeVerifyBody = Omit<Schemas['PhoneChallengeVerifyDto'], 'deviceName'>;

/** What `POST /auth/phone-challenge/send` answers: when another code can be asked for, and how many are left. */
export type PhoneChallengeSent = Schemas['PhoneChallengeSentResponseDto'];

/** A country as the backend lists it. `phonecode` is digits ("234"), or for some territories the calling code with an area code ("+1-876"). */
export type Country = Omit<Schemas['CountryResponseDto'], 'timezones'> & { timezones: { zoneName: string }[] };
export type CountryState = Schemas['StateResponseDto'];
export type City = Schemas['CityResponseDto'];
