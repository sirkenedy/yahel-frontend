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
const profile: Profile = { id: 'p-1', globalId: 'g', email, firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null, accountType: 'business' };
const links = { admin: 'https://admin.yahel.example/', plan: '/business/plan', signIn: '/signin', resetPassword: '/signin', help: 'https://yahel.example/help', businessTerms: null, privacy: 'https://yahel.example/privacy' };

const fakeSession = () => {
  const store = createStore<{ status: 'signed-out' | 'signed-in'; profile: Profile | null }>(() => ({ status: 'signed-out', profile: null }));
  return {
    store,
    sendPhoneCheck: vi.fn(async () => undefined),
    completePhoneCheck: vi.fn(async () => {
      store.setState({ status: 'signed-in', profile });
      return { slot: 0, handle: 'h-0' };
    }),
    api: {
      me: { recovery: { updatePhone: vi.fn().mockResolvedValue({}), verifyPhone: vi.fn().mockResolvedValue({}) } },
    },
  };
};

const fakeRegistrar = (supported = true, prepare: () => Promise<void> = async () => undefined) => ({
  isSupported: vi.fn(() => supported),
  prepare: vi.fn<(account?: boolean) => Promise<void>>(() => prepare()),
  create: vi.fn().mockResolvedValue({ status: 'created', challengeToken: 'pk-1', attestation: { credentialId: 'id', clientDataJSON: 'c', attestationObject: 'a', transports: ['internal'] } }),
  save: vi.fn().mockResolvedValue(undefined),
});

function Probe({ onValue, onToast }: { onValue: (value: AdminFlowValue) => void; onToast: (toast: ReturnType<typeof useToast>) => void }) {
  onValue(useAdminFlow());
  onToast(useToast());
  return null;
}

const setup = ({ step = 'phone' as AdminStep, facts = { signedIn: false, phoneVerified: false, hasPasskey: false } as AdminFacts, supported = true, handedOver = true, continueToPlan = false, prepare = undefined as (() => Promise<void>) | undefined } = {}) => {
  act(() => dismissToast());
  const session = fakeSession();
  if (facts.signedIn) session.store.setState({ status: 'signed-in', profile });
  const registrar = fakeRegistrar(supported, prepare);
  const store = createAdminStore();
  if (handedOver) store.dispatch({ type: 'handed-over', handover: { email, organisation: 'Harbourline Studio', challengeToken: 'pc-1', phone: { country: 'NG', number: '803 555 0142' }, continueToPlan } });
  const navigate = vi.fn();
  const leave = vi.fn();
  const goTo = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let latest: AdminFlowValue | undefined;
  let said: ReturnType<typeof useToast> = null;
  const tree = (current: AdminStep, currentFacts: AdminFacts) => (
    <QueryClientProvider client={queryClient}>
      <AdminFlowProvider step={current} session={session as unknown as Session} registrar={registrar as unknown as PasskeyRegistrar} store={store} facts={currentFacts} organisation="Northwind Studio" links={links} navigate={navigate} goTo={goTo} leave={leave}>
        <Probe onValue={(value) => (latest = value)} onToast={(toast) => (said = toast)} />
      </AdminFlowProvider>
    </QueryClientProvider>
  );
  const view = render(tree(step, facts));
  /** Everything the query client is holding on to, as text, to search for things that must not be kept. */
  const retained = () => JSON.stringify([queryClient.getMutationCache().getAll().map((mutation) => mutation.state), queryClient.getQueryCache().getAll().map((query) => [query.queryKey, query.state.data])]);
  return { session, registrar, store, navigate, leave, goToHref: goTo, queryClient, retained, flow: () => latest!, toast: () => said, goTo: (next: AdminStep, nextFacts: AdminFacts = facts) => view.rerender(tree(next, nextFacts)) };
};

const signedInFacts = { signedIn: true, phoneVerified: false, hasPasskey: false };

describe('AdminFlowProvider: the phone check, before any session', () => {
  it('texts the code for the handed-over check, then signs in with it and moves to the welcome', async () => {
    const { flow, session, store, navigate } = setup();
    expect(flow().state.suggestedPhone).toEqual({ country: 'NG', number: '803 555 0142' });

    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '0803 555 0142' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    expect(session.sendPhoneCheck).toHaveBeenCalledWith('pc-1', '+2348035550142');
    expect(session.api.me.recovery.updatePhone).not.toHaveBeenCalled();

    act(() => flow().actions.verifyPhone('K9mP2r'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('welcome', { replace: true }));
    expect(session.completePhoneCheck).toHaveBeenCalledWith('pc-1', 'K9mP2r');
    expect(store.getState()).toMatchObject({ phoneVerified: true, challengeToken: null });
  });

  it('a check that expired before a code was sent is forgotten, and leads to signing in again', async () => {
    const { flow, session, store } = setup();
    session.sendPhoneCheck.mockRejectedValueOnce(new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'x' }));

    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '803 555 0142' }));

    await waitFor(() => expect(flow().meta.requests.sendPhoneCode.feedback).toMatchObject({ title: m.challengeLostTitle, next: 'sign-in' }));
    expect(store.getState().challengeToken).toBeNull();
  });

  it('a wrong code keeps the check for another try; too many end it', async () => {
    const { flow, session, store } = setup({ step: 'code' });
    act(() => store.dispatch({ type: 'phone-code-sent', country: 'NG', number: '803 555 0142' }));
    session.completePhoneCheck.mockRejectedValueOnce(new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'x' }));

    act(() => flow().actions.verifyPhone('wrong1'));
    await waitFor(() => expect(flow().meta.requests.verifyPhone.feedback).toEqual({ place: 'field', field: 'code', text: fm.emailCodeRefused }));
    expect(store.getState().challengeToken).toBe('pc-1');

    session.completePhoneCheck.mockRejectedValueOnce(new ApiError({ status: 429, code: 'TOKEN_MAX_ATTEMPTS', message: 'x' }));
    act(() => flow().actions.verifyPhone('wrong2'));
    await waitFor(() => expect(store.getState().challengeToken).toBeNull());
  });
});

describe('AdminFlowProvider: another account signed in to this tab', () => {
  const personal: Profile = { ...profile, id: 'p-2', email: 'amara.okafor@personal.example', accountType: 'personal' };

  it('with no check to meet, never texts or confirms that account’s phone: the check is lost and the person signs in again', async () => {
    const { flow, session, store } = setup({ step: 'phone' });
    act(() => {
      session.store.setState({ status: 'signed-in', profile: personal });
      store.dispatch({ type: 'challenge-lost' });
    });

    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '803 555 0142' }));
    await waitFor(() => expect(flow().meta.requests.sendPhoneCode.feedback).toMatchObject({ title: m.challengeLostTitle, next: 'sign-in' }));

    act(() => store.dispatch({ type: 'phone-code-sent', country: 'NG', number: '803 555 0142' }));
    act(() => flow().actions.verifyPhone('K9mP2r'));
    await waitFor(() => expect(flow().meta.requests.verifyPhone.feedback).toMatchObject({ title: m.challengeLostTitle, next: 'sign-in' }));
    expect(session.api.me.recovery.updatePhone).not.toHaveBeenCalled();
    expect(session.api.me.recovery.verifyPhone).not.toHaveBeenCalled();
    expect(store.getState().phoneVerified).toBe(false);
  });
});

describe('AdminFlowProvider: the phone, already signed in', () => {
  it('texts a code to the number in international form and moves to the code', async () => {
    const { flow, session, store, navigate } = setup({ step: 'phone', facts: signedInFacts, handedOver: false });

    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '0803 555 0142' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    expect(session.api.me.recovery.updatePhone).toHaveBeenCalledWith({ phone: '+2348035550142' });
    expect(store.getState().phone).toEqual({ country: 'NG', number: '0803 555 0142' });
  });

  it('a number the backend refuses is told beside the field', async () => {
    const { flow, session, navigate } = setup({ step: 'phone', facts: signedInFacts, handedOver: false });
    session.api.me.recovery.updatePhone.mockRejectedValueOnce(new ApiError({ status: 409, code: 'PHONE_ALREADY_IN_USE', message: 'x' }));

    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '803 555 0142' }));

    await waitFor(() => expect(flow().meta.requests.sendPhoneCode.feedback).toEqual({ place: 'field', field: 'phone', text: m.phoneRefused }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('a right code confirms the phone and moves to the welcome; a new code goes to the same number', async () => {
    const { flow, session, store, navigate, toast } = setup({ step: 'code', facts: signedInFacts, handedOver: false });
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

    const fromAnotherTab = setup({ step: 'welcome', facts: ready });
    fromAnotherTab.session.store.setState({ status: 'signed-in', profile: { ...profile, email: 'amara.okafor@personal.example', accountType: 'personal' } });
    await waitFor(() => expect(fromAnotherTab.flow().state).toMatchObject({ address: email, domain: 'harbourline.example', organisation: 'Harbourline Studio' }));

    const typed = setup({ step: 'welcome', facts: ready, handedOver: false });
    expect(typed.flow().state.organisation).toBe('Northwind Studio');
  });

  it('"I understand" leads to the passkey, or back to workspace sign-up’s plan when it goes on there', () => {
    const { flow, store, navigate } = setup({ step: 'welcome', facts: ready });
    act(() => flow().actions.understand());
    expect(store.getState().welcomed).toBe(true);
    expect(navigate).toHaveBeenCalledWith('add-passkey');

    const signingUp = setup({ step: 'welcome', facts: ready, continueToPlan: true });
    act(() => signingUp.flow().actions.understand());
    expect(signingUp.goToHref).toHaveBeenCalledWith('/business/plan');
    expect(signingUp.navigate).not.toHaveBeenCalled();
  });

  it('makes the passkey in the press, saves it to the account at once, says so and shows Admin is protected', async () => {
    const { flow, session, registrar, store, navigate, toast } = setup({ step: 'add-passkey', facts: ready });
    session.store.setState({ status: 'signed-in', profile });

    act(() => flow().actions.startPasskey());

    expect(navigate).toHaveBeenCalledWith('passkey');
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('add-passkey', { replace: true }));
    expect(registrar.create).toHaveBeenCalledWith({ address: email, name: 'Amara Okafor' });
    expect(registrar.save).toHaveBeenCalledTimes(1);
    expect(registrar.save).toHaveBeenCalledWith(expect.objectContaining({ challengeToken: 'pk-1' }));
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

  it('fetches the signed-in account’s challenge on the step, and says it is preparing until one is ready', async () => {
    let answer: () => void = () => undefined;
    const { flow, registrar } = setup({ step: 'add-passkey', facts: ready, prepare: () => new Promise<void>((resolve) => (answer = resolve)) });

    await waitFor(() => expect(flow().meta.passkeyPreparing).toBe(true));
    expect(registrar.prepare).toHaveBeenCalled();
    await act(async () => answer());
    await waitFor(() => expect(flow().meta.passkeyPreparing).toBe(false));
  });

  it('a press that found no challenge ready says so, and is not told as a closed prompt', async () => {
    const { flow, session, registrar, goTo } = setup({ step: 'add-passkey', facts: ready });
    session.store.setState({ status: 'signed-in', profile });
    registrar.create.mockResolvedValueOnce({ status: 'unprepared' });

    act(() => flow().actions.startPasskey());
    goTo('passkey', ready);

    await waitFor(() => expect(flow().state.passkeyUnprepared).toBe(true));
    expect(flow().state.passkeyCancelled).toBe(false);
    expect(registrar.save).not.toHaveBeenCalled();
  });

  it('back on the step while the prompt is still open, the request shows as running and a second press does nothing', async () => {
    const { flow, session, registrar, navigate, goTo } = setup({ step: 'add-passkey', facts: ready });
    session.store.setState({ status: 'signed-in', profile });
    registrar.create.mockReturnValueOnce(new Promise(() => undefined));

    act(() => flow().actions.startPasskey());
    goTo('passkey', ready);
    await waitFor(() => expect(registrar.create).toHaveBeenCalledTimes(1));
    goTo('add-passkey', ready);
    navigate.mockClear();
    act(() => flow().actions.startPasskey());

    expect(flow().meta.requests.passkey.isPending).toBe(true);
    await act(async () => undefined);
    expect(registrar.create).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
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

  it('opens Admin with a passkey or without one: it is recommended, not required', () => {
    const without = setup({ step: 'add-passkey', facts: ready });
    act(() => without.flow().actions.openAdmin());
    expect(without.leave).toHaveBeenCalledTimes(1);
  });

  it('says whether this device can make a passkey', () => {
    expect(setup({ step: 'add-passkey', facts: ready }).flow().meta.passkeySupported).toBe(true);
    expect(setup({ step: 'add-passkey', facts: ready, supported: false }).flow().meta.passkeySupported).toBe(false);
  });
});

describe('AdminFlowProvider: nothing secret is kept', () => {
  it('the query client and the flow hold no code, and the check is spent once met', async () => {
    const { flow, navigate, goTo, retained, store } = setup();
    act(() => flow().actions.sendPhoneCode({ country: 'NG', number: '803 555 0142' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('code'));
    goTo('code');
    act(() => flow().actions.verifyPhone('K9mP2r'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('welcome', { replace: true }));

    expect(retained()).not.toMatch(/K9mP2r|pc-1|5550142/);
    expect(JSON.stringify(store.getState())).not.toMatch(/K9mP2r|pc-1/);
    expect(JSON.stringify(flow().state)).not.toMatch(/pc-1/);
  });
});
