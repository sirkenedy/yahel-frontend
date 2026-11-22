import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@yahel/api-client';
import type { Profile } from '@yahel/api-client';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { flowMessages as fm } from '../../flow/messages';
import { dismissToast, useToast } from '../../flow/toasts';
import { AdminFlowProvider, useAdminFlow } from './admin-flow';
import type { AdminFlowValue } from './admin-flow';
import type { AdminFacts, AdminStep } from './machine';
import { adminMessages as m } from './messages';
import { createAdminStore } from './store';

const email = 'amara@harbourline.example';
const password = 'Harbourline Lagos 2026!';
const profile: Profile = { id: 'p-1', globalId: 'g', email, firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null };
const links = { admin: 'https://admin.yahel.example/', signIn: '/signin', resetPassword: '/signin', help: 'https://yahel.example/help', businessTerms: null, privacy: 'https://yahel.example/privacy' };
const unconfirmed = () => new ApiError({ status: 403, code: 'EMAIL_NOT_VERIFIED', message: 'x' });

const fakeSession = () => {
  const store = createStore<{ status: 'signed-out' | 'signed-in'; profile: Profile | null }>(() => ({ status: 'signed-out', profile: null }));
  return {
    store,
    signIn: vi.fn(async () => {
      store.setState({ status: 'signed-in', profile });
      return { ok: true } as Awaited<ReturnType<Session['signIn']>>;
    }),
    signOut: vi.fn(async () => void store.setState({ status: 'signed-out', profile: null })),
    api: {
      auth: { verifyEmail: vi.fn().mockResolvedValue({ message: 'ok' }), resendVerification: vi.fn().mockResolvedValue({ message: 'ok' }) },
      me: { recovery: { updatePhone: vi.fn().mockResolvedValue({}), verifyPhone: vi.fn().mockResolvedValue({}) } },
    },
  };
};

const fakeRegistrar = (supported = true) => ({
  isSupported: vi.fn(() => supported),
  prepare: vi.fn(),
  create: vi.fn().mockResolvedValue({ status: 'created', attestation: { credentialId: 'id', clientDataJSON: 'c', attestationObject: 'a', transports: ['internal'] } }),
  save: vi.fn().mockResolvedValue(undefined),
});

function Probe({ onValue, onToast }: { onValue: (value: AdminFlowValue) => void; onToast: (toast: ReturnType<typeof useToast>) => void }) {
  onValue(useAdminFlow());
  onToast(useToast());
  return null;
}

const setup = ({ step = 'signin' as AdminStep, facts = { signedIn: false, phoneVerified: false, hasPasskey: false } as AdminFacts, supported = true, handedOver = true } = {}) => {
  act(() => dismissToast());
  const session = fakeSession();
  const registrar = fakeRegistrar(supported);
  const store = createAdminStore();
  if (handedOver) store.dispatch({ type: 'handed-over', handover: { email, organisation: 'Harbourline Studio' } });
  const navigate = vi.fn();
  const leave = vi.fn();
  let shown: AdminStep = step;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let latest: AdminFlowValue | undefined;
  let said: ReturnType<typeof useToast> = null;
  const tree = (current: AdminStep, currentFacts: AdminFacts) => (
    <QueryClientProvider client={queryClient}>
      <AdminFlowProvider step={current} session={session as unknown as Session} registrar={registrar as unknown as PasskeyRegistrar} store={store} facts={currentFacts} organisation="Northwind Studio" links={links} navigate={navigate} isShown={(at) => at === shown} leave={leave}>
        <Probe onValue={(value) => (latest = value)} onToast={(toast) => (said = toast)} />
      </AdminFlowProvider>
    </QueryClientProvider>
  );
  const view = render(tree(step, facts));
  /** Everything the query client is holding on to, as text, to search for things that must not be kept. */
  const retained = () => JSON.stringify([queryClient.getMutationCache().getAll().map((mutation) => mutation.state), queryClient.getQueryCache().getAll().map((query) => [query.queryKey, query.state.data])]);
  return { session, registrar, store, navigate, leave, queryClient, retained, flow: () => latest!, toast: () => said, goTo: (next: AdminStep, nextFacts: AdminFacts = facts) => {
      shown = next;
      view.rerender(tree(next, nextFacts));
    },
    /** The address changes while the step is still on screen, as when a navigation away is loading. */
    leaveFor: (next: AdminStep) => (shown = next) };
};

const signedInFacts = { signedIn: true, phoneVerified: false, hasPasskey: false };

describe('AdminFlowProvider: signing in', () => {
  it('signs in to the handed-over address with the password, and moves on to the phone', async () => {
    const { flow, session, store, navigate } = setup();

    act(() => flow().actions.signIn(password));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('phone', { replace: true }));
    expect(session.signIn).toHaveBeenCalledWith(email, password);
    expect(store.getState()).toMatchObject({ email, provenPassword: null });
  });

  it('signs in to a typed address when nothing was handed over', async () => {
    const { flow, session, store } = setup({ handedOver: false });

    act(() => flow().actions.signIn(password, 'kayode@northwind.example'));

    await waitFor(() => expect(session.signIn).toHaveBeenCalledWith('kayode@northwind.example', password));
    expect(store.getState().email).toBe('kayode@northwind.example');
  });

  it('a right password for an unconfirmed address asks for a fresh code and holds the proof for the confirm step', async () => {
    const { flow, session, store, navigate } = setup();
    session.signIn.mockRejectedValueOnce(unconfirmed());

    act(() => flow().actions.signIn(password));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('confirm-email'));
    expect(session.api.auth.resendVerification).toHaveBeenCalledWith({ email });
    expect(store.getState().provenPassword).toBe(password);
    expect(flow().state).not.toHaveProperty('provenPassword');
  });

  it('does not keep the proof, or move, when the sign-in step was left before the answer came', async () => {
    const { flow, session, store, navigate, goTo } = setup();
    let answer: (error: unknown) => void = () => undefined;
    session.signIn.mockImplementationOnce(() => new Promise((_resolve, reject) => (answer = reject)));

    act(() => flow().actions.signIn(password));
    goTo('phone', signedInFacts);
    await act(async () => answer(unconfirmed()));

    expect(store.getState().provenPassword).toBeNull();
    expect(navigate).not.toHaveBeenCalledWith('confirm-email');
  });

  it('does not keep the proof, or move, when a navigation away began before the answer came', async () => {
    const { flow, session, store, navigate, leaveFor } = setup();
    let answer: (error: unknown) => void = () => undefined;
    session.signIn.mockImplementationOnce(() => new Promise((_resolve, reject) => (answer = reject)));

    act(() => flow().actions.signIn(password));
    leaveFor('phone');
    await act(async () => answer(unconfirmed()));

    expect(store.getState().provenPassword).toBeNull();
    expect(navigate).not.toHaveBeenCalledWith('confirm-email');
  });

  it('a wrong password is told beside the field and asks for no code', async () => {
    const { flow, session } = setup();
    session.signIn.mockRejectedValueOnce(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }));

    act(() => flow().actions.signIn('wrong'));

    await waitFor(() => expect(flow().meta.requests.password.feedback).toEqual({ place: 'field', field: 'password', text: fm.wrongCredentials }));
    expect(session.api.auth.resendVerification).not.toHaveBeenCalled();
  });

  it('a sign-in that needs a second step says so on the step, and keeps nothing of it', async () => {
    const { flow, session, store, navigate } = setup();
    session.signIn.mockResolvedValueOnce({ ok: false, reason: 'mfa-required', challengeToken: 'challenge-1' });

    act(() => flow().actions.signIn(password));

    await waitFor(() => expect(store.getState().signInPrompt).toBe('second-step'));
    expect(JSON.stringify(store.getState())).not.toContain('challenge-1');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends one request for two presses that arrive before the screen has updated', async () => {
    const { flow, session, navigate } = setup();

    act(() => {
      const { signIn } = flow().actions;
      signIn(password);
      signIn(password);
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('phone', { replace: true }));
    expect(session.signIn).toHaveBeenCalledTimes(1);
  });
});

describe('AdminFlowProvider: the emailed code', () => {
  const atConfirm = async () => {
    const context = setup();
    context.session.signIn.mockRejectedValueOnce(unconfirmed());
    act(() => context.flow().actions.signIn(password));
    await waitFor(() => expect(context.navigate).toHaveBeenCalledWith('confirm-email'));
    context.goTo('confirm-email');
    return context;
  };

  it('a right code confirms the address and signs in with the proven password, which is then dropped', async () => {
    const { flow, session, store, navigate } = await atConfirm();

    act(() => flow().actions.confirmEmail('B4nQ7x'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('phone', { replace: true }));
    expect(session.api.auth.verifyEmail).toHaveBeenCalledWith({ email, token: 'B4nQ7x' });
    expect(session.signIn).toHaveBeenLastCalledWith(email, password);
    expect(store.getState().provenPassword).toBeNull();
  });

  it('a wrong or expired code is told beside the boxes and keeps the proof for another try', async () => {
    const { flow, session, store } = await atConfirm();
    session.api.auth.verifyEmail.mockRejectedValueOnce(new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'x' }));

    act(() => flow().actions.confirmEmail('WRONG1'));

    await waitFor(() => expect(flow().meta.requests.confirmEmail.feedback).toEqual({ place: 'field', field: 'code', text: fm.emailCodeRefused }));
    expect(store.getState().provenPassword).toBe(password);
  });

  it('a confirmed address whose sign-in then fails goes back to the password, saying it is confirmed', async () => {
    const { flow, session, store, navigate } = await atConfirm();
    session.signIn.mockRejectedValueOnce(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }));

    act(() => flow().actions.confirmEmail('B4nQ7x'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('signin', { replace: true }));
    expect(store.getState()).toMatchObject({ provenPassword: null, signInPrompt: 'email-confirmed' });
  });

  it('asks for a new code only with the proof in hand, and says a new one was sent', async () => {
    const { flow, session, store, toast } = await atConfirm();

    act(() => flow().actions.resendEmailCode());
    await waitFor(() => expect(toast()?.text).toBe(fm.newCodeSent));
    expect(session.api.auth.resendVerification).toHaveBeenCalledTimes(2);

    act(() => store.dispatch({ type: 'proof-dropped' }));
    act(() => flow().actions.resendEmailCode());
    await waitFor(() => expect(flow().meta.requests.resendEmailCode.feedback).not.toBeNull());
    expect(session.api.auth.resendVerification).toHaveBeenCalledTimes(2);
    expect(session.api.auth.verifyEmail).not.toHaveBeenCalled();
  });
});

describe('AdminFlowProvider: the phone', () => {
  it('texts a code to the number in international form and moves to the code', async () => {
    const { flow, session, store, navigate } = setup({ step: 'phone', facts: signedInFacts });

    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '0803 555 0142' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    expect(session.api.me.recovery.updatePhone).toHaveBeenCalledWith({ phone: '+2348035550142' });
    expect(store.getState().phone).toEqual({ country: 'NG', number: '0803 555 0142' });
  });

  it('a number the backend refuses is told beside the field', async () => {
    const { flow, session, navigate } = setup({ step: 'phone', facts: signedInFacts });
    session.api.me.recovery.updatePhone.mockRejectedValueOnce(new ApiError({ status: 409, code: 'PHONE_ALREADY_IN_USE', message: 'x' }));

    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '803 555 0142' }));

    await waitFor(() => expect(flow().meta.requests.sendPhoneCode.feedback).toEqual({ place: 'field', field: 'phone', text: m.phoneRefused }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('a right code confirms the phone and moves to the welcome; a new code goes to the same number', async () => {
    const { flow, session, store, navigate, toast } = setup({ step: 'code', facts: signedInFacts });
    act(() => store.dispatch({ type: 'phone-code-sent', country: 'NG', number: '803 555 0142' }));

    act(() => flow().actions.resendPhoneCode());
    await waitFor(() => expect(toast()?.text).toBe(fm.newCodeSent));
    expect(session.api.me.recovery.updatePhone).toHaveBeenCalledWith({ phone: '+2348035550142' });

    act(() => flow().actions.verifyPhone('K9mP2r'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('welcome', { replace: true }));
    expect(session.api.me.recovery.verifyPhone).toHaveBeenCalledWith({ code: 'K9mP2r' });
    expect(store.getState().phoneVerified).toBe(true);
  });
});

describe('AdminFlowProvider: the welcome and the passkey', () => {
  const ready = { signedIn: true, phoneVerified: true, hasPasskey: false };

  it('names the organisation workspace sign-up just made for this address, and otherwise what the server says', async () => {
    const handed = setup({ step: 'welcome', facts: ready });
    handed.session.store.setState({ status: 'signed-in', profile });
    await waitFor(() => expect(handed.flow().state).toMatchObject({ address: email, domain: 'harbourline.example', organisation: 'Harbourline Studio' }));

    const typed = setup({ step: 'welcome', facts: ready, handedOver: false });
    expect(typed.flow().state.organisation).toBe('Northwind Studio');
  });

  it('"I understand" leads to the passkey', () => {
    const { flow, store, navigate } = setup({ step: 'welcome', facts: ready });

    act(() => flow().actions.understand());

    expect(store.getState().welcomed).toBe(true);
    expect(navigate).toHaveBeenCalledWith('add-passkey');
  });

  it('makes the passkey in the press, saves it to the account at once, says so and shows Admin is protected', async () => {
    const { flow, session, registrar, store, navigate, toast } = setup({ step: 'add-passkey', facts: ready });
    session.store.setState({ status: 'signed-in', profile });

    act(() => flow().actions.startPasskey());

    expect(navigate).toHaveBeenCalledWith('passkey');
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('add-passkey', { replace: true }));
    expect(registrar.create).toHaveBeenCalledWith({ address: email, name: 'Amara Okafor' });
    expect(registrar.save).toHaveBeenCalledTimes(1);
    expect(store.getState().passkeySaved).toBe(true);
    expect(toast()?.text).toBe(m.passkeySaved);
    expect(flow().state.hasPasskey).toBe(true);
  });

  it('a dismissed prompt saves nothing and says so on the passkey step', async () => {
    const { flow, session, registrar, store, goTo } = setup({ step: 'add-passkey', facts: ready });
    session.store.setState({ status: 'signed-in', profile });
    registrar.create.mockResolvedValueOnce({ status: 'cancelled' });

    act(() => flow().actions.startPasskey());
    goTo('passkey', ready);

    await waitFor(() => expect(flow().state.passkeyCancelled).toBe(true));
    expect(registrar.save).not.toHaveBeenCalled();
    expect(store.getState().passkeySaved).toBe(false);
  });

  it('a passkey the server would not save is a warning with another try', async () => {
    const { flow, session, registrar, goTo } = setup({ step: 'add-passkey', facts: ready });
    session.store.setState({ status: 'signed-in', profile });
    registrar.save.mockRejectedValueOnce(new ApiError({ status: 400, code: 'INVALID_TOKEN', message: 'x' }));

    act(() => flow().actions.startPasskey());
    goTo('passkey', ready);

    await waitFor(() => expect(flow().meta.requests.passkey.feedback).toEqual({ place: 'banner', tone: 'warning', text: m.passkeyFailed, next: 'retry' }));
    expect(flow().meta.requests.passkey.again).toBeTypeOf('function');
  });

  it('opens Admin only once there is a passkey', () => {
    const without = setup({ step: 'add-passkey', facts: ready });
    act(() => without.flow().actions.openAdmin());
    expect(without.leave).not.toHaveBeenCalled();

    const withPasskey = setup({ step: 'add-passkey', facts: { ...ready, hasPasskey: true } });
    act(() => withPasskey.flow().actions.openAdmin());
    expect(withPasskey.leave).toHaveBeenCalledTimes(1);
  });

  it('says whether this device can make a passkey', () => {
    expect(setup({ step: 'add-passkey', facts: ready }).flow().meta.passkeySupported).toBe(true);
    expect(setup({ step: 'add-passkey', facts: ready, supported: false }).flow().meta.passkeySupported).toBe(false);
  });

  it('signing out forgets everything and clears the query client', async () => {
    const { flow, session, store, navigate, queryClient } = setup({ step: 'add-passkey', facts: ready, supported: false });
    queryClient.setQueryData(['admin', 'p-1', 'membership'], { organisation: 'Northwind Studio' });

    act(() => flow().actions.signOut());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('signin', { replace: true }));
    expect(session.signOut).toHaveBeenCalled();
    expect(store.getState().email).toBeNull();
    expect(queryClient.getQueryData(['admin', 'p-1', 'membership'])).toBeUndefined();
  });
});

describe('AdminFlowProvider: nothing secret is kept', () => {
  it('the query client holds no password or code once their requests have settled', async () => {
    const { flow, session, navigate, goTo, retained, store } = setup();
    session.signIn.mockRejectedValueOnce(unconfirmed());
    act(() => flow().actions.signIn(password));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('confirm-email'));
    goTo('confirm-email');
    act(() => flow().actions.confirmEmail('B4nQ7x'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('phone', { replace: true }));

    goTo('phone', signedInFacts);
    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '803 555 0142' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    goTo('code', signedInFacts);
    act(() => flow().actions.verifyPhone('K9mP2r'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('welcome', { replace: true }));

    expect(retained()).not.toMatch(new RegExp(`${password}|B4nQ7x|K9mP2r|5550142`));
    expect(JSON.stringify(store.getState())).not.toMatch(new RegExp(`${password}|B4nQ7x|K9mP2r`));
  });
});
