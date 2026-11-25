import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, createAccountCapabilities } from '@yahel/api-client';
import type { AccountCapabilities, ClientAccount, Profile } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { PasskeyClient, Session } from '@yahel/auth';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { dismissToast, useToast } from '../../flow/toasts';
import { createStore } from 'zustand/vanilla';
import type { SignInStep } from './machine';
import { signInMessages as m } from './messages';
import { SignInFlowProvider, useSignInFlow } from './sign-in-flow';
import type { SignInFlowValue } from './sign-in-flow';
import { createSignInStore } from './store';

const email = 'amara@northwind.example';
const profile: Profile = { id: '1', globalId: 'g', email, firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null, accountType: 'personal' };
const tokens = { accessToken: 'a', expiresIn: 3600, tokenType: 'Bearer', slot: 0, handle: 'h-0' };
const known = (overrides: Partial<ClientAccount> = {}): ClientAccount => ({ handle: 'h-0', slot: 0, displayName: 'Amara Okafor', initials: 'AO', avatarUrl: null, email, kind: 'personal', organisation: null, role: null, signedIn: false, ...overrides });
const instant = async () => undefined;

const fakeSession = (remembered: ClientAccount[] = []) => {
  const store = createStore<{ status: 'signed-out' | 'signed-in'; profile: Profile | null; slot: number | null; handle: string | null }>(() => ({ status: 'signed-out', profile: null, slot: null, handle: null }));
  const signedIn = () => store.setState({ status: 'signed-in', profile, slot: 0, handle: 'h-0' });
  let accounts = [...remembered];
  return {
    store,
    signIn: vi.fn(async () => {
      signedIn();
      return { ok: true, slot: 0, handle: 'h-0' } as Awaited<ReturnType<Session['signIn']>>;
    }),
    completeSecondStep: vi.fn(async () => {
      signedIn();
      return { slot: 0, handle: 'h-0' };
    }),
    establish: vi.fn(() => signedIn()),
    switchTo: vi.fn(async () => {
      signedIn();
      return true;
    }),
    removeAccount: vi.fn(async (handle: string) => {
      accounts = accounts.filter((account) => account.handle !== handle);
    }),
    signOut: vi.fn(async () => void store.setState({ status: 'signed-out', profile: null, slot: null, handle: null })),
    api: {
      auth: {
        accounts: vi.fn(async () => accounts),
        removeAccount: vi.fn(async (handle: string) => {
          accounts = accounts.filter((account) => account.handle !== handle);
          return { handle };
        }),
        resetPassword: vi.fn().mockResolvedValue({ message: 'ok' }),
        forgotPassword: vi.fn().mockResolvedValue({ message: 'ok' }),
        verifyEmail: vi.fn().mockResolvedValue({ message: 'ok' }),
        resendVerification: vi.fn().mockResolvedValue({ message: 'ok' }),
      },
    },
  };
};

function Probe({ onValue, onToast }: { onValue: (value: SignInFlowValue) => void; onToast: (toast: ReturnType<typeof useToast>) => void }) {
  onValue(useSignInFlow());
  onToast(useToast());
  return null;
}

const setup = ({ step = 'email' as SignInStep, standIns = true, passkeys = null as PasskeyClient | null, remembered = [] as ClientAccount[], returning = false, adminOnly = false, checkPhone = undefined as ((email: string, challengeToken: string) => void) | undefined } = {}) => {
  act(() => dismissToast());
  const session = fakeSession(remembered);
  const capabilities: AccountCapabilities = createAccountCapabilities(session.api as unknown as Session['api'], standIns ? createStandIns(instant) : undefined);
  const store = createSignInStore();
  const navigate = vi.fn();
  const leave = vi.fn();
  let shown: SignInStep = step;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let latest: SignInFlowValue | undefined;
  let said: ReturnType<typeof useToast> = null;
  const tree = (current: SignInStep) => (
    <QueryClientProvider client={queryClient}>
      <SignInFlowProvider step={current} session={session as unknown as Session} capabilities={capabilities} passkeys={passkeys} store={store} navigate={navigate} isShown={(at) => at === shown} leave={leave} returning={returning} adminOnly={adminOnly} checkPhone={checkPhone}>
        <Probe onValue={(value) => (latest = value)} onToast={(toast) => (said = toast)} />
      </SignInFlowProvider>
    </QueryClientProvider>
  );
  const view = render(tree(step));
  /** Everything the query client is holding on to, as text, to search for things that must not be kept. */
  const retained = () => JSON.stringify([queryClient.getMutationCache().getAll().map((mutation) => mutation.state), queryClient.getQueryCache().getAll().map((query) => [query.queryKey, query.state.data])]);
  return { session, capabilities, store, navigate, leave, queryClient, retained, flow: () => latest!, toast: () => said, goTo: (next: SignInStep) => {
      shown = next;
      view.rerender(tree(next));
    },
    /** The address changes while the step is still on screen, as when a navigation away is loading. */
    leaveFor: (next: SignInStep) => (shown = next) };
};

describe('SignInFlowProvider', () => {
  it('moves from the chooser or the email step to the password step, remembering the account', () => {
    const { flow, store, navigate } = setup();

    act(() => flow().actions.enterEmail(email));
    expect(store.getState()).toMatchObject({ email, fromChooser: false });
    expect(navigate).toHaveBeenLastCalledWith('password');

    act(() => flow().actions.chooseAccount(known({ email: 'kofi@northwind.example' })));
    expect(store.getState()).toMatchObject({ email: 'kofi@northwind.example', fromChooser: true });

    act(() => flow().actions.useAnotherAccount());
    expect(store.getState().email).toBeNull();
    expect(navigate).toHaveBeenLastCalledWith('email');
  });

  it('signs in with the password, reads this device’s accounts again and shows Done in place of the step', async () => {
    const { flow, session, navigate, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    await waitFor(() => expect(session.api.auth.accounts).toHaveBeenCalledTimes(1));

    act(() => flow().actions.signInWithPassword('secret'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.signIn).toHaveBeenCalledWith(email, 'secret');
    await waitFor(() => expect(session.api.auth.accounts).toHaveBeenCalledTimes(2));
  });

  it('ignores a second submit while the first is still running', async () => {
    const { flow, session, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    let finish: (result: Awaited<ReturnType<Session['signIn']>>) => void = () => undefined;
    session.signIn.mockImplementation(() => new Promise((resolve) => (finish = resolve)));

    act(() => flow().actions.signInWithPassword('secret'));
    await waitFor(() => expect(flow().meta.requests.password.isPending).toBe(true));
    act(() => flow().actions.signInWithPassword('secret'));
    await act(async () => finish({ ok: true, slot: 0, handle: 'h-0' }));

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
    await waitFor(() => expect(flow().meta.requests.password.feedback).toEqual({ place: 'field', field: 'password', text: m.wrongCredentials }));
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

    await waitFor(() => expect(flow().meta.requests.password.feedback).toEqual({ place: 'field', field: 'password', text: m.wrongCredentials }));
    expect(navigate).not.toHaveBeenCalled();

    goTo('recover');
    await waitFor(() => expect(flow().meta.requests.password.feedback).toBeNull());
  });

  it('lets the person leave a step while its request is running, come back, and try again', async () => {
    const { flow, session, store, goTo, navigate } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    let fail: (error: unknown) => void = () => undefined;
    session.signIn.mockImplementationOnce(() => new Promise((_resolve, reject) => (fail = reject)));

    act(() => void flow().actions.signInWithPassword('first'));
    await waitFor(() => expect(flow().meta.requests.password.isPending).toBe(true));
    goTo('email');
    goTo('password');
    expect(flow().meta.requests.password.isPending).toBe(true);

    await act(async () => fail(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' })));
    await waitFor(() => expect(flow().meta.requests.password.isPending).toBe(false));
    expect(flow().meta.requests.password.feedback).toBeNull();

    act(() => void flow().actions.signInWithPassword('second'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.signIn).toHaveBeenLastCalledWith(email, 'second');
  });

  it('sends the person back to sign in again when the second-step challenge has expired', async () => {
    const { flow, session, navigate, store } = setup({ step: 'code' });
    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'second-step-required', challengeToken: 'c-1' });
    });
    session.completeSecondStep.mockRejectedValue(new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'Invalid or expired token' }));

    act(() => void flow().actions.verifyCode('482910'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('password', { replace: true }));
    expect(store.getState()).toMatchObject({ challengeToken: null, passwordPrompt: 'challenge-expired' });
  });

  it('keeps no password, code or token in the query client once a request has settled', async () => {
    const passkeys = { isSupported: () => true, prepare: vi.fn(), signIn: vi.fn().mockResolvedValue({ status: 'signed-in', tokens: { ...tokens, accessToken: 'access-secret' } }) };
    const { flow, session, navigate, store, retained } = setup({ step: 'password', passkeys });
    act(() => store.dispatch({ type: 'email-entered', email }));
    session.signIn.mockResolvedValueOnce({ ok: false, reason: 'mfa-required', challengeToken: 'challenge-secret' });

    act(() => void flow().actions.signInWithPassword('password-secret'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    act(() => void flow().actions.verifyCode('135790'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));

    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'reset-code-sent', method: 'email', destination: 'x' });
      store.dispatch({ type: 'reset-code-entered', code: 'R3s3tC' });
    });
    act(() => void flow().actions.saveNewPassword('New-password-secret-1'));
    await waitFor(() => expect(session.api.auth.resetPassword).toHaveBeenCalled());
    await waitFor(() => expect(flow().meta.requests.newPassword.isPending).toBe(false));

    act(() => void flow().actions.startPasskey());
    await waitFor(() => expect(session.establish).toHaveBeenCalled());
    await waitFor(() => expect(flow().meta.requests.passkey.isPending).toBe(false));

    const held = retained();
    for (const secret of ['password-secret', '135790', 'New-password-secret-1', 'R3s3tC', 'challenge-secret', 'access-secret', 'refresh-secret']) expect(held).not.toContain(secret);
    expect(store.getState()).toMatchObject({ challengeToken: null, resetCode: null });
  });

  it('fetches a passkey challenge ahead of the press on the steps that offer one', async () => {
    const passkeys = { isSupported: () => true, prepare: vi.fn(), signIn: vi.fn() };
    const { goTo } = setup({ step: 'email', passkeys });
    await waitFor(() => expect(passkeys.prepare).toHaveBeenCalledWith(undefined));

    goTo('help');
    expect(passkeys.prepare).toHaveBeenCalledTimes(1);
  });

  it('texts a second-step code and says where it went', async () => {
    const { flow, store } = setup({ step: 'code' });
    act(() => store.dispatch({ type: 'second-step-required', challengeToken: 'c-1' }));

    act(() => flow().actions.sendTextCode());

    await waitFor(() => expect(flow().state.textedTo).toBe('+234 ••• ••• ••42'));
  });

  it('starts the passkey prompt from the press, shows the wait, and signs in when the device answers', async () => {
    const passkeys = { isSupported: () => true, prepare: vi.fn(), signIn: vi.fn().mockResolvedValue({ status: 'signed-in', tokens }) };
    const { flow, session, navigate, store } = setup({ passkeys });

    act(() => flow().actions.startPasskey());

    expect(store.getState().passkeyStarted).toBe(true);
    expect(navigate).toHaveBeenCalledWith('passkey');
    await waitFor(() => expect(passkeys.signIn).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.establish).toHaveBeenCalledWith(tokens);
  });

  it('sends a passkey sign-in that needs the phone checked first to the phone check, with no session', async () => {
    const passkeys = { isSupported: () => true, prepare: vi.fn(), signIn: vi.fn().mockResolvedValue({ status: 'phone-required', challengeToken: 'phone-1' }) };
    const checkPhone = vi.fn();
    const { flow, session, store } = setup({ passkeys, checkPhone });
    act(() => store.dispatch({ type: 'email-entered', email }));

    act(() => flow().actions.startPasskey());

    await waitFor(() => expect(checkPhone).toHaveBeenCalledWith(email, 'phone-1'));
    expect(session.establish).not.toHaveBeenCalled();
  });

  it('stays on the passkey step when the prompt is closed, and can ask again', async () => {
    const passkeys = { isSupported: () => true, prepare: vi.fn(), signIn: vi.fn().mockResolvedValue({ status: 'cancelled' }) };
    const { flow, session, navigate } = setup({ passkeys });

    act(() => flow().actions.startPasskey());
    await waitFor(() => expect(flow().state.passkeyCancelled).toBe(true));

    expect(flow().meta.requests.passkey.feedback).toBeNull();
    expect(session.establish).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith('done', expect.anything());

    act(() => flow().actions.startPasskey());
    await waitFor(() => expect(passkeys.signIn).toHaveBeenCalledTimes(2));
  });

  it('reports a passkey the server or the device refused', async () => {
    const passkeys = { isSupported: () => true, prepare: vi.fn(), signIn: vi.fn().mockRejectedValue(new DOMException('broken', 'UnknownError')) };
    const { flow } = setup({ passkeys });

    act(() => flow().actions.startPasskey());

    await waitFor(() => expect(flow().meta.requests.passkey.feedback).toEqual({ place: 'banner', tone: 'danger', text: m.passkeyFailed }));
  });

  it('loads where a reset code can go, sends it, and moves to the code step', async () => {
    const { flow, session, navigate, store, toast } = setup({ step: 'recover' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    await waitFor(() => expect(flow().state.recoveryOptions).toEqual([{ method: 'phone', destination: '+234 ••• ••• ••42' }, { method: 'email', destination: 'a•••@northwind.example' }]));

    act(() => flow().actions.sendResetCode('email'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('recover-code'));
    expect(session.api.auth.forgotPassword).toHaveBeenCalledWith({ email });
    expect(store.getState().recovery).toEqual({ method: 'email', destination: 'a•••@northwind.example' });

    act(() => flow().actions.resendResetCode());
    await waitFor(() => expect(flow().state.resetCodeResent).toBe(true));
    expect(session.api.auth.forgotPassword).toHaveBeenCalledTimes(2);
    // The confirmation is a passing toast, not a notice left on the step.
    expect(toast()).toMatchObject({ text: m.newCodeSent, tone: 'success' });
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
    expect(store.getState()).toMatchObject({ resetCode: null, resetCodeRejected: true, resetCodeSpent: false });
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it('marks the reset code as spent when the server will take no more tries of it', async () => {
    const { flow, session, navigate, store } = setup({ step: 'new-password' });
    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'reset-code-sent', method: 'email', destination: 'x' });
      store.dispatch({ type: 'reset-code-entered', code: 'WRONG1' });
    });
    session.api.auth.resetPassword.mockRejectedValue(new ApiError({ status: 429, code: 'TOKEN_MAX_ATTEMPTS', message: 'Too many invalid attempts' }));

    act(() => flow().actions.saveNewPassword('Sunrise over Lekki 94!'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('recover-code', { replace: true }));
    expect(store.getState()).toMatchObject({ resetCode: null, resetCodeRejected: true, resetCodeSpent: true });
  });

  it('treats the reset as final when the sign-in after it fails: the code is spent and the password step explains', async () => {
    const { flow, session, navigate, store } = setup({ step: 'new-password' });
    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'reset-code-sent', method: 'email', destination: 'x' });
      store.dispatch({ type: 'reset-code-entered', code: 'A7kZq2' });
    });
    session.signIn.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' }));

    act(() => void flow().actions.saveNewPassword('Sunrise over Lekki 94!'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('password', { replace: true }));
    expect(session.api.auth.resetPassword).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({ resetCode: null, recovery: null, resetCodeRejected: false, passwordPrompt: 'reset-done' });
    expect(flow().meta.requests.newPassword.feedback).toBeNull();
    expect(navigate).not.toHaveBeenCalledWith('recover-code', expect.anything());

    act(() => void flow().actions.signInWithPassword('Sunrise over Lekki 94!'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.api.auth.resetPassword).toHaveBeenCalledTimes(1);
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

    await waitFor(() => expect(flow().meta.requests.newPassword.feedback).toEqual({ place: 'field', field: 'password', text: m.passwordRefused }));
    expect(navigate).not.toHaveBeenCalled();
    expect(store.getState().resetCode).toBe('A7kZq2');
  });

  it('files a help request and shows the confirmation', async () => {
    const { flow, navigate, store } = setup({ step: 'help' });

    act(() => flow().actions.requestHelp('amara@personal.example'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('help-sent'));
    expect(store.getState().helpRequested).toBe(true);
  });

  it('removes an account from this device by its handle, says so, and leaves the chooser when it was the last', async () => {
    const remembered = [known({ handle: 'h-0', email }), known({ handle: 'h-1', slot: 1, email: 'amara.okafor@yahel.example' })];
    const { flow, navigate, session, toast } = setup({ step: 'choose', remembered });
    await waitFor(() => expect(flow().state.accounts).toHaveLength(2));

    act(() => flow().actions.removeAccount(remembered[0]!));
    await waitFor(() => expect(toast()?.text).toBe(m.removed(email)));
    expect(session.removeAccount).toHaveBeenCalledWith('h-0');
    await waitFor(() => expect(flow().state.accounts.map((account) => account.email)).toEqual(['amara.okafor@yahel.example']));
    expect(navigate).not.toHaveBeenCalled();

    act(() => flow().actions.removeAccount(remembered[1]!));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('email', { replace: true }));
  });

  it('switches to a signed-in account without a password, and asks for it when the account turns out signed out', async () => {
    const remembered = [known({ handle: 'h-0', email, signedIn: true }), known({ handle: 'h-1', slot: 1, email: 'kofi@northwind.example', signedIn: true })];
    const { flow, navigate, session, store, queryClient, toast } = setup({ step: 'choose', remembered });
    await waitFor(() => expect(flow().state.accounts).toHaveLength(2));
    queryClient.setQueryData(['admin', 'h-old', 'workspace'], ['kept private']);

    act(() => flow().actions.chooseAccount(remembered[0]!));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done'));
    expect(session.switchTo).toHaveBeenCalledWith(0, 'h-0');
    expect(toast()?.text).toBe(m.switchedTo(email));
    expect(queryClient.getQueryData(['admin', 'h-old', 'workspace'])).toBeUndefined();

    session.switchTo.mockResolvedValueOnce(false);
    act(() => flow().actions.chooseAccount(remembered[1]!));
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('password'));
    expect(store.getState()).toMatchObject({ email: 'kofi@northwind.example', fromChooser: true });
  });

  it('goes straight to the password for an account that is signed out', () => {
    const { flow, navigate, session } = setup({ step: 'choose' });

    act(() => flow().actions.chooseAccount(known()));

    expect(session.switchTo).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenLastCalledWith('password');
  });

  it('says when the accounts cannot be read, offers no way back to the chooser it is on, and reads them again on request', async () => {
    const { flow, session, queryClient } = setup({ step: 'email' });
    await waitFor(() => expect(flow().state.accountsStatus).toBe('success'));
    expect(flow().meta.backHref).toBeNull();

    session.api.auth.accounts.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' }));
    await act(async () => void (await queryClient.resetQueries()));
    await waitFor(() => expect(flow().state.accountsStatus).toBe('error'));
    expect(flow().meta.backHref).toBe('/signin/choose');

    act(() => flow().actions.reloadAccounts());
    await waitFor(() => expect(flow().state.accountsStatus).toBe('success'));
  });

  it('keeps this tab’s account signed in when another is wanted, and opens the chooser to remove one when the device is full', () => {
    const { flow, navigate, session, store } = setup({ step: 'done' });

    act(() => flow().actions.showChooser());
    expect(navigate).toHaveBeenLastCalledWith('choose');
    expect(session.signOut).not.toHaveBeenCalled();

    act(() => flow().actions.openRemoval());
    expect(store.getState().removing).toBe(true);
  });

  it('points to “Remove an account” when this device has no room for another', async () => {
    const { flow, session, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    session.signIn.mockRejectedValueOnce(new ApiError({ status: 409, code: 'TOO_MANY_ACCOUNTS', message: 'x' }));

    act(() => flow().actions.signInWithPassword('secret'));

    await waitFor(() => expect(flow().meta.requests.password.feedback).toMatchObject({ place: 'banner', title: m.tooManyAccountsTitle, next: 'remove-account' }));
  });

  it('goes straight back to where the person was sent from once signed in, without showing Done', async () => {
    const { flow, navigate, store, leave } = setup({ step: 'password', returning: true });
    act(() => store.dispatch({ type: 'email-entered', email }));

    act(() => flow().actions.signInWithPassword('secret'));

    await waitFor(() => expect(leave).toHaveBeenCalledTimes(1));
    expect(navigate).not.toHaveBeenCalledWith('done', { replace: true });
  });

  it('for Admin, refuses an account that is not an administrator where it is listed, without signing in', () => {
    const { flow, store, navigate, session } = setup({ step: 'choose', returning: true, adminOnly: true });

    act(() => flow().actions.chooseAccount(known({ signedIn: true })));
    act(() => flow().actions.chooseAccount(known({ handle: 'h-1', email: 'kofi@northwind.example', kind: 'business', organisation: 'Northwind Studio', role: 'MEMBER' })));

    expect(store.getState().notAdmin).toBe('kofi@northwind.example');
    expect(flow().state.notAdmin).toBe('kofi@northwind.example');
    expect(navigate).not.toHaveBeenCalled();
    expect(session.switchTo).not.toHaveBeenCalled();
  });

  it('for Admin, opens an administrator account as usual', async () => {
    const admin = known({ signedIn: true, kind: 'business', organisation: 'Northwind Studio', role: 'OWNER' });
    const { flow, leave, session } = setup({ step: 'choose', returning: true, adminOnly: true, remembered: [admin] });

    act(() => flow().actions.chooseAccount(admin));

    await waitFor(() => expect(leave).toHaveBeenCalledTimes(1));
    expect(session.switchTo).toHaveBeenCalledWith(0, 'h-0');
  });

  it('for Admin, brings someone who signed in with an account that is not an administrator back to the chooser, saying so', async () => {
    const { flow, navigate, store, leave } = setup({ step: 'password', returning: true, adminOnly: true, remembered: [known({ signedIn: true })] });
    act(() => store.dispatch({ type: 'email-entered', email }));

    act(() => flow().actions.signInWithPassword('secret'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('choose', { replace: true }));
    expect(store.getState().notAdmin).toBe(email);
    expect(leave).not.toHaveBeenCalled();
  });

  it('for Admin, lets an administrator who signed in go straight back', async () => {
    const { flow, navigate, store, leave } = setup({ step: 'password', returning: true, adminOnly: true, remembered: [known({ signedIn: true, kind: 'business', organisation: 'Northwind Studio', role: 'ADMIN' })] });
    act(() => store.dispatch({ type: 'email-entered', email }));

    act(() => flow().actions.signInWithPassword('secret'));

    await waitFor(() => expect(leave).toHaveBeenCalledTimes(1));
    expect(navigate).not.toHaveBeenCalledWith('choose', { replace: true });
  });

  it('leaves for the app on request', () => {
    const { flow, leave } = setup({ step: 'done' });

    flow().actions.continueToApp();

    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('knows the way back and which way the person is travelling', async () => {
    const { flow, goTo, store } = setup({ step: 'email', remembered: [known()] });
    await waitFor(() => expect(flow().state.accounts).toHaveLength(1));
    expect(flow().meta.backHref).toBe('/signin/choose');
    expect(flow().meta.direction).toBe('forward');

    act(() => store.dispatch({ type: 'email-entered', email }));
    goTo('password');
    expect(flow().meta).toMatchObject({ direction: 'forward', backHref: '/signin/email' });

    goTo('email');
    expect(flow().meta.direction).toBe('back');
  });

  it('describes too many sign-in attempts as the paused screen, with when to try again if the server says', async () => {
    const { flow, session, store } = setup({ step: 'password' });
    act(() => store.dispatch({ type: 'email-entered', email }));
    session.signIn.mockRejectedValueOnce(new ApiError({ status: 429, code: 'BAD_REQUEST', message: 'ThrottlerException: Too Many Requests', retryAfter: 120 }));
    const before = Date.now();

    act(() => flow().actions.signInWithPassword('whatever'));

    await waitFor(() => expect(flow().meta.requests.password.feedback).toMatchObject({ place: 'screen', screen: 'locked' }));
    const feedback = flow().meta.requests.password.feedback;
    expect(feedback?.place === 'screen' ? feedback.retryAt : 0).toBeGreaterThanOrEqual(before + 120_000);

    // Putting it away shows the step again as it was.
    act(() => flow().meta.requests.password.clear());
    expect(flow().meta.requests.password.feedback).toBeNull();
  });

  it('gives a whole-screen state what it needs: whose account, and where its ways out lead', () => {
    const { flow, store } = setup({ step: 'password' });
    expect(flow().meta.screens).toMatchObject({ account: null, exits: { signIn: '/signin/email', resetPassword: null } });

    act(() => store.dispatch({ type: 'email-entered', email }));

    expect(flow().meta.screens).toMatchObject({ account: email, exits: { signIn: '/signin/email', resetPassword: '/signin/recover' } });
    expect(flow().meta.screens.serviceStatus).not.toBeNull();
  });

  it('can make a request that needs nothing typed once more, and not one that does', async () => {
    const { flow, session, store } = setup({ step: 'recover-code' });
    act(() => {
      store.dispatch({ type: 'email-entered', email });
      store.dispatch({ type: 'reset-code-sent', method: 'email', destination: 'x' });
    });
    session.api.auth.forgotPassword.mockRejectedValueOnce(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'boom', requestId: 'req-7F3K' }));

    act(() => flow().actions.resendResetCode());
    await waitFor(() => expect(flow().meta.requests.resendResetCode.feedback).toMatchObject({ place: 'banner', tone: 'danger', next: 'retry', reference: 'req-7F3K' }));
    expect(flow().meta.requests.password.again).toBeUndefined();

    act(() => flow().meta.requests.resendResetCode.again?.());
    await waitFor(() => expect(session.api.auth.forgotPassword).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(flow().meta.requests.resendResetCode.feedback).toBeNull());
  });
});

describe('confirming an email at sign-in', () => {
  const unconfirmed = () => new ApiError({ status: 403, code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before signing in' });
  const toConfirmStep = async () => {
    const context = setup({ step: 'password' });
    act(() => context.store.dispatch({ type: 'email-entered', email }));
    context.session.signIn.mockRejectedValueOnce(unconfirmed());
    act(() => void context.flow().actions.signInWithPassword('password-secret'));
    await waitFor(() => expect(context.navigate).toHaveBeenCalledWith('confirm-email'));
    context.goTo('confirm-email');
    return context;
  };

  it('goes to the code step when the password is right but the address is unconfirmed, and asks for a fresh code', async () => {
    const { session, store, flow } = await toConfirmStep();

    expect(session.api.auth.resendVerification).toHaveBeenCalledWith({ email });
    expect(store.getState().provenPassword).toBe('password-secret');
    expect(flow().state).not.toHaveProperty('provenPassword');
    expect(flow().meta.requests.password.feedback).toBeNull();
  });

  it.each(['recover', 'email'] as const)('holds no password and leads nowhere when the password step is left (for %s) while the request runs', async (elsewhere) => {
    const context = setup({ step: 'password' });
    act(() => context.store.dispatch({ type: 'email-entered', email }));
    context.session.signIn.mockRejectedValueOnce(unconfirmed());
    let sent: () => void = () => undefined;
    context.session.api.auth.resendVerification.mockImplementationOnce(() => new Promise((resolve) => (sent = () => resolve({ message: 'ok' }))));

    act(() => void context.flow().actions.signInWithPassword('password-secret'));
    await waitFor(() => expect(context.session.api.auth.resendVerification).toHaveBeenCalled());
    expect(context.store.getState().provenPassword).toBeNull();
    context.goTo(elsewhere);
    await act(async () => sent());

    await waitFor(() => expect(context.flow().meta.requests.password.isPending).toBe(false));
    expect(context.store.getState().provenPassword).toBeNull();
    expect(context.navigate).not.toHaveBeenCalledWith('confirm-email');
    expect(context.retained()).not.toContain('password-secret');
  });

  it.each(['recover', 'email'] as const)('holds no password and leads nowhere when a navigation away (to %s) began before the answer came', async (elsewhere) => {
    const context = setup({ step: 'password' });
    act(() => context.store.dispatch({ type: 'email-entered', email }));
    let answer: () => void = () => undefined;
    context.session.signIn.mockImplementationOnce(() => new Promise((_resolve, reject) => (answer = () => reject(unconfirmed()))));

    act(() => void context.flow().actions.signInWithPassword('password-secret'));
    await waitFor(() => expect(context.session.signIn).toHaveBeenCalled());
    context.leaveFor(elsewhere);
    await act(async () => answer());

    await waitFor(() => expect(context.flow().meta.requests.password.isPending).toBe(false));
    expect(context.store.getState().provenPassword).toBeNull();
    expect(context.navigate).not.toHaveBeenCalledWith('confirm-email');
  });

  it('still shows the code step when asking for the fresh code fails', async () => {
    const context = setup({ step: 'password' });
    act(() => context.store.dispatch({ type: 'email-entered', email }));
    context.session.signIn.mockRejectedValueOnce(unconfirmed());
    context.session.api.auth.resendVerification.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' }));

    act(() => void context.flow().actions.signInWithPassword('password-secret'));

    await waitFor(() => expect(context.navigate).toHaveBeenCalledWith('confirm-email'));
  });

  it('confirms with the code, then signs in with the password it proved and forgets it', async () => {
    const { session, store, flow, navigate } = await toConfirmStep();

    act(() => void flow().actions.confirmEmail('A1B2C3'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    expect(session.api.auth.verifyEmail).toHaveBeenCalledWith({ email, token: 'A1B2C3' });
    expect(session.signIn).toHaveBeenLastCalledWith(email, 'password-secret');
    expect(store.getState().provenPassword).toBeNull();
  });

  it('carries on to the second step when the account has one', async () => {
    const { session, store, flow, navigate } = await toConfirmStep();
    session.signIn.mockResolvedValueOnce({ ok: false, reason: 'mfa-required', challengeToken: 'c-9' });

    act(() => void flow().actions.confirmEmail('A1B2C3'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    expect(store.getState()).toMatchObject({ provenPassword: null, challengeToken: 'c-9', passwordPrompt: null });
  });

  it('shows a wrong code beside the boxes and keeps the proof for another try', async () => {
    const { session, store, flow, navigate } = await toConfirmStep();
    session.api.auth.verifyEmail.mockRejectedValueOnce(new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'x' }));

    act(() => void flow().actions.confirmEmail('WRONG1'));

    await waitFor(() => expect(flow().meta.requests.confirmEmail.feedback).toEqual({ place: 'field', field: 'code', text: m.emailCodeRefused }));
    expect(store.getState().provenPassword).toBe('password-secret');
    expect(session.signIn).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalledWith('done', { replace: true });
  });

  it('once confirmed, a sign-in that then fails returns to the password step saying the email is confirmed', async () => {
    const { session, store, flow, navigate } = await toConfirmStep();
    session.signIn.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' }));

    act(() => void flow().actions.confirmEmail('A1B2C3'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('password', { replace: true }));
    expect(store.getState()).toMatchObject({ provenPassword: null, passwordPrompt: 'email-confirmed' });
  });

  it('never submits a code, or asks for one, unless the password was proven in this visit', async () => {
    const { session, store, flow } = setup({ step: 'confirm-email' });
    act(() => store.dispatch({ type: 'email-entered', email }));

    act(() => void flow().actions.confirmEmail('A1B2C3'));
    act(() => void flow().actions.resendEmailCode());

    await waitFor(() => expect(flow().meta.requests.confirmEmail.feedback).toMatchObject({ place: 'banner' }));
    expect(session.api.auth.verifyEmail).not.toHaveBeenCalled();
    expect(session.api.auth.resendVerification).not.toHaveBeenCalled();
  });

  it('sends a new code on request and says so', async () => {
    const { session, flow, toast } = await toConfirmStep();

    act(() => void flow().actions.resendEmailCode());

    await waitFor(() => expect(toast()?.text).toBe(m.newCodeSent));
    expect(session.api.auth.resendVerification).toHaveBeenCalledTimes(2);
  });

  it('keeps neither the password nor the code in the query client', async () => {
    const { flow, navigate, retained } = await toConfirmStep();
    act(() => void flow().actions.confirmEmail('C0D3X9'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('done', { replace: true }));
    await waitFor(() => expect(flow().meta.requests.confirmEmail.isPending).toBe(false));

    expect(retained()).not.toContain('password-secret');
    expect(retained()).not.toContain('C0D3X9');
  });
});
