import { ApiError } from './errors';
import type { paths } from './schema';
import type { Acknowledgement, AuthTokens, LoginResult, Profile, RecoveryMethods, Schemas } from './types';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Path = keyof paths;

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  /** Called once when an authenticated request returns 401. Resolve true if a new token is available. */
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
        headers: {
          Accept: 'application/json',
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

    if (response.status === 401 && request.auth && !retried && options.refreshSession && (await options.refreshSession())) {
      return send<T>(method, path, request, true);
    }

    throw new ApiError({
      status: response.status,
      code: envelope.error?.code ?? envelope.code ?? 'UNKNOWN_ERROR',
      message: envelope.error?.message ?? envelope.message ?? response.statusText,
      requestId: envelope.meta?.requestId,
      validationErrors: envelope.meta?.validationErrors,
    });
  }

  const request = <T>(method: Method, path: Path, requestOptions: RequestOptions = {}) => send<T>(method, path, requestOptions, false);

  return {
    request,
    auth: {
      register: (body: Schemas['RegisterDto']) => request<Acknowledgement>('POST', '/api/v1/auth/register', { body }),
      login: (body: Schemas['LoginDto']) => request<LoginResult>('POST', '/api/v1/auth/login', { body }),
      refresh: (body: Schemas['RefreshTokenDto']) => request<AuthTokens>('POST', '/api/v1/auth/refresh', { body }),
      logout: () => request<null>('POST', '/api/v1/auth/logout', { auth: true }),
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
        get: () => request<RecoveryMethods>('GET', '/api/v1/me/recovery', { auth: true }),
        updateEmail: (body: Schemas['UpdateRecoveryEmailDto']) => request<RecoveryMethods>('PATCH', '/api/v1/me/recovery/email', { auth: true, body }),
        /** Stages the number and texts a code to it; `verifyPhone` confirms it. */
        updatePhone: (body: Schemas['UpdatePhoneDto']) => request<RecoveryMethods>('PATCH', '/api/v1/me/recovery/phone', { auth: true, body }),
        verifyPhone: (body: Schemas['VerifyRecoveryPhoneDto']) => request<RecoveryMethods>('POST', '/api/v1/me/recovery/phone/verify', { auth: true, body }),
      },
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
