import { accountDirectoryOf, createApiClient, isApiError, isMfaRequired } from '@yahel/api-client';
import type { ApiClient, AuthTokens, Profile, Schemas, SignedIn } from '@yahel/api-client';
import { createStore } from 'zustand/vanilla';

export type SessionStatus = 'unknown' | 'signed-out' | 'signed-in';

export interface SessionState {
  status: SessionStatus;
  profile: Profile | null;
  /** The account this tab is using: its slot in this browser (`/u/<slot>/`), and the handle that names it. */
  slot: number | null;
  handle: string | null;
}

export interface SignedInAccount {
  slot: number;
  handle: string;
}

export type SignInResult = ({ ok: true } & SignedInAccount) | { ok: false; reason: 'mfa-required'; challengeToken: string };

/**
 * What happened to the accounts that this tab did not do itself: in another tab, or on the server.
 * - `accounts-changed`: who is signed in or remembered in this browser changed; read the list again.
 * - `signed-out`: the account this tab was using is signed out.
 * - `changed-hands`: this tab's slot now holds another account. Everything kept for the old one must go.
 */
export type SessionEvent = { type: 'accounts-changed' } | { type: 'signed-out'; slot: number } | { type: 'changed-hands'; slot: number };

/** What one tab tells the others. Never a token: only which slot or handle changed. */
type TabMessage = { type: 'signed-in'; slot: number; handle: string } | { type: 'signed-out'; slot: number } | { type: 'removed'; handle: string } | { type: 'browser-signed-out' };

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The part of the Web Locks API the session uses. */
export interface SessionLocks {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

/** The part of `BroadcastChannel` the session uses. */
export interface SessionChannel {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}

export interface SessionOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Takes turns refreshing a slot with the other tabs. Without it, turns are taken within this tab only. */
  locks?: SessionLocks | null;
  /** Tells the other tabs of this browser when an account is signed in, signed out or removed. */
  channel?: SessionChannel | null;
  /** Remembers which slot this tab uses, so a reload returns to it. Holds a number, never a token. */
  slotStorage?: KeyValueStorage | null;
}

type RefreshOutcome = 'ok' | 'signed-out' | 'changed-hands' | 'unreachable';

const SLOT_KEY = 'yahel.slot';
/** The answers to a refresh that mean the slot's session is over: expired, revoked, replayed, or its membership ended. */
const SESSION_OVER = new Set(['SESSION_EXPIRED', 'INVALID_TOKEN', 'TOKEN_REUSE_DETECTED', 'FORBIDDEN']);
const isSessionOver = (error: unknown) => isApiError(error) && (SESSION_OVER.has(error.code) || error.status === 401);

const readSlot = (value: string | null) => (value !== null && /^\d$/.test(value) ? Number(value) : null);

/**
 * The browser's accounts, as one tab sees them. Each account has a slot; the server keeps its refresh token
 * in an HttpOnly cookie for that slot, so no refresh token is ever in script or web storage. This tab holds,
 * in memory only, an access token for each slot it has used, and uses one slot at a time.
 */
export function createSession(options: SessionOptions) {
  const store = createStore<SessionState>(() => ({ status: 'unknown', profile: null, slot: null, handle: null }));
  const slots = new Map<number, { handle: string | null; accessToken: string }>();
  const inflight = new Map<number, Promise<RefreshOutcome>>();
  const listeners = new Set<(event: SessionEvent) => void>();
  let current: number | null = null;
  let reuse: unknown = null;

  const emit = (event: SessionEvent) => listeners.forEach((listener) => listener(event));
  const tell = (message: TabMessage) => options.channel?.postMessage(message);

  const choose = (slot: number | null) => {
    current = slot;
    if (slot === null) options.slotStorage?.removeItem(SLOT_KEY);
    else options.slotStorage?.setItem(SLOT_KEY, String(slot));
  };

  const clearCurrent = () => {
    choose(null);
    store.setState({ status: 'signed-out', profile: null, slot: null, handle: null });
  };

  /** Forgets a slot this tab held. Resolves true when it was the one in use, which leaves the tab signed out. */
  const forget = (slot: number) => {
    slots.delete(slot);
    if (slot !== current && slot !== store.getState().slot) return false;
    clearCurrent();
    return true;
  };

  /** The same, when it happened elsewhere: the app is told. */
  const lose = (slot: number, event: 'signed-out' | 'changed-hands') => {
    if (forget(slot)) emit({ type: event, slot });
  };

  const refreshNow = async (slot: number): Promise<RefreshOutcome> => {
    try {
      const tokens = await api.auth.refresh({ slot });
      const expected = slots.get(slot)?.handle ?? null;
      if (expected && tokens.handle && tokens.handle !== expected) return 'changed-hands';
      slots.set(slot, { handle: tokens.handle ?? expected, accessToken: tokens.accessToken });
      return 'ok';
    } catch (error) {
      if (!isSessionOver(error)) return 'unreachable';
      if (isApiError(error) && error.code === 'TOKEN_REUSE_DETECTED') reuse = error;
      return 'signed-out';
    }
  };

  /** One refresh per slot at a time: within this tab always, and across tabs where the browser has Web Locks. */
  const refreshSlot = (slot: number) => {
    let running = inflight.get(slot);
    if (!running) {
      running = (options.locks ? options.locks.request(`yahel.refresh.${slot}`, () => refreshNow(slot)) : refreshNow(slot)).finally(() => inflight.delete(slot));
      inflight.set(slot, running);
    }
    return running;
  };

  /** What a refresh outcome means for the slot, here and in the other tabs. Resolves true when the slot has a fresh token. */
  const settle = (slot: number, outcome: RefreshOutcome) => {
    if (outcome === 'signed-out') {
      lose(slot, 'signed-out');
      tell({ type: 'signed-out', slot });
      emit({ type: 'accounts-changed' });
    } else if (outcome === 'changed-hands') {
      lose(slot, 'changed-hands');
      emit({ type: 'accounts-changed' });
    }
    return outcome === 'ok';
  };

  const refreshCurrent = async () => {
    const slot = current;
    if (slot === null) return false;
    const fresh = settle(slot, await refreshSlot(slot));
    if (reuse) {
      // The server ended every session of that account because a spent refresh token was used: the caller is told so.
      const error = reuse;
      reuse = null;
      throw error;
    }
    return fresh;
  };

  const api: ApiClient = createApiClient({
    baseUrl: options.baseUrl,
    getAccessToken: () => (current === null ? null : (slots.get(current)?.accessToken ?? null)),
    refreshSession: refreshCurrent,
    fetch: options.fetch,
  });
  const directory = accountDirectoryOf(api);

  const loadProfile = async () => {
    const profile = await api.me.get();
    const slot = current;
    store.setState({ status: 'signed-in', profile, slot, handle: slot === null ? null : (slots.get(slot)?.handle ?? null) });
  };

  const accept = (tokens: AuthTokens) => {
    slots.set(tokens.slot, { handle: tokens.handle, accessToken: tokens.accessToken });
    choose(tokens.slot);
    tell({ type: 'signed-in', slot: tokens.slot, handle: tokens.handle });
  };

  const signedIn = async (tokens: AuthTokens): Promise<SignedInAccount> => {
    accept(tokens);
    await loadProfile();
    return { slot: tokens.slot, handle: tokens.handle };
  };

  options.channel?.addEventListener('message', (event: MessageEvent) => {
    const message = event.data as TabMessage;
    if (message.type === 'signed-out') lose(message.slot, 'signed-out');
    else if (message.type === 'removed') {
      const slot = [...slots].find(([, held]) => held.handle === message.handle)?.[0] ?? (store.getState().handle === message.handle ? store.getState().slot : null);
      if (slot !== null && slot !== undefined) lose(slot, 'signed-out');
    } else if (message.type === 'browser-signed-out') {
      const using = store.getState().slot;
      slots.clear();
      if (using !== null) lose(using, 'signed-out');
    } else if (message.type === 'signed-in') {
      const held = slots.get(message.slot);
      if (held && held.handle !== message.handle) lose(message.slot, 'changed-hands');
    }
    emit({ type: 'accounts-changed' });
  });

  /** Makes `slot` this tab's account, refreshing it unless this tab already holds a token for it. */
  const enter = async (slot: number, handle?: string) => {
    const held = slots.get(slot);
    if (!held || (handle && held.handle !== handle)) {
      if (!settle(slot, await refreshSlot(slot))) return false;
      if (handle && slots.get(slot)?.handle !== handle) return false;
    }
    const before = { current, state: store.getState() };
    choose(slot);
    try {
      await loadProfile();
      return true;
    } catch {
      choose(before.current);
      store.setState(before.state);
      return false;
    }
  };

  return {
    api,
    store,

    /**
     * Restores this tab's account: the slot given (from the address), or the one this tab used before a
     * reload. Never throws; anything that goes wrong leaves the tab signed out.
     */
    async init(slot?: number | null) {
      const wanted = slot ?? readSlot(options.slotStorage?.getItem(SLOT_KEY) ?? null);
      if (wanted === null || !(await enter(wanted).catch(() => false))) clearCurrent();
      reuse = null;
    },

    /** The slot this tab is using right now, including one whose profile is still loading. */
    slotInUse: () => current,

    /** The accounts this browser remembers, signed in or not, by slot. */
    accounts: (signal?: AbortSignal) => directory.list(signal),

    /**
     * Uses another account of this browser in this tab, without a password: it must be signed in. With a
     * handle, the slot must still hold that account. Resolves false when it cannot be used.
     */
    switchTo: (slot: number, handle?: string) => enter(slot, handle).catch(() => false),

    /** Signs an account in and makes it this tab's. The others in this browser stay signed in. */
    async signIn(email: string, password: string): Promise<SignInResult> {
      const result = await api.auth.login({ email, password });
      if (isMfaRequired(result)) return { ok: false, reason: 'mfa-required', challengeToken: result.challengeToken };
      return { ok: true, ...(await signedIn(result)) };
    },

    /** Creates a workspace and its administrator. No session follows: the administrator's address has to be confirmed first. */
    registerBusiness: (details: Omit<Schemas['RegisterBusinessDto'], 'deviceName'>) => api.auth.registerBusiness(details),

    /** Finishes a sign-in that stopped for a second step. `trustDevice` skips that step in this browser for 30 days. */
    completeSecondStep: async (challengeToken: string, code: string, trustDevice = false) => signedIn(await api.auth.mfaChallenge({ challengeToken, code, trustDevice })),

    /** Starts a session from a sign-in that happened outside the password endpoint, such as a passkey. */
    establish({ tokens, profile }: SignedIn) {
      accept(tokens);
      store.setState({ status: 'signed-in', profile, slot: tokens.slot, handle: tokens.handle });
    },

    /**
     * Signs one account out of this browser, by default this tab's. It stays remembered, signed out. This tab
     * forgets it whatever the server answers; an account already signed out there counts as done.
     */
    async signOut(slot: number | null = current ?? store.getState().slot) {
      if (slot === null) return;
      try {
        await api.auth.logout({ slot });
      } catch (error) {
        if (!(isApiError(error) && error.code === 'SESSION_EXPIRED')) throw error;
      } finally {
        forget(slot);
        tell({ type: 'signed-out', slot });
      }
    },

    /** Signs every account in this browser out. They stay remembered. */
    async signOutAll() {
      try {
        await api.auth.logoutBrowser();
      } finally {
        slots.clear();
        clearCurrent();
        tell({ type: 'browser-signed-out' });
      }
    },

    /** Forgets an account in this browser, signed in or not. */
    async removeAccount(handle: string) {
      await directory.remove(handle);
      const slot = [...slots].find(([, held]) => held.handle === handle)?.[0];
      if (slot !== undefined) forget(slot);
      if (store.getState().handle === handle) clearCurrent();
      tell({ type: 'removed', handle });
    },

    /** Hears what changed that this tab did not do itself. Returns a function that stops listening. */
    subscribe(listener: (event: SessionEvent) => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export type Session = ReturnType<typeof createSession>;

export interface BrowserSessionOptions {
  /** Keeps this tab's slot across a reload. An app whose addresses carry the slot (`/u/<slot>/`) does not need it. */
  rememberSlot?: boolean;
}

export const createBrowserSession = (baseUrl: string, { rememberSlot = false }: BrowserSessionOptions = {}) =>
  createSession({
    baseUrl,
    locks: typeof navigator !== 'undefined' && 'locks' in navigator ? navigator.locks : null,
    channel: typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('yahel.session'),
    slotStorage: rememberSlot ? window.sessionStorage : null,
  });
