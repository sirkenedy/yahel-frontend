import { ApiError } from './errors';
import type { paths } from './schema';
import type { AuthTokens, LoginResult, Profile, Schemas } from './types';

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
      login: (body: Schemas['LoginDto']) => request<LoginResult>('POST', '/api/v1/auth/login', { body }),
      refresh: (body: Schemas['RefreshTokenDto']) => request<AuthTokens>('POST', '/api/v1/auth/refresh', { body }),
      logout: () => request<null>('POST', '/api/v1/auth/logout', { auth: true }),
    },
    me: {
      get: (signal?: AbortSignal) => request<Profile>('GET', '/api/v1/me', { auth: true, signal }),
      update: (body: Schemas['UpdateProfileDto']) => request<Profile>('PATCH', '/api/v1/me', { auth: true, body }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
