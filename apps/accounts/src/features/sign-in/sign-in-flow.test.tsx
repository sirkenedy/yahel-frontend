import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, createAccountCapabilities } from '@yahel/api-client';
import type { AccountCapabilities, Profile } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { PasskeyClient, Session } from '@yahel/auth';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import type { SignInStep } from './machine';
import { signInMessages as m } from './messages';
import { knownAccountsQuery } from './queries';
import { SignInFlowProvider, useSignInFlow } from './sign-in-flow';
import type { SignInFlowValue } from './sign-in-flow';
import { createSignInStore } from './store';

const email = 'amara@northwind.example';
const profile: Profile = { id: '1', globalId: 'g', email, firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null };
const tokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900, tokenType: 'Bearer' };
const instant = async () => undefined;

const fakeSession = () => {
  const store = createStore<{ status: 'signed-out' | 'signed-in'; profile: Profile | null }>(() => ({ status: 'signed-out', profile: null }));
  const signedIn = () => store.setState({ status: 'signed-in', profile });
  return {
    store,
    signIn: vi.fn(async () => {
      signedIn();
      return { ok: true } as Awaited<ReturnType<Session['signIn']>>;
    }),
    completeSecondStep: vi.fn(async () => signedIn()),
    establish: vi.fn(() => signedIn()),
    signOut: vi.fn(async () => void store.setState({ status: 'signed-out', profile: null })),
    api: { auth: { resetPassword: vi.fn().mockResolvedValue({ message: 'ok' }), forgotPassword: vi.fn().mockResolvedValue({ message: 'ok' }) } },
  };
};

function Probe({ onValue }: { onValue: (value: SignInFlowValue) => void }) {
  onValue(useSignInFlow());
  return null;
}

const setup = ({ step = 'email' as SignInStep, standIns = true, passkeys = null as PasskeyClient | null } = {}) => {
  const session = fakeSession();
  const capabilities: AccountCapabilities = createAccountCapabilities(session.api as unknown as Session['api'], standIns ? createStandIns(instant) : undefined);
  const store = createSignInStore();
  const navigate = vi.fn();
  const leave = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let latest: SignInFlowValue | undefined;
  const tree = (current: SignInStep) => (
    <QueryClientProvider client={queryClient}>
      <SignInFlowProvider step={current} session={session as unknown as Session} capabilities={capabilities} passkeys={passkeys} passkeyOffered={passkeys !== null} store={store} navigate={navigate} leave={leave}>
        <Probe onValue={(value) => (latest = value)} />
      </SignInFlowProvider>
    </QueryClientProvider>
  );
  const view = render(tree(step));
  return { session, capabilities, store, navigate, leave, queryClient, flow: () => latest!, goTo: (next: SignInStep) => view.rerender(tree(next)) };
};

describe('SignInFlowProvider', () => {
  it('moves from the chooser or the email step to the password step, remembering the account', () => {
    const { flow, store, navigate } = setup();

    act(() => flow().actions.enterEmail(email));
    expect(store.getState()).toMatchObject({ email, fromChooser: false });
    expect(navigate).toHaveBeenLastCalledWith('password');

    act(() => flow().actions.chooseAccount('kofi@northwind.example'));
    expect(store.getState()).toMatchObject({ email: 'kofi@northwind.example', fromChooser: true });

    act(() => flow().actions.useAnotherAccount());
    expect(store.getState().email).toBeNull();
    expect(navigate).toHaveBeenLastCalledWith('email');
  });

  it('signs in with the password, remembers the account on this device and shows Done in place of the step', async () => {
    const { flow, session, capabilities, navigate, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));

    act(() => flow().actions.signInWithPassword('secret'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.signIn).toHaveBeenCalledWith(email, 'secret');
    await waitFor(async () => expect((await capabilities.directory!.list())[0]).toMatchObject({ email, name: 'Amara Okafor', signedOut: false }));
  });

  it('ignores a second submit while the first is still running', async () => {
    const { flow, session, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    let finish: (result: { ok: true }) => void = () => undefined;
    session.signIn.mockImplementation(() => new Promise((resolve) => (finish = resolve)));

    act(() => flow().actions.signInWithPassword('secret'));
    await waitFor(() => expect(flow().meta.requests.password.isPending).toBe(true));
    act(() => flow().actions.signInWithPassword('secret'));
    await act(async () => finish({ ok: true }));

    expect(session.signIn).toHaveBeenCalledTimes(1);
  });

  it('sends one request for two presses that arrive before the screen has updated', async () => {
    const { flow, session, store, navigate } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));

    act(() => {
      const { signInWithPassword } = flow().actions;
      signInWithPassword('secret');
      signInWithPassword('secret');
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.signIn).toHaveBeenCalledTimes(1);
  });

  it('allows another attempt once the first has failed', async () => {
    const { flow, session, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    session.signIn.mockRejectedValueOnce(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }));

    act(() => void flow().actions.signInWithPassword('wrong'));
    await waitFor(() => expect(flow().meta.requests.password.failure).toBe(m.wrongCredentials));
    act(() => void flow().actions.signInWithPassword('right'));

    await waitFor(() => expect(session.signIn).toHaveBeenCalledTimes(2));
  });

  it('goes to the code step when a second step is required, then completes it with the challenge', async () => {
    const { flow, session, navigate, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    session.signIn.mockResolvedValue({ ok: false, reason: 'mfa-required', challengeToken: 'c-1' });

    act(() => flow().actions.signInWithPassword('secret'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    expect(store.getState().challengeToken).toBe('c-1');

    act(() => flow().actions.verifyCode('482910'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.completeSecondStep).toHaveBeenCalledWith('c-1', '482910');
    expect(store.getState().challengeToken).toBeNull();
  });

  it('explains a failure in plain words, and forgets it once the step is left', async () => {
    const { flow, session, store, goTo, navigate } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    session.signIn.mockRejectedValue(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' }));

    act(() => flow().actions.signInWithPassword('wrong'));

    await waitFor(() => expect(flow().meta.requests.password.failure).toBe(m.wrongCredentials));
    expect(navigate).not.toHaveBeenCalled();

    goTo('recover');
    await waitFor(() => expect(flow().meta.requests.password.failure).toBeNull());
  });

  it('texts a second-step code and says where it went', async () => {
    const { flow, store } = setup({ step: 'code' });
    act(() => store.dispatch({ type: 'second-step-required', challengeToken: 'c-1' }));

    act(() => flow().actions.sendTextCode());

    await waitFor(() => expect(flow().state.textedTo).toBe('+234 ••• ••• ••42'));
  });

  it('starts the passkey prompt from the press, shows the wait, and signs in when the device answers', async () => {
    const passkeys = { isAvailable: vi.fn(), signIn: vi.fn().mockResolvedValue({ status: 'signed-in', signedIn: { tokens, profile } }) };
    const { flow, session, navigate, store } = setup({ passkeys });

    act(() => flow().actions.startPasskey());

    expect(store.getState().passkeyStarted).toBe(true);
    expect(navigate).toHaveBeenCalledWith('passkey');
    await waitFor(() => expect(passkeys.signIn).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.establish).toHaveBeenCalledWith({ tokens, profile });
  });

  it('stays on the passkey step when the prompt is closed, and can ask again', async () => {
    const passkeys = { isAvailable: vi.fn(), signIn: vi.fn().mockResolvedValue({ status: 'cancelled' }) };
    const { flow, session, navigate } = setup({ passkeys });

    act(() => flow().actions.startPasskey());
    await waitFor(() => expect(flow().state.passkeyCancelled).toBe(true));

    expect(flow().meta.requests.passkey.failure).toBeNull();
    expect(session.establish).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith('done', expect.anything());

    act(() => flow().actions.startPasskey());
    await waitFor(() => expect(passkeys.signIn).toHaveBeenCalledTimes(2));
  });

  it('reports a passkey the server or the device refused', async () => {
    const passkeys = { isAvailable: vi.fn(), signIn: vi.fn().mockRejectedValue(new DOMException('broken', 'UnknownError')) };
    const { flow } = setup({ passkeys });

    act(() => flow().actions.startPasskey());

    await waitFor(() => expect(flow().meta.requests.passkey.failure).toBe(m.passkeyFailed));
  });

  it('loads where a reset code can go, sends it, and moves to the code step', async () => {
    const { flow, session, navigate, store } = setup({ step: 'recover' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    await waitFor(() => expect(flow().state.recoveryOptions).toEqual([{ method: 'phone', destination: '+234 ••• ••• ••42' }, { method: 'email', destination: 'a•••@northwind.example' }]));

    act(() => flow().actions.sendResetCode('email'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('recover-code'));
    expect(session.api.auth.forgotPassword).toHaveBeenCalledWith({ email });
    expect(store.getState().recovery).toEqual({ method: 'email', destination: 'a•••@northwind.example' });

    act(() => flow().actions.resendResetCode());
    await waitFor(() => expect(flow().state.resetCodeResent).toBe(true));
    expect(session.api.auth.forgotPassword).toHaveBeenCalledTimes(2);
  });

  it('offers only email recovery, and no help or passkeys, without stand-ins', async () => {
    const { flow, store } = setup({ step: 'recover', standIns: false });
    act(() => store.dispatch({ type: 'email-entered', email }));

    await waitFor(() => expect(flow().state.recoveryOptions).toEqual([{ method: 'email', destination: 'a•••@northwind.example' }]));
    expect(flow().meta.offers).toEqual({ passkey: false, textCode: false, help: false });
    expect(flow().state.accounts).toEqual([]);
  });

  it('resets the password with the held code, then signs in with the new password', async () => {
    const { flow, session, navigate, store } = setup({ step: 'new-password' });
    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'reset-code-sent', method: 'email', destination: 'x' });
    });

    act(() => flow().actions.enterResetCode('A7kZq2'));
    expect(navigate).toHaveBeenLastCalledWith('new-password');
    act(() => flow().actions.saveNewPassword('Sunrise over Lekki 94!'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.api.auth.resetPassword).toHaveBeenCalledWith({ email, token: 'A7kZq2', password: 'Sunrise over Lekki 94!' });
    expect(session.signIn).toHaveBeenCalledWith(email, 'Sunrise over Lekki 94!');
    expect(store.getState().resetCode).toBeNull();
  });

  it('sends the person back to the code step when the reset code is turned down', async () => {
    const { flow, session, navigate, store } = setup({ step: 'new-password' });
    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'reset-code-sent', method: 'email', destination: 'x' });
      store.dispatch({ type: 'reset-code-entered', code: 'WRONG1' });
    });
    session.api.auth.resetPassword.mockRejectedValue(new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'Invalid or expired token' }));

    act(() => flow().actions.saveNewPassword('Sunrise over Lekki 94!'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('recover-code', { replace: true }));
    expect(store.getState()).toMatchObject({ resetCode: null, resetCodeRejected: true });
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it('keeps the person on the new-password step when the password itself is refused', async () => {
    const { flow, session, navigate, store } = setup({ step: 'new-password' });
    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'reset-code-sent', method: 'email', destination: 'x' });
      store.dispatch({ type: 'reset-code-entered', code: 'A7kZq2' });
    });
    session.api.auth.resetPassword.mockRejectedValue(new ApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'password is too weak' }));

    act(() => flow().actions.saveNewPassword('Sunrise over Lekki 94!'));

    await waitFor(() => expect(flow().meta.requests.newPassword.failure).toBe(m.passwordRefused));
    expect(navigate).not.toHaveBeenCalled();
    expect(store.getState().resetCode).toBe('A7kZq2');
  });

  it('files a help request and shows the confirmation', async () => {
    const { flow, navigate, store } = setup({ step: 'help' });

    act(() => flow().actions.requestHelp('amara@example.com'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('help-sent'));
    expect(store.getState().helpRequested).toBe(true);
  });

  it('removes an account from this device, and leaves the chooser when it was the last', async () => {
    const { flow, navigate } = setup({ step: 'choose' });
    await waitFor(() => expect(flow().state.accounts).toHaveLength(2));

    act(() => flow().actions.removeAccount('amara@northwind.example'));
    await waitFor(() => expect(flow().state.removedAccount).toBe('amara@northwind.example'));
    expect(flow().state.accounts.map((account) => account.email)).toEqual(['amara.okafor@yahel.example']);
    expect(navigate).not.toHaveBeenCalled();

    act(() => flow().actions.removeAccount('amara.okafor@yahel.example'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('email', { replace: true }));
  });

  it('signs out, clears every cache and the flow, and returns to the start, even if the server call fails', async () => {
    const { flow, session, navigate, store, queryClient, capabilities } = setup({ step: 'done' });
    act(() => {
      session.store.setState({ status: 'signed-in', profile });
      store.dispatch({ type: 'email-entered', email });
    });
    session.signOut.mockRejectedValue(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }));
    queryClient.setQueryData(['mail', 'personal', 'inbox'], ['kept private']);

    act(() => flow().actions.signOut());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('choose', { replace: true }));
    expect(store.getState().email).toBeNull();
    expect(queryClient.getQueryData(['mail', 'personal', 'inbox'])).toBeUndefined();
    expect((await capabilities.directory!.list())[0]).toMatchObject({ email, signedOut: true });
  });

  it('leaves for the app on request', () => {
    const { flow, leave } = setup({ step: 'done' });

    flow().actions.continueToApp();

    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('knows the way back and which way the person is travelling', async () => {
    const { flow, goTo, store, queryClient } = setup({ step: 'email' });
    await waitFor(() => expect(queryClient.getQueryData(knownAccountsQuery(null).queryKey)).toHaveLength(2));
    expect(flow().meta.backHref).toBe('/signin/choose');
    expect(flow().meta.direction).toBe('forward');

    act(() => store.dispatch({ type: 'email-entered', email }));
    goTo('password');
    expect(flow().meta).toMatchObject({ direction: 'forward', backHref: '/signin/email' });

    goTo('email');
    expect(flow().meta.direction).toBe('back');
  });
});
