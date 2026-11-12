import { ApiError } from '@yahel/api-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { authMessages as m } from './messages';
import { SignInForm } from './sign-in-form';

const setup = (signIn = vi.fn().mockResolvedValue({ ok: true })) => {
  const onSignedIn = vi.fn();
  render(<SignInForm session={{ signIn }} onSignedIn={onSignedIn} />);
  return { signIn, onSignedIn, user: userEvent.setup() };
};

const fill = async (user: ReturnType<typeof userEvent.setup>, email: string, password: string) => {
  if (email) await user.type(screen.getByLabelText(m.emailLabel), email);
  if (password) await user.type(screen.getByLabelText(m.passwordLabel), password);
  await user.click(screen.getByRole('button', { name: m.submit }));
};

describe('SignInForm', () => {
  it('signs in with trimmed email and reports success', async () => {
    const { signIn, onSignedIn, user } = setup();

    await fill(user, ' amara@northwind.example ', 'correct horse battery');

    expect(signIn).toHaveBeenCalledWith('amara@northwind.example', 'correct horse battery');
    expect(onSignedIn).toHaveBeenCalledTimes(1);
  });

  it('names missing fields, focuses the first, and does not call the server', async () => {
    const { signIn, user } = setup();

    await fill(user, '', '');

    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(m.emailLabel)).toHaveAccessibleDescription(m.emailRequired);
    expect(screen.getByLabelText(m.passwordLabel)).toHaveAccessibleDescription(m.passwordRequired);
    expect(screen.getByLabelText(m.emailLabel)).toHaveFocus();
  });

  it('rejects a malformed email before submitting', async () => {
    const { signIn, user } = setup();

    await fill(user, 'not-an-email', 'secret');

    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(m.emailLabel)).toHaveAccessibleDescription(m.emailInvalid);
  });

  it.each([
    [new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }), m.wrongCredentials],
    [new ApiError({ status: 429, code: 'RATE_LIMITED', message: 'x' }), m.tooManyAttempts],
    [new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' }), m.network],
    [new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }), m.unexpected],
    [new Error('boom'), m.unexpected],
  ])('explains a failed attempt without leaking server detail', async (error, expected) => {
    const { onSignedIn, user } = setup(vi.fn().mockRejectedValue(error));

    await fill(user, 'amara@northwind.example', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent(expected);
    expect(onSignedIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(m.passwordLabel)).toHaveValue('wrong');
  });

  it('says plainly when the account needs a second step it cannot complete', async () => {
    const { onSignedIn, user } = setup(vi.fn().mockResolvedValue({ ok: false, reason: 'mfa-required', challengeToken: 'c' }));

    await fill(user, 'amara@northwind.example', 'secret');

    expect(await screen.findByRole('alert')).toHaveTextContent(m.mfaNotSupported);
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  describe('showing the password', () => {
    it('toggles visibility, keeps the value and does not submit', async () => {
      const { signIn, user } = setup();
      // A valid email, so a submission would reach signIn: the assertion below can fail.
      await user.type(screen.getByLabelText(m.emailLabel), 'amara@northwind.example');
      await user.type(screen.getByLabelText(m.passwordLabel), 'secret value');

      await user.click(screen.getByRole('button', { name: m.showPassword }));
      expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(m.passwordLabel)).toHaveValue('secret value');

      await user.click(screen.getByRole('button', { name: m.hidePassword }));
      expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(m.passwordLabel)).toHaveValue('secret value');
      expect(signIn).not.toHaveBeenCalled();
    });

    it.each([
      ['a submit stopped by validation', '', async (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: m.submit }))],
      ['Enter in the revealed field', 'amara@northwind.example', async (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Enter}')],
    ])('hides the password again on %s', async (_name, email, act) => {
      const { user } = setup(vi.fn().mockRejectedValue(new Error('boom')));
      if (email) await user.type(screen.getByLabelText(m.emailLabel), email);
      await user.type(screen.getByLabelText(m.passwordLabel), 'wrong');
      await user.click(screen.getByRole('button', { name: m.showPassword }));
      await user.click(screen.getByLabelText(m.passwordLabel));

      await act(user);

      await waitFor(() => expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('type', 'password'));
      expect(screen.getByLabelText(m.passwordLabel)).toHaveValue('wrong');
    });

    it('hides the password again on submit', async () => {
      const { user } = setup(vi.fn().mockRejectedValue(new Error('boom')));
      await user.type(screen.getByLabelText(m.emailLabel), 'amara@northwind.example');
      await user.type(screen.getByLabelText(m.passwordLabel), 'wrong');
      await user.click(screen.getByRole('button', { name: m.showPassword }));

      await user.click(screen.getByRole('button', { name: m.submit }));

      await screen.findByRole('alert');
      expect(screen.getByLabelText(m.passwordLabel)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(m.passwordLabel)).toHaveValue('wrong');
      expect(screen.getByRole('button', { name: m.showPassword })).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
