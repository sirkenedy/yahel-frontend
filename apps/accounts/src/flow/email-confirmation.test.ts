import { ApiError } from '@yahel/api-client';
import { describe, expect, it, vi } from 'vitest';
import { confirmAndSignIn, resendConfirmation, signInOrConfirm } from './email-confirmation';

const unconfirmed = new ApiError({ status: 403, code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' });

const sessionWith = (signIn: () => Promise<unknown>) => {
  const auth = { resendVerification: vi.fn().mockResolvedValue({ message: 'sent' }), verifyEmail: vi.fn().mockResolvedValue({ message: 'ok' }) };
  return { session: { signIn: vi.fn(signIn), api: { auth } } as unknown as Parameters<typeof signInOrConfirm>[0], auth };
};

describe('signInOrConfirm', () => {
  it('passes on a sign-in that worked or needs a second step', async () => {
    const { session, auth } = sessionWith(async () => ({ ok: false, reason: 'mfa-required', challengeToken: 'c-1' }));

    await expect(signInOrConfirm(session, 'amara@northwind.example', 'pw')).resolves.toEqual({ ok: false, reason: 'mfa-required', challengeToken: 'c-1' });
    expect(auth.resendVerification).not.toHaveBeenCalled();
  });

  it('asks for a fresh code when the password matched an address still to be confirmed, even if that request fails', async () => {
    const { session, auth } = sessionWith(async () => Promise.reject(unconfirmed));
    auth.resendVerification.mockRejectedValue(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }));

    await expect(signInOrConfirm(session, 'amara@northwind.example', 'pw')).resolves.toEqual({ ok: false, reason: 'unconfirmed' });
    expect(auth.resendVerification).toHaveBeenCalledWith({ email: 'amara@northwind.example' });
  });

  it('lets any other refusal through, and asks for no code', async () => {
    const wrong = new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' });
    const { session, auth } = sessionWith(async () => Promise.reject(wrong));

    await expect(signInOrConfirm(session, 'amara@northwind.example', 'pw')).rejects.toBe(wrong);
    expect(auth.resendVerification).not.toHaveBeenCalled();
  });
});

describe('confirmAndSignIn', () => {
  it('submits nothing without a password proven in this visit', async () => {
    const { session, auth } = sessionWith(async () => ({ ok: true }));

    await expect(confirmAndSignIn(session, 'amara@northwind.example', 'B4nQ7x', null, vi.fn())).rejects.toThrow('No password has been proven');
    expect(auth.verifyEmail).not.toHaveBeenCalled();
  });

  it('confirms, says so at once, then signs in with the proven password', async () => {
    const { session, auth } = sessionWith(async () => ({ ok: true }));
    const confirmed = vi.fn();

    await expect(confirmAndSignIn(session, 'amara@northwind.example', 'B4nQ7x', 'pw', confirmed)).resolves.toEqual({ ok: true });
    expect(auth.verifyEmail).toHaveBeenCalledWith({ email: 'amara@northwind.example', token: 'B4nQ7x' });
    expect(confirmed).toHaveBeenCalledTimes(1);
    expect(session.signIn).toHaveBeenCalledWith('amara@northwind.example', 'pw');
  });

  it('keeps the confirmation when the sign-in after it fails', async () => {
    const { session } = sessionWith(async () => Promise.reject(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' })));
    const confirmed = vi.fn();

    await expect(confirmAndSignIn(session, 'amara@northwind.example', 'B4nQ7x', 'pw', confirmed)).resolves.toEqual({ ok: false, reason: 'sign-in-failed' });
    expect(confirmed).toHaveBeenCalledTimes(1);
  });

  it('a refused code confirms nothing', async () => {
    const { session, auth } = sessionWith(async () => ({ ok: true }));
    auth.verifyEmail.mockRejectedValue(new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'x' }));
    const confirmed = vi.fn();

    await expect(confirmAndSignIn(session, 'amara@northwind.example', 'B4nQ7x', 'pw', confirmed)).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    expect(confirmed).not.toHaveBeenCalled();
    expect(session.signIn).not.toHaveBeenCalled();
  });
});

describe('resendConfirmation', () => {
  it('asks for another code only with the proof in hand', async () => {
    const { session, auth } = sessionWith(async () => ({ ok: true }));

    await expect(resendConfirmation(session, 'amara@northwind.example', null)).rejects.toThrow('No password has been proven');
    await resendConfirmation(session, 'amara@northwind.example', 'pw');
    expect(auth.resendVerification).toHaveBeenCalledTimes(1);
  });
});
