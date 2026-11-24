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

export type LoginResult = AuthTokens | MfaRequired;

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

/**
 * What `POST /auth/register-business` answers (from `auth.service.ts`, `registerBusiness`). It also carries
 * the DNS instructions for proving the domain, which nothing reads yet and so is not typed here.
 */
export interface BusinessRegistration {
  message: string;
  identity: { id: string; email: string; emailVerified: boolean };
  tenant: { id: string; slug: string; displayName: string; status: string };
  domain: { domain: string; status: string };
}
