import { createApiClient, isMfaRequired } from '@yahel/api-client';
import type { ApiClient, AuthTokens, Profile } from '@yahel/api-client';
import { createStore } from 'zustand/vanilla';

export type SessionStatus = 'unknown' | 'signed-out' | 'signed-in';

export interface SessionState {
  status: SessionStatus;
  profile: Profile | null;
}

export type SignInResult = { ok: true } | { ok: false; reason: 'mfa-required'; challengeToken: string };

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SessionOptions {
  baseUrl: string;
  /** Holds the refresh token. Session-scoped storage, so it is cleared when the tab closes. */
  tokenStorage: KeyValueStorage;
  /** Holds the device id, which must survive across sessions. */
  deviceStorage: KeyValueStorage;
  fetch?: typeof fetch;
}

const REFRESH_KEY = 'yahel.refresh-token';
const DEVICE_KEY = 'yahel.device-id';

export function createSession(options: SessionOptions) {
  const store = createStore<SessionState>(() => ({ status: 'unknown', profile: null }));
  // The access token lives in memory only, never in web storage.
  let accessToken: string | null = null;
  let refreshing: Promise<boolean> | null = null;

  const deviceId = () => {
    const existing = options.deviceStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    options.deviceStorage.setItem(DEVICE_KEY, created);
    return created;
  };

  const accept = (tokens: AuthTokens) => {
    accessToken = tokens.accessToken;
    options.tokenStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  };

  const clear = () => {
    accessToken = null;
    options.tokenStorage.removeItem(REFRESH_KEY);
    store.setState({ status: 'signed-out', profile: null });
  };

  const refresh = () => {
    refreshing ??= (async () => {
      const refreshToken = options.tokenStorage.getItem(REFRESH_KEY);
      if (!refreshToken) return false;
      try {
        accept(await api.auth.refresh({ refreshToken, deviceId: deviceId() }));
        return true;
      } catch {
        clear();
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  };

  const api: ApiClient = createApiClient({
    baseUrl: options.baseUrl,
    getAccessToken: () => accessToken,
    refreshSession: refresh,
    fetch: options.fetch,
  });

  const loadProfile = async () => {
    const profile = await api.me.get();
    store.setState({ status: 'signed-in', profile });
  };

  return {
    api,
    store,

    /** Restores a session from a stored refresh token. Never throws. */
    async init() {
      if (!(await refresh())) {
        clear();
        return;
      }
      try {
        await loadProfile();
      } catch {
        clear();
      }
    },

    async signIn(email: string, password: string): Promise<SignInResult> {
      const result = await api.auth.login({ email, password, deviceId: deviceId() });
      if (isMfaRequired(result)) return { ok: false, reason: 'mfa-required', challengeToken: result.challengeToken };
      accept(result);
      await loadProfile();
      return { ok: true };
    },

    async signOut() {
      try {
        await api.auth.logout();
      } finally {
        clear();
      }
    },
  };
}

export type Session = ReturnType<typeof createSession>;

export const createBrowserSession = (baseUrl: string) =>
  createSession({ baseUrl, tokenStorage: window.sessionStorage, deviceStorage: window.localStorage });
