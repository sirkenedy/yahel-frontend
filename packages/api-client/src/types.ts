import type { components } from './schema';

export type Schemas = components['schemas'];

// The backend's OpenAPI description does not declare response bodies yet, so these are
// written by hand from the backend source. Replace with generated types once it does.
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface MfaRequired {
  mfaRequired: true;
  challengeToken: string;
}

export type LoginResult = AuthTokens | MfaRequired;

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

export const isMfaRequired = (result: LoginResult): result is MfaRequired => 'mfaRequired' in result && result.mfaRequired === true;
