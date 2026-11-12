import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client';
import { ApiError } from './errors';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('createApiClient', () => {
  it('unwraps the success envelope and sends the bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true, data: { id: '1', email: 'a@b.c' }, meta: {} }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await expect(api.me.get()).resolves.toEqual({ id: '1', email: 'a@b.c' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://api.test/api/v1/me');
    expect(init.headers.Authorization).toBe('Bearer token-1');
  });

  it('throws an ApiError carrying the backend code and request id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(400, { success: false, code: 'VALIDATION_ERROR', message: 'Request validation failed', meta: { requestId: 'r-1', validationErrors: ['email must be an email'] } }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });

    const error = await api.auth.login({ email: 'x', password: 'y', deviceId: 'd' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', requestId: 'r-1', validationErrors: ['email must be an email'] });
  });

  it('refreshes once on 401 and retries the request', async () => {
    let token = 'expired';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }))
      .mockResolvedValueOnce(json(200, { success: true, data: { id: '1' } }));
    const refreshSession = vi.fn().mockImplementation(async () => {
      token = 'fresh';
      return true;
    });
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => token, refreshSession, fetch: fetchMock });

    await expect(api.me.get()).resolves.toEqual({ id: '1' });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[1]![1].headers.Authorization).toBe('Bearer fresh');
  });

  it('does not retry twice and surfaces the 401', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json(401, { success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 't', refreshSession: async () => true, fetch: fetchMock });

    await expect(api.me.get()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports a network failure as status 0', async () => {
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: vi.fn().mockRejectedValue(new TypeError('failed')) });

    await expect(api.auth.login({ email: 'a@b.c', password: 'p', deviceId: 'd' })).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
