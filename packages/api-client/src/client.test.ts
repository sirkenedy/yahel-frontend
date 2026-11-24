import { describe, expect, it, vi } from 'vitest';
import { MAX_RETRY_AFTER, createApiClient } from './client';
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

  it('sends the browser’s cookies and says it is the web client on every request, signed in or not', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true, data: [] }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await api.auth.accounts();
    await api.me.get();

    for (const [, init] of fetchMock.mock.calls) {
      expect(init.credentials).toBe('include');
      expect(init.headers['X-Yahel-Client']).toBe('web');
    }
  });

  it.each([
    ['refresh', () => [{ slot: 2 }], 'POST', '/api/v1/auth/refresh', { slot: 2 }, { accessToken: 'a', expiresIn: 900, slot: 2, handle: 'h-2' }],
    ['logout', () => [{ slot: 2 }], 'POST', '/api/v1/auth/logout', { slot: 2 }, { slot: 2 }],
    ['logoutBrowser', () => [], 'POST', '/api/v1/auth/logout-browser', undefined, null],
    ['accounts', () => [], 'GET', '/api/v1/auth/accounts', undefined, [{ handle: 'h-0', slot: 0, signedIn: true }]],
    ['removeAccount', () => ['h/1'], 'DELETE', '/api/v1/auth/accounts/h%2F1', undefined, { handle: 'h/1' }],
  ] as const)('auth.%s reaches the browser’s accounts by slot or handle, with cookies and no bearer token', async (method, args, verb, path, body, data) => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true, data }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await expect((api.auth[method] as (...input: unknown[]) => Promise<unknown>)(...args())).resolves.toEqual(data);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`http://api.test${path}`);
    expect(init.method).toBe(verb);
    expect(init.body === undefined ? undefined : JSON.parse(init.body)).toEqual(body);
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.credentials).toBe('include');
  });

  it('throws an ApiError carrying the backend code and request id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(400, { success: false, code: 'VALIDATION_ERROR', message: 'Request validation failed', meta: { requestId: 'r-1', validationErrors: ['email must be an email'] } }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });

    const error = await api.auth.login({ email: 'x', password: 'y' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', requestId: 'r-1', validationErrors: ['email must be an email'] });
  });

  it('refreshes once when the access token is refused and retries the request', async () => {
    let token = 'expired';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { success: false, code: 'SESSION_EXPIRED', message: 'Your session has expired' }))
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
    const fetchMock = vi.fn().mockImplementation(async () => json(401, { success: false, code: 'SESSION_EXPIRED', message: 'Your session has expired' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 't', refreshSession: async () => true, fetch: fetchMock });

    await expect(api.me.get()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports a network failure as status 0', async () => {
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: vi.fn().mockRejectedValue(new TypeError('failed')) });

    await expect(api.auth.login({ email: 'a@b.c', password: 'p' })).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it.each([
    ['register', '/api/v1/auth/register', { email: 'amara.okafor@yahel.example', firstName: 'Amara', lastName: 'Okafor', dateOfBirth: '1994-03-14T00:00:00.000Z', password: 'Sunrise-over-Lekki-94' }, { message: 'Registration successful.' }],
    ['mfaChallenge', '/api/v1/auth/mfa/challenge', { challengeToken: 'c-1', code: '482910', trustDevice: false }, { accessToken: 'a', expiresIn: 900, tokenType: 'Bearer', slot: 0, handle: 'h-0' }],
    ['forgotPassword', '/api/v1/auth/forgot-password', { email: 'amara@northwind.example' }, { message: 'If this email exists, a reset link has been sent' }],
    ['resetPassword', '/api/v1/auth/reset-password', { email: 'amara@northwind.example', token: 'A7kZq2', password: 'New-passw0rd-here' }, { message: 'Password reset successfully. Please log in again.' }],
    ['verifyEmail', '/api/v1/auth/verify-email', { email: 'amara@northwind.example', token: 'A7kZq2' }, { message: 'Email verified successfully' }],
    ['resendVerification', '/api/v1/auth/verify-email/resend', { email: 'amara@northwind.example' }, { message: 'If this email exists and is unverified, a new link has been sent' }],
  ] as const)('auth.%s posts its body to %s without a bearer token and unwraps the result', async (method, path, body, data) => {
    const fetchMock = vi.fn().mockResolvedValue(json(201, { success: true, data }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await expect((api.auth[method] as (input: typeof body) => Promise<unknown>)(body)).resolves.toEqual(data);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`http://api.test${path}`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(body);
    expect(init.headers.Authorization).toBeUndefined();
  });

  it.each([
    ['sendPhoneOtp', '/api/v1/auth/phone/send-otp', { phone: '+2348035550142' }, { message: 'Verification code sent.' }],
    ['verifyPhoneOtp', '/api/v1/auth/phone/verify', { phone: '+2348035550142', code: 'A7kZq2' }, { message: 'Phone number verified successfully.' }],
  ] as const)('auth.%s posts its body to %s as the signed-in person', async (method, path, body, data) => {
    const fetchMock = vi.fn().mockResolvedValue(json(201, { success: true, data }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await expect((api.auth[method] as (input: typeof body) => Promise<unknown>)(body)).resolves.toEqual(data);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`http://api.test${path}`);
    expect(JSON.parse(init.body)).toEqual(body);
    expect(init.headers.Authorization).toBe('Bearer token-1');
  });

  const recovery = { recoveryEmail: { configured: false, value: null, lastUpdatedAt: null, pending: { value: 'a***@personal.example', requestedAt: '2026-11-22T10:00:00.000Z', usableAt: '2026-11-29T10:00:00.000Z' } }, phone: { configured: false, verified: false, value: null, lastUpdatedAt: null, pending: null } };

  it.each([
    ['updateEmail', 'PATCH', '/api/v1/me/recovery/email', { recoveryEmail: 'amara@personal.example' }],
    ['updatePhone', 'PATCH', '/api/v1/me/recovery/phone', { phone: '+2348035550142' }],
    ['verifyPhone', 'POST', '/api/v1/me/recovery/phone/verify', { code: 'A7kZq2' }],
  ] as const)('me.recovery.%s sends its body as the signed-in person and returns the masked methods', async (method, verb, path, body) => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true, data: recovery }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await expect((api.me.recovery[method] as (input: typeof body) => Promise<unknown>)(body)).resolves.toEqual(recovery);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`http://api.test${path}`);
    expect(init.method).toBe(verb);
    expect(JSON.parse(init.body)).toEqual(body);
    expect(init.headers.Authorization).toBe('Bearer token-1');
  });

  it('me.recovery.get asks for the masked methods as the signed-in person', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true, data: recovery }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await expect(api.me.recovery.get()).resolves.toEqual(recovery);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://api.test/api/v1/me/recovery');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer token-1');
  });

  it('does not refresh or resend when a signed-in request is refused for its own reasons, such as a wrong code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(401, { success: false, code: 'INVALID_TOKEN', message: 'Invalid or expired phone verification code' }));
    const refreshSession = vi.fn().mockResolvedValue(true);
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', refreshSession, fetch: fetchMock });

    await expect(api.me.recovery.verifyPhone({ code: 'wrong1' })).rejects.toMatchObject({ status: 401, code: 'INVALID_TOKEN' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('does not refresh on a 401 that carries no code at all', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    const refreshSession = vi.fn().mockResolvedValue(true);
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', refreshSession, fetch: fetchMock });

    await expect(api.me.get()).rejects.toMatchObject({ status: 401 });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('surfaces a taken address from register with its backend code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(409, { success: false, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });

    await expect(api.auth.register({ email: 'amara@yahel.example', firstName: 'Amara', lastName: '', dateOfBirth: '1994-03-14T00:00:00.000Z', password: 'Sunrise-over-Lekki-94' })).rejects.toMatchObject({ status: 409, code: 'EMAIL_ALREADY_EXISTS' });
  });

  it('surfaces a refused second-step code with its backend code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(401, { success: false, code: 'MFA_INVALID', message: 'Invalid or expired MFA code' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });

    await expect(api.auth.mfaChallenge({ challengeToken: 'c-1', code: '000000' })).rejects.toMatchObject({ status: 401, code: 'MFA_INVALID' });
  });

  it('says how long to wait when a refusal carries Retry-After, as seconds or as a date', async () => {
    const refused = (retryAfter: string) => new Response(JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'ThrottlerException: Too Many Requests' } }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': retryAfter } });
    const fetchMock = vi.fn().mockResolvedValueOnce(refused('42')).mockResolvedValueOnce(refused(new Date(Date.now() + 90_000).toUTCString())).mockResolvedValueOnce(json(429, { success: false, code: 'TOO_MANY_REQUESTS' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });
    const login = () => api.auth.login({ email: 'amara@northwind.example', password: 'x' }).catch((error: unknown) => error);

    expect(await login()).toMatchObject({ status: 429, retryAfter: 42 });
    const dated = (await login()) as { retryAfter: number };
    expect(dated.retryAfter).toBeGreaterThan(85);
    expect(dated.retryAfter).toBeLessThanOrEqual(90);
    expect(await login()).toMatchObject({ status: 429, retryAfter: undefined });
  });

  it('registers a business with everything the backend asks for, and answers with the workspace', async () => {
    const created = { message: 'ok', identity: { id: 'i1', email: 'amara@northwind.example', emailVerified: false }, tenant: { id: 't1', slug: 'northwind-studio', displayName: 'Northwind Studio', status: 'pending_setup' }, domain: { domain: 'northwind.example', status: 'pending' } };
    const fetchMock = vi.fn().mockResolvedValue(json(201, { success: true, data: created }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });
    const body = { email: 'amara@northwind.example', password: 'Northwind Lagos 2026!', firstName: 'Amara', lastName: 'Okafor', businessName: 'Northwind Studio', slug: 'northwind-studio', country: { name: 'Nigeria', code: 'NG', currency: 'NGN' }, dateOfBirth: '1994-03-14T00:00:00.000Z', employeeCount: 10, domain: 'northwind.example' };

    await expect(api.auth.registerBusiness(body)).resolves.toEqual(created);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/api/v1/auth/register-business');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(body);
    expect(new Headers(init.headers).has('Authorization')).toBe(false);
  });

  it('surfaces a claimed domain with its backend code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(409, { success: false, code: 'DOMAIN_CONFLICT', message: 'This domain is already claimed by another organization' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });

    await expect(api.auth.registerBusiness({} as never)).rejects.toMatchObject({ status: 409, code: 'DOMAIN_CONFLICT' });
  });

  it('never passes on a wait longer than a day, and ignores a Retry-After that is not a time', async () => {
    const refused = (retryAfter: string) => new Response(JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'x' } }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': retryAfter } });
    const headers = ['999999999999999999999999', new Date(Date.now() + 400 * 86_400_000).toUTCString(), 'soon', '-5', '0', '1e9', new Date(Date.now() - 60_000).toUTCString()];
    const fetchMock = vi.fn();
    headers.forEach((header) => fetchMock.mockResolvedValueOnce(refused(header)));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });
    const login = () => api.auth.login({ email: 'amara@northwind.example', password: 'x' }).catch((error: unknown) => error as { retryAfter?: number });
    const waits: unknown[] = [];
    for (let asked = 0; asked < headers.length; asked += 1) waits.push(((await login()) as { retryAfter?: number }).retryAfter);

    expect(waits).toEqual([MAX_RETRY_AFTER, MAX_RETRY_AFTER, undefined, undefined, undefined, undefined, undefined]);
  });

  it('answers with the refresh failure itself when refreshing the session rejects', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(401, { success: false, code: 'SESSION_EXPIRED' }));
    const reuse = new ApiError({ status: 401, code: 'TOKEN_REUSE_DETECTED', message: 'revoked' });
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', refreshSession: () => Promise.reject(reuse), fetch: fetchMock });

    await expect(api.me.get()).rejects.toBe(reuse);
  });
});
