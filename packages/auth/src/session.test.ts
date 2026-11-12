import { describe, expect, it, vi } from 'vitest';
import { createSession } from './session';
import type { KeyValueStorage } from './session';

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
const tokens = { accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 900, tokenType: 'Bearer' };
const profile = { id: '1', globalId: 'g1', email: 'amara@northwind.example', firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null };

const routeFetch = (routes: Record<string, () => Response>) =>
  vi.fn(async (url: string | URL | Request) => {
    const path = new URL(String(url)).pathname;
    const handler = routes[path];
    if (!handler) throw new Error(`Unexpected request to ${path}`);
    return handler();
  });

describe('createSession', () => {
  it('signs in, keeps the refresh token in token storage only, and loads the profile', async () => {
    const tokenStorage = memoryStorage();
    const deviceStorage = memoryStorage();
    const fetchMock = routeFetch({ '/api/v1/auth/login': () => ok(tokens), '/api/v1/me': () => ok(profile) });
    const session = createSession({ baseUrl: 'http://api.test/api', tokenStorage, deviceStorage, fetch: fetchMock as typeof fetch });

    await expect(session.signIn('amara@northwind.example', 'correct horse')).resolves.toEqual({ ok: true });

    expect(session.store.getState()).toEqual({ status: 'signed-in', profile });
    expect(tokenStorage.data).toEqual({ 'yahel.refresh-token': 'refresh-1' });
    expect(JSON.stringify(tokenStorage.data)).not.toContain('access-1');
    expect(deviceStorage.data['yahel.device-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reports that a second factor is required without signing in', async () => {
    const fetchMock = routeFetch({ '/api/v1/auth/login': () => ok({ mfaRequired: true, challengeToken: 'challenge-1' }) });
    const session = createSession({ baseUrl: 'http://api.test/api', tokenStorage: memoryStorage(), deviceStorage: memoryStorage(), fetch: fetchMock as typeof fetch });

    await expect(session.signIn('a@b.c', 'p')).resolves.toEqual({ ok: false, reason: 'mfa-required', challengeToken: 'challenge-1' });
    expect(session.store.getState().status).toBe('unknown');
  });

  it('restores a session from a stored refresh token', async () => {
    const tokenStorage = memoryStorage({ 'yahel.refresh-token': 'refresh-0' });
    const fetchMock = routeFetch({ '/api/v1/auth/refresh': () => ok(tokens), '/api/v1/me': () => ok(profile) });
    const session = createSession({ baseUrl: 'http://api.test/api', tokenStorage, deviceStorage: memoryStorage(), fetch: fetchMock as typeof fetch });

    await session.init();

    expect(session.store.getState().status).toBe('signed-in');
    expect(tokenStorage.data['yahel.refresh-token']).toBe('refresh-1');
  });

  it('ends signed out when there is no refresh token, or it is rejected', async () => {
    const none = createSession({ baseUrl: 'http://api.test/api', tokenStorage: memoryStorage(), deviceStorage: memoryStorage(), fetch: routeFetch({}) as typeof fetch });
    await none.init();
    expect(none.store.getState().status).toBe('signed-out');

    const tokenStorage = memoryStorage({ 'yahel.refresh-token': 'stale' });
    const rejected = createSession({ baseUrl: 'http://api.test/api', tokenStorage, deviceStorage: memoryStorage(), fetch: routeFetch({ '/api/v1/auth/refresh': () => fail(401, 'INVALID_REFRESH_TOKEN') }) as typeof fetch });
    await rejected.init();
    expect(rejected.store.getState().status).toBe('signed-out');
    expect(tokenStorage.data).toEqual({});
  });

  it('clears local state on sign-out even when the server call fails', async () => {
    const tokenStorage = memoryStorage();
    const fetchMock = routeFetch({ '/api/v1/auth/login': () => ok(tokens), '/api/v1/me': () => ok(profile), '/api/v1/auth/logout': () => fail(500, 'INTERNAL_ERROR') });
    const session = createSession({ baseUrl: 'http://api.test/api', tokenStorage, deviceStorage: memoryStorage(), fetch: fetchMock as typeof fetch });
    await session.signIn('a@b.c', 'p');

    await expect(session.signOut()).rejects.toMatchObject({ status: 500 });

    expect(session.store.getState()).toEqual({ status: 'signed-out', profile: null });
    expect(tokenStorage.data).toEqual({});
  });
});
