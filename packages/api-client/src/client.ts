import { ApiError } from './errors';
import type { paths } from './schema';
import type { Acknowledgement, AuthTokens, BusinessRegistration, ClientAccount, LoginResult, PhoneChallengeSendBody, PhoneChallengeSent, PhoneChallengeVerifyBody, Profile, RecoveryMethods, RefreshedTokens, RegisterBusinessBody, Schemas } from './types';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Path = keyof paths;

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  /** Called once when an authenticated request returns 401. Resolve true if a new token is available. If it rejects, that failure is the answer to the request. */
  refreshSession?: () => Promise<boolean>;
  fetch?: typeof fetch;
}

interface RequestOptions {
  body?: unknown;
  params?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
}

interface Envelope {
  success?: boolean;
  data?: unknown;
  code?: string;
  message?: string;
  error?: { code?: string; message?: string };
  meta?: { requestId?: string; validationErrors?: string[] };
}

/** The longest wait the client will pass on. A header that asks for more (a mistake, or something hostile in between) is cut to this, so nobody is shown an absurd time. */
export const MAX_RETRY_AFTER = 24 * 60 * 60;

/** `Retry-After` as seconds from now, at most a day: the header is either a number of seconds or a date. Readable only when the server exposes it to browsers. */
const retryAfterOf = (response: Response): number | undefined => {
  const header = response.headers?.get('Retry-After');
  if (!header) return undefined;
  const seconds = /^\d+$/.test(header.trim()) ? Number(header) : Math.ceil((Date.parse(header) - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, MAX_RETRY_AFTER) : undefined;
};

/** What the backend's auth guard answers, with 401, when the access token is missing, expired or revoked. */
const ACCESS_TOKEN_REFUSED = 'SESSION_EXPIRED';

/**
 * Says this is the web client. The backend refuses to sign a browser in without it, and the custom header
 * forces a CORS preflight that a page on another site cannot pass.
 */
export const CLIENT_HEADER = { 'X-Yahel-Client': 'web' } as const;

export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  // Spec paths carry the global "/api" prefix; baseUrl already ends with it.
  const url = (path: Path, params?: Record<string, string>) =>
    options.baseUrl.replace(/\/api\/?$/, '') + path.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(params?.[key] ?? ''));

  async function send<T>(method: Method, path: Path, request: RequestOptions, retried: boolean): Promise<T> {
    const token = request.auth ? options.getAccessToken?.() : null;
    let response: Response;
    try {
      response = await doFetch(url(path, request.params), {
        method,
        // The browser's cookies (its secret and one refresh token per account) are the session; script never sees them.
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...CLIENT_HEADER,
          ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: request.signal,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
      throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Network request failed' });
    }

    const envelope = (await response.json().catch(() => ({}))) as Envelope;

    if (response.ok) return (envelope.data ?? null) as T;

    const code = envelope.error?.code ?? envelope.code ?? 'UNKNOWN_ERROR';
    // Only the backend's own "the access token is no longer good" is answered by refreshing and asking again.
    // Any other 401 (a wrong code, say) is the answer to the request itself; asking again would spend a second attempt.
    if (response.status === 401 && code === ACCESS_TOKEN_REFUSED && request.auth && !retried && options.refreshSession && (await options.refreshSession())) {
      return send<T>(method, path, request, true);
    }

    throw new ApiError({
      status: response.status,
      code,
      message: envelope.error?.message ?? envelope.message ?? response.statusText,
      requestId: envelope.meta?.requestId,
      validationErrors: envelope.meta?.validationErrors,
      retryAfter: retryAfterOf(response),
    });
  }

  const request = <T>(method: Method, path: Path, requestOptions: RequestOptions = {}) => send<T>(method, path, requestOptions, false);

  return {
    request,
    auth: {
      /** Whether a Yahel address (the part before the @) can still be had, with free ones like it. Advice only. */
      addressAvailability: (body: Schemas['AddressAvailabilityDto'], signal?: AbortSignal) => request<Schemas['AddressAvailabilityResponseDto']>('POST', '/api/v1/auth/address-availability', { body, signal }),
      register: (body: Schemas['RegisterDto']) => request<Acknowledgement>('POST', '/api/v1/auth/register', { body }),
      registerBusiness: (body: RegisterBusinessBody) => request<BusinessRegistration>('POST', '/api/v1/auth/register-business', { body }),
      /** Texts the code for a phone challenge to `phone`. */
      phoneChallengeSend: (body: PhoneChallengeSendBody) => request<PhoneChallengeSent>('POST', '/api/v1/auth/phone-challenge/send', { body }),
      /** Checks the texted code; a right one issues the session, as a sign-in does. */
      phoneChallengeVerify: (body: PhoneChallengeVerifyBody) => request<AuthTokens>('POST', '/api/v1/auth/phone-challenge/verify', { body }),
      login: (body: Schemas['LoginDto']) => request<LoginResult>('POST', '/api/v1/auth/login', { body }),
      /** A new access token for the account in `slot`, from that slot's refresh cookie. */
      refresh: (body: Schemas['RefreshTokenDto']) => request<RefreshedTokens>('POST', '/api/v1/auth/refresh', { body }),
      /** Signs the account in `slot` out of this browser. It stays listed, signed out. */
      logout: (body: Schemas['LogoutSlotDto']) => request<Schemas['ClientSlotResponseDto']>('POST', '/api/v1/auth/logout', { body }),
      /** Signs every account in this browser out, keeping them listed. */
      logoutBrowser: () => request<null>('POST', '/api/v1/auth/logout-browser'),
      /** The accounts this browser has used and not removed, by slot. Empty for a browser that never signed in. */
      accounts: (signal?: AbortSignal) => request<ClientAccount[]>('GET', '/api/v1/auth/accounts', { signal }),
      /** Forgets an account in this browser, signing it out first if need be. Removing one already gone succeeds. */
      removeAccount: (handle: string) => request<Schemas['ClientRemovedResponseDto']>('DELETE', '/api/v1/auth/accounts/{handle}', { params: { handle } }),
      mfaChallenge: (body: Schemas['MfaChallengeSubmitDto']) => request<AuthTokens>('POST', '/api/v1/auth/mfa/challenge', { body }),
      forgotPassword: (body: Schemas['ForgotPasswordDto']) => request<Acknowledgement>('POST', '/api/v1/auth/forgot-password', { body }),
      resetPassword: (body: Schemas['ResetPasswordDto']) => request<Acknowledgement>('POST', '/api/v1/auth/reset-password', { body }),
      verifyEmail: (body: Schemas['VerifyEmailDto']) => request<Acknowledgement>('POST', '/api/v1/auth/verify-email', { body }),
      resendVerification: (body: Schemas['ResendVerificationDto']) => request<Acknowledgement>('POST', '/api/v1/auth/verify-email/resend', { body }),
      sendPhoneOtp: (body: Schemas['SendPhoneOtpDto']) => request<Acknowledgement>('POST', '/api/v1/auth/phone/send-otp', { auth: true, body }),
      verifyPhoneOtp: (body: Schemas['VerifyPhoneOtpDto']) => request<Acknowledgement>('POST', '/api/v1/auth/phone/verify', { auth: true, body }),
    },
    me: {
      get: (signal?: AbortSignal) => request<Profile>('GET', '/api/v1/me', { auth: true, signal }),
      update: (body: Schemas['UpdateProfileDto']) => request<Profile>('PATCH', '/api/v1/me', { auth: true, body }),
      recovery: {
        /** The ways back in as they stand, masked. */
        get: (signal?: AbortSignal) => request<RecoveryMethods>('GET', '/api/v1/me/recovery', { auth: true, signal }),
        updateEmail: (body: Schemas['UpdateRecoveryEmailDto']) => request<RecoveryMethods>('PATCH', '/api/v1/me/recovery/email', { auth: true, body }),
        /** Stages the number and texts a code to it; `verifyPhone` confirms it. */
        updatePhone: (body: Schemas['UpdatePhoneDto']) => request<RecoveryMethods>('PATCH', '/api/v1/me/recovery/phone', { auth: true, body }),
        verifyPhone: (body: Schemas['VerifyRecoveryPhoneDto']) => request<RecoveryMethods>('POST', '/api/v1/me/recovery/phone/verify', { auth: true, body }),
        /** Invites someone the person trusts; they count once they accept from the email. */
        updateTrustedContact: (body: Schemas['UpdateTrustedContactDto']) => request<RecoveryMethods>('PATCH', '/api/v1/me/recovery/trusted-contact', { auth: true, body }),
      },
    },
    tenants: {
      /** Whether a domain a business says it owns can still be claimed by a new workspace. Advice: registering decides. */
      checkDomainClaim: (body: Schemas['DomainClaimDto'], signal?: AbortSignal) => request<Schemas['DomainClaimResponseDto']>('POST', '/api/v1/tenants/domain-claims/check', { body, signal }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
