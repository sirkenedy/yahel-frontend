import { describe, expect, it, vi } from 'vitest';
import { createSession } from './session';
import type { KeyValueStorage, SessionChannel, SessionEvent, SessionOptions } from './session';

const memoryStorage = (initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } => {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
};

const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const fail = (status: number, code: string) => new Response(JSON.stringify({ success: false, code, message: code }), { status });
const tokens = (slot = 0, handle = `h-${slot}`, access = `access-${slot}`) => ({ accessToken: access, expiresIn: 3600, tokenType: 'Bearer', slot, handle });
const profile = { id: '1', globalId: 'g1', email: 'amara@northwind.example', firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null, accountType: 'personal' as const };
const kofi = { ...profile, id: '2', globalId: 'g2', email: 'kofi@northwind.example', firstName: 'Kofi', displayName: 'Kofi Mensah' };

type Handler = (body: Record<string, unknown>, init: RequestInit) => Response | Promise<Response>;

const authOf = (init: RequestInit) => (init.headers as Record<string, string>).Authorization;

const routeFetch = (routes: Record<string, Handler>) =>
  vi.fn(async (url: string | URL | Request, init: RequestInit = {}) => {
    const path = new URL(String(url)).pathname;
    const handler = routes[path];
    if (!handler) throw new Error(`Unexpected request to ${path}`);
    return handler(init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}, init);
  });

const bodiesTo = (fetchMock: ReturnType<typeof routeFetch>, path: string) =>
  fetchMock.mock.calls.filter(([url]) => new URL(String(url)).pathname === path).map(([, init]) => JSON.parse(String(init?.body ?? '{}')) as unknown);

/** The tabs of one browser: what one posts, the others hear. */
const tabChannels = () => {
  const tabs: ((event: MessageEvent) => void)[][] = [];
  const open = (): SessionChannel => {
    const mine: ((event: MessageEvent) => void)[] = [];
    tabs.push(mine);
    return {
      postMessage: (data) => tabs.filter((other) => other !== mine).forEach((other) => other.forEach((listener) => listener({ data } as MessageEvent))),
      addEventListener: (_type, listener) => void mine.push(listener),
    };
  };
  return { open };
};

const make = (routes: Record<string, Handler>, options: Partial<SessionOptions> = {}) => {
  const fetchMock = routeFetch(routes);
  const session = createSession({ baseUrl: 'http://api.test/api', fetch: fetchMock as typeof fetch, ...options });
  const events: SessionEvent[] = [];
  session.subscribe((event) => events.push(event));
  return { session, fetchMock, events };
};

describe('createSession: signing in', () => {
  it('signs in, holds the access token in memory only, and names the slot and handle the server gave', async () => {
    const slotStorage = memoryStorage();
    const { session, fetchMock } = make({ '/api/v1/auth/login': () => ok(tokens(2)), '/api/v1/me': (_, init) => ok({ ...profile, auth: authOf(init) }) }, { slotStorage });

    await expect(session.signIn('amara@northwind.example', 'correct horse')).resolves.toEqual({ ok: true, slot: 2, handle: 'h-2' });

    expect(session.store.getState()).toMatchObject({ status: 'signed-in', slot: 2, handle: 'h-2', profile: { email: profile.email, auth: 'Bearer access-2' } });
    expect(slotStorage.data).toEqual({ 'yahel.slot': '2' });
    expect(bodiesTo(fetchMock, '/api/v1/auth/login')).toEqual([{ email: 'amara@northwind.example', password: 'correct horse' }]);
  });

  it('reports that a second factor is required without signing in', async () => {
    const { session } = make({ '/api/v1/auth/login': () => ok({ mfaRequired: true, challengeToken: 'challenge-1' }) });

    await expect(session.signIn('a@b.c', 'p')).resolves.toEqual({ ok: false, reason: 'mfa-required', challengeToken: 'challenge-1' });
    expect(session.store.getState().status).toBe('unknown');
  });

  it('finishes a two-step sign-in with the challenge and the code, and nothing about the device', async () => {
    const { session, fetchMock } = make({ '/api/v1/auth/mfa/challenge': () => ok(tokens(1)), '/api/v1/me': () => ok(profile) });

    await expect(session.completeSecondStep('challenge-1', '482910', true)).resolves.toEqual({ slot: 1, handle: 'h-1' });

    expect(bodiesTo(fetchMock, '/api/v1/auth/mfa/challenge')).toEqual([{ challengeToken: 'challenge-1', code: '482910', trustDevice: true }]);
    expect(session.store.getState()).toEqual({ status: 'signed-in', profile, slot: 1, handle: 'h-1' });
  });

  it('stays signed out when the second-step code is refused', async () => {
    const { session } = make({ '/api/v1/auth/mfa/challenge': () => fail(401, 'MFA_INVALID') });

    await expect(session.completeSecondStep('challenge-1', '000000')).rejects.toMatchObject({ status: 401, code: 'MFA_INVALID' });
    expect(session.store.getState().status).toBe('unknown');
  });

  it('establishes a session from a sign-in made another way, loading its profile with the new token', async () => {
    const { session } = make({ '/api/v1/me': (_, init) => ok({ ...profile, auth: authOf(init) }) });

    await expect(session.establish(tokens(3))).resolves.toEqual({ slot: 3, handle: 'h-3' });

    expect(session.store.getState()).toMatchObject({ status: 'signed-in', profile: { email: profile.email, auth: 'Bearer access-3' }, slot: 3, handle: 'h-3' });
  });

  it('registers a business without starting a session or naming the device', async () => {
    const created = { message: 'ok', identity: { id: 'i1', email: 'amara@northwind.example', emailVerified: false }, tenant: { id: 't1', slug: 'northwind-studio', displayName: 'Northwind Studio', status: 'pending_setup' }, domain: { domain: 'northwind.example', status: 'pending' } };
    const { session, fetchMock } = make({ '/api/v1/auth/register-business': () => ok(created) });
    const details = { email: 'amara@northwind.example', password: 'Northwind Lagos 2026!', firstName: 'Amara', lastName: 'Okafor', businessName: 'Northwind Studio', slug: 'northwind-studio', country: { name: 'Nigeria', code: 'NG', currency: 'NGN' }, dateOfBirth: '1994-03-14T00:00:00.000Z', employeeCount: 10, domain: 'northwind.example' };

    await expect(session.registerBusiness(details)).resolves.toEqual(created);

    expect(bodiesTo(fetchMock, '/api/v1/auth/register-business')).toEqual([details]);
    expect(session.store.getState().status).toBe('unknown');
  });
});

describe('createSession: a phone checked before the session', () => {
  it('reports a phone check instead of signing in, then signs in once the texted code is right', async () => {
    const { session, fetchMock } = make({
      '/api/v1/auth/login': () => ok({ phoneRequired: true, challengeToken: 'pc-1' }),
      '/api/v1/auth/phone-challenge/send': () => ok({ message: 'sent' }),
      '/api/v1/auth/phone-challenge/verify': (body) => (body.code === 'A7kZq2' ? ok(tokens(1)) : fail(401, 'INVALID_TOKEN')),
      '/api/v1/me': () => ok(profile),
    });

    await expect(session.signIn(profile.email, 'p')).resolves.toEqual({ ok: false, reason: 'phone-required', challengeToken: 'pc-1' });
    expect(session.store.getState().status).toBe('unknown');

    await session.sendPhoneCheck('pc-1', { phone: '803 555 0142', countryCode: 'NG' });
    await expect(session.completePhoneCheck('pc-1', 'wrong1')).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    expect(session.store.getState().status).toBe('unknown');
    await expect(session.completePhoneCheck('pc-1', 'A7kZq2')).resolves.toEqual({ slot: 1, handle: 'h-1' });

    expect(session.store.getState()).toEqual({ status: 'signed-in', profile, slot: 1, handle: 'h-1' });
    expect(bodiesTo(fetchMock, '/api/v1/auth/phone-challenge/send')).toEqual([{ challengeToken: 'pc-1', phone: '803 555 0142', countryCode: 'NG' }]);
  });
});

describe('createSession: restoring and refreshing by slot', () => {
  it('restores the slot it is given by refreshing that slot, with the browser’s cookies and no token of its own', async () => {
    const { session, fetchMock } = make({ '/api/v1/auth/refresh': () => ok(tokens(4)), '/api/v1/me': () => ok(profile) });

    await session.init(4);

    expect(session.store.getState()).toEqual({ status: 'signed-in', profile, slot: 4, handle: 'h-4' });
    expect(bodiesTo(fetchMock, '/api/v1/auth/refresh')).toEqual([{ slot: 4 }]);
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ credentials: 'include', headers: { 'X-Yahel-Client': 'web' } });
  });

  it('restores the slot this tab used before a reload, and starts signed out when there is none', async () => {
    const restored = make({ '/api/v1/auth/refresh': () => ok(tokens(1)), '/api/v1/me': () => ok(profile) }, { slotStorage: memoryStorage({ 'yahel.slot': '1' }) });
    await restored.session.init();
    expect(restored.session.store.getState()).toMatchObject({ status: 'signed-in', slot: 1 });

    const fresh = make({});
    await fresh.session.init();
    expect(fresh.session.store.getState().status).toBe('signed-out');
    expect(fresh.fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'SESSION_EXPIRED'],
    [401, 'INVALID_TOKEN'],
    [401, 'TOKEN_REUSE_DETECTED'],
    [403, 'FORBIDDEN'],
  ])('starts signed out, without throwing, when the slot’s session is over (%s %s)', async (status, code) => {
    const slotStorage = memoryStorage({ 'yahel.slot': '0' });
    const { session } = make({ '/api/v1/auth/refresh': () => fail(status, code) }, { slotStorage });

    await expect(session.init()).resolves.toBeUndefined();

    expect(session.store.getState().status).toBe('signed-out');
    expect(slotStorage.data).toEqual({});
  });

  it('refreshes the slot in use when the access token is refused, and asks again with the new one', async () => {
    const seen: string[] = [];
    const { session } = make({
      '/api/v1/auth/login': () => ok(tokens(2, 'h-2', 'old')),
      '/api/v1/auth/refresh': () => ok(tokens(2, 'h-2', 'new')),
      '/api/v1/me': (_, init) => {
        seen.push(authOf(init)!);
        return authOf(init) === 'Bearer old' && seen.length > 1 ? fail(401, 'SESSION_EXPIRED') : ok(profile);
      },
    });
    await session.signIn('a@b.c', 'p');

    await expect(session.api.me.get()).resolves.toEqual(profile);

    expect(seen).toEqual(['Bearer old', 'Bearer old', 'Bearer new']);
  });

  it('signs the slot out, here and in the other tabs, when its refresh is refused', async () => {
    const channels = tabChannels();
    const other = make({}, { channel: channels.open() });
    let signedIn = false;
    const { session, events } = make({ '/api/v1/auth/login': () => ok(tokens(0)), '/api/v1/auth/refresh': () => fail(401, 'SESSION_EXPIRED'), '/api/v1/me': () => (signedIn ? fail(401, 'SESSION_EXPIRED') : ok(profile)) }, { channel: channels.open() });
    await session.signIn('a@b.c', 'p');
    signedIn = true;
    other.events.length = 0;

    await expect(session.api.me.get()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });

    expect(session.store.getState()).toMatchObject({ status: 'signed-out', slot: null });
    expect(events).toContainEqual({ type: 'signed-out', slot: 0 });
    expect(other.events).toContainEqual({ type: 'accounts-changed' });
  });

  it('tells the caller when the server ended every session of the account, and signs the slot out', async () => {
    let signedIn = false;
    const { session } = make({ '/api/v1/auth/login': () => ok(tokens(0)), '/api/v1/me': () => (signedIn ? fail(401, 'SESSION_EXPIRED') : ok(profile)), '/api/v1/auth/refresh': () => fail(401, 'TOKEN_REUSE_DETECTED') });
    await session.signIn('a@b.c', 'p');
    signedIn = true;

    await expect(session.api.me.get()).rejects.toMatchObject({ status: 401, code: 'TOKEN_REUSE_DETECTED' });
    expect(session.store.getState().status).toBe('signed-out');
  });

  it('keeps the slot when the refresh could not be answered at all', async () => {
    let up = true;
    const { session } = make({ '/api/v1/auth/login': () => ok(tokens(0)), '/api/v1/me': () => (up ? ok(profile) : fail(401, 'SESSION_EXPIRED')), '/api/v1/auth/refresh': () => fail(503, 'SERVICE_UNAVAILABLE') });
    await session.signIn('a@b.c', 'p');
    up = false;

    await expect(session.api.me.get()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(session.store.getState()).toMatchObject({ status: 'signed-in', slot: 0 });
  });

  it('drops everything for a slot that now answers with another account’s handle, and never retries the request as that account', async () => {
    let refreshed = 0;
    const meCalls: string[] = [];
    const { session, events } = make({
      '/api/v1/auth/login': () => ok(tokens(0, 'h-amara', 'amara-access')),
      '/api/v1/auth/refresh': () => {
        refreshed += 1;
        return ok(tokens(0, 'h-kofi', 'kofi-access'));
      },
      '/api/v1/me': (_, init) => {
        meCalls.push(authOf(init)!);
        if (meCalls.length === 1) return ok(profile);
        return authOf(init) === 'Bearer kofi-access' ? ok(kofi) : fail(401, 'SESSION_EXPIRED');
      },
    });
    await session.signIn('amara@northwind.example', 'p');

    await expect(session.api.me.get()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });

    expect(refreshed).toBe(1);
    expect(meCalls).not.toContain('Bearer kofi-access');
    expect(events).toContainEqual({ type: 'changed-hands', slot: 0 });
    expect(session.store.getState()).toMatchObject({ status: 'signed-out', profile: null, handle: null });
  });

  it('accepts a refresh that carries no handle, as a session made before handles did', async () => {
    let signedIn = false;
    const { session } = make({
      '/api/v1/auth/login': () => ok(tokens(0, 'h-0', 'a')),
      '/api/v1/auth/refresh': () => ok({ ...tokens(0, 'h-0', 'b'), handle: null }),
      '/api/v1/me': (_, init) => (signedIn && authOf(init) === 'Bearer a' ? fail(401, 'SESSION_EXPIRED') : ok(profile)),
    });
    await session.signIn('a@b.c', 'p');
    signedIn = true;

    await expect(session.api.me.get()).resolves.toEqual(profile);
    expect(session.store.getState()).toMatchObject({ status: 'signed-in', handle: 'h-0' });
  });

  it('refreshes a slot once for many refused requests at the same time', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let refreshes = 0;
    const { session } = make({
      '/api/v1/auth/refresh': async () => {
        refreshes += 1;
        await gate;
        return ok(tokens(0, 'h-0', 'new'));
      },
      '/api/v1/me': (_, init) => (authOf(init) === 'Bearer new' ? ok(profile) : fail(401, 'SESSION_EXPIRED')),
    });
    const established = session.establish(tokens(0, 'h-0', 'old'));

    const all = Promise.all([session.api.me.get(), session.api.me.get(), session.api.me.get()]);
    await vi.waitFor(() => expect(refreshes).toBe(1));
    release();

    await expect(all).resolves.toEqual([profile, profile, profile]);
    await established;
    expect(refreshes).toBe(1);
  });

  it('takes turns with the other tabs through a lock named after the slot', async () => {
    const names: string[] = [];
    const locks = {
      request: async <T,>(name: string, callback: () => Promise<T>) => {
        names.push(name);
        return callback();
      },
    };
    const { session } = make({ '/api/v1/auth/refresh': () => ok(tokens(5)), '/api/v1/me': () => ok(profile) }, { locks });

    await session.init(5);

    expect(names).toEqual(['yahel.refresh.5']);
  });
});

describe('createSession: several accounts', () => {
  const accounts = [
    { handle: 'h-0', slot: 0, displayName: 'Amara Okafor', initials: 'AO', avatarUrl: null, email: profile.email, kind: 'personal', organisation: null, role: null, signedIn: true },
    { handle: 'h-1', slot: 1, displayName: 'Kofi Mensah', initials: 'KM', avatarUrl: null, email: kofi.email, kind: 'business', organisation: 'Northwind Studio', role: 'ADMIN', signedIn: true },
  ];

  it('lists the browser’s accounts and switches to a signed-in one without a password', async () => {
    const { session, fetchMock } = make({
      '/api/v1/auth/accounts': () => ok(accounts),
      '/api/v1/auth/login': () => ok(tokens(0)),
      '/api/v1/auth/refresh': (body) => ok(tokens(Number(body.slot))),
      '/api/v1/me': (_, init) => ok(authOf(init) === 'Bearer access-1' ? kofi : profile),
    });
    await session.signIn(profile.email, 'p');

    await expect(session.accounts()).resolves.toEqual(accounts);
    await expect(session.switchTo(1, 'h-1')).resolves.toBe(true);

    expect(session.store.getState()).toEqual({ status: 'signed-in', profile: kofi, slot: 1, handle: 'h-1' });
    expect(bodiesTo(fetchMock, '/api/v1/auth/refresh')).toEqual([{ slot: 1 }]);

    await expect(session.switchTo(0)).resolves.toBe(true);
    expect(session.store.getState()).toMatchObject({ profile, slot: 0 });
    expect(bodiesTo(fetchMock, '/api/v1/auth/refresh')).toHaveLength(1);
  });

  it('refuses to switch to a slot that is signed out, or holds another account than the one picked, and stays where it was', async () => {
    const { session } = make({
      '/api/v1/auth/login': () => ok(tokens(0)),
      '/api/v1/auth/refresh': (body) => (body.slot === 1 ? fail(401, 'SESSION_EXPIRED') : ok(tokens(2, 'h-someone-else'))),
      '/api/v1/me': () => ok(profile),
    });
    await session.signIn(profile.email, 'p');

    await expect(session.switchTo(1)).resolves.toBe(false);
    await expect(session.switchTo(2, 'h-2')).resolves.toBe(false);
    expect(session.store.getState()).toMatchObject({ status: 'signed-in', slot: 0, handle: 'h-0' });
  });

  it('signs one account out by its slot and counts one already signed out as done', async () => {
    const channels = tabChannels();
    const other = make({}, { channel: channels.open() });
    const { session, fetchMock } = make({ '/api/v1/auth/login': () => ok(tokens(0)), '/api/v1/me': () => ok(profile), '/api/v1/auth/logout': (body) => (body.slot === 3 ? fail(401, 'SESSION_EXPIRED') : ok({ slot: body.slot })) }, { channel: channels.open() });
    await session.signIn(profile.email, 'p');

    await session.signOut(3);
    expect(session.store.getState()).toMatchObject({ status: 'signed-in', slot: 0 });

    await session.signOut();
    expect(session.store.getState()).toEqual({ status: 'signed-out', profile: null, slot: null, handle: null });
    expect(bodiesTo(fetchMock, '/api/v1/auth/logout')).toEqual([{ slot: 3 }, { slot: 0 }]);
    expect(other.events.filter((event) => event.type === 'accounts-changed').length).toBeGreaterThanOrEqual(2);
  });

  it('forgets the account locally even when signing it out fails', async () => {
    const { session } = make({ '/api/v1/auth/login': () => ok(tokens(0)), '/api/v1/me': () => ok(profile), '/api/v1/auth/logout': () => fail(500, 'INTERNAL_ERROR') });
    await session.signIn('a@b.c', 'p');

    await expect(session.signOut()).rejects.toMatchObject({ status: 500 });

    expect(session.store.getState()).toEqual({ status: 'signed-out', profile: null, slot: null, handle: null });
  });

  it('signs every account in the browser out, and removes one by its handle', async () => {
    const { session, fetchMock } = make({ '/api/v1/auth/login': () => ok(tokens(0)), '/api/v1/me': () => ok(profile), '/api/v1/auth/logout-browser': () => ok(null), '/api/v1/auth/accounts/h-0': () => ok({ handle: 'h-0' }) });
    await session.signIn('a@b.c', 'p');
    await session.signOutAll();
    expect(session.store.getState().status).toBe('signed-out');

    await session.signIn('a@b.c', 'p');
    await session.removeAccount('h-0');
    expect(session.store.getState().status).toBe('signed-out');
    expect(fetchMock.mock.calls.find(([url]) => String(url).endsWith('/accounts/h-0'))![1]).toMatchObject({ method: 'DELETE' });
  });

  it('follows the other tabs: the account in use signed out, removed, or its slot given to another account', async () => {
    const channels = tabChannels();
    const elsewhere = make({ '/api/v1/auth/logout': (body) => ok({ slot: body.slot }), '/api/v1/auth/accounts/h-0': () => ok({ handle: 'h-0' }), '/api/v1/auth/login': () => ok(tokens(0, 'h-new')), '/api/v1/me': () => ok(kofi) }, { channel: channels.open() });
    const { session, events } = make({ '/api/v1/auth/login': () => ok(tokens(0)), '/api/v1/me': () => ok(profile) }, { channel: channels.open() });

    await session.signIn(profile.email, 'p');
    await elsewhere.session.signOut(0);
    expect(session.store.getState().status).toBe('signed-out');
    expect(events).toEqual([{ type: 'signed-out', slot: 0 }, { type: 'accounts-changed' }]);

    events.length = 0;
    await session.signIn(profile.email, 'p');
    await elsewhere.session.removeAccount('h-0');
    expect(events).toEqual([{ type: 'signed-out', slot: 0 }, { type: 'accounts-changed' }]);

    events.length = 0;
    await session.signIn(profile.email, 'p');
    await elsewhere.session.signIn(kofi.email, 'p');
    expect(events).toEqual([{ type: 'changed-hands', slot: 0 }, { type: 'accounts-changed' }]);
    expect(session.store.getState().profile).toBeNull();
  });
});
