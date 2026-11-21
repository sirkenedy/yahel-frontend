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

  it.each([
    ['register', '/api/v1/auth/register', { email: 'amara.okafor@yahel.example', firstName: 'Amara', lastName: 'Okafor', dateOfBirth: '1994-03-14T00:00:00.000Z', password: 'Sunrise-over-Lekki-94' }, { message: 'Registration successful.' }],
    ['mfaChallenge', '/api/v1/auth/mfa/challenge', { challengeToken: 'c-1', code: '482910', deviceId: 'd', trustDevice: false }, { accessToken: 'a', refreshToken: 'r', expiresIn: 900, tokenType: 'Bearer' }],
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

  it('me.recovery.get reads the masked methods as the signed-in person', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true, data: recovery }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', getAccessToken: () => 'token-1', fetch: fetchMock });

    await expect(api.me.recovery.get()).resolves.toEqual(recovery);
    expect(fetchMock.mock.calls[0]![0]).toBe('http://api.test/api/v1/me/recovery');
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe('Bearer token-1');
  });

  it('surfaces a taken address from register with its backend code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(409, { success: false, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });

    await expect(api.auth.register({ email: 'amara@yahel.example', firstName: 'Amara', lastName: '', dateOfBirth: '1994-03-14T00:00:00.000Z', password: 'Sunrise-over-Lekki-94' })).rejects.toMatchObject({ status: 409, code: 'EMAIL_ALREADY_EXISTS' });
  });

  it('surfaces a refused second-step code with its backend code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(401, { success: false, code: 'MFA_INVALID', message: 'Invalid or expired MFA code' }));
    const api = createApiClient({ baseUrl: 'http://api.test/api', fetch: fetchMock });

    await expect(api.auth.mfaChallenge({ challengeToken: 'c-1', code: '000000', deviceId: 'd' })).rejects.toMatchObject({ status: 401, code: 'MFA_INVALID' });
  });
});
