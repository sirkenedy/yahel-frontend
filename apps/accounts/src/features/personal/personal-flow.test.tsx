import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, createAccountCapabilities } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PersonalEvent, PersonalStep } from './machine';
import { flowMessages as shared } from '../../flow/messages';
import { dismissToast, useToast } from '../../flow/toasts';
import { personalMessages as m } from './messages';
import { PersonalFlowProvider, usePersonalFlow } from './personal-flow';
import type { PersonalFlowValue } from './personal-flow';
import { createPersonalStore } from './store';

const instant = async () => undefined;
const password = 'Sunrise over Lekki 94';
const address = 'amara.okafor@yahel.example';
const ownEmail = 'amara@mail.example';
const attestation = { credentialId: 'id', clientDataJSON: 'c', attestationObject: 'a', transports: ['internal'] };
const failure = (status: number, code: string) => new ApiError({ status, code, message: 'x' });
const offline = () => failure(0, 'NETWORK_ERROR');
// No answer while the browser says it is online: told on the step, which keeps what was typed.
const unreachable = { place: 'banner', tone: 'offline', title: shared.unreachableTitle, text: shared.unreachableText, next: 'retry' };
const wrongCode = { place: 'field', field: 'code', text: m.wrongCode };

const answers: PersonalEvent[] = [
  { type: 'name-entered', firstName: 'Amara', lastName: 'Okafor' },
  { type: 'birth-entered', birth: { day: 14, month: 3, year: 1994 }, gender: 'woman' },
  { type: 'address-chosen', username: 'amara.okafor' },
  { type: 'password-chosen', password },
  { type: 'recovery-entered', country: 'NG', phone: '', email: 'amara.o@personal.example' },
];

const fakeSession = () => ({
  signIn: vi.fn<Session['signIn']>(async () => ({ ok: true })),
  api: {
    auth: {
      register: vi.fn().mockResolvedValue({ message: 'ok' }),
      verifyEmail: vi.fn().mockResolvedValue({ message: 'ok' }),
      resendVerification: vi.fn().mockResolvedValue({ message: 'ok' }),
      forgotPassword: vi.fn(),
    },
    me: { recovery: { updateEmail: vi.fn().mockResolvedValue({}), updatePhone: vi.fn().mockResolvedValue({}), verifyPhone: vi.fn().mockResolvedValue({}) } },
  },
});

const fakeRegistrar = () => ({
  isSupported: () => true,
  prepare: vi.fn(),
  create: vi.fn<PasskeyRegistrar['create']>(async () => ({ status: 'created', attestation })),
  save: vi.fn<PasskeyRegistrar['save']>(async () => undefined),
});

function Probe({ onValue, onToast }: { onValue: (value: PersonalFlowValue) => void; onToast: (text: string | null) => void }) {
  onValue(usePersonalFlow());
  onToast(useToast()?.text ?? null);
  return null;
}

afterEach(dismissToast);

const setup = ({ step = 'review' as PersonalStep, standIns = true, passkeys = true, events = answers, business = false } = {}) => {
  const session = fakeSession();
  const registrar = passkeys ? fakeRegistrar() : null;
  const capabilities = createAccountCapabilities(session.api as unknown as Session['api'], standIns ? createStandIns(instant) : undefined);
  const store = createPersonalStore();
  for (const event of events) store.dispatch(event);
  const navigate = vi.fn();
  const leave = vi.fn();
  const leaveForBusiness = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let latest: PersonalFlowValue | undefined;
  let said: string | null = null;
  const tree = (current: PersonalStep) => (
    <QueryClientProvider client={queryClient}>
      <PersonalFlowProvider
        step={current}
        session={session as unknown as Session}
        capabilities={capabilities}
        registrar={registrar as PasskeyRegistrar | null}
        store={store}
        mailDomain="yahel.example"
        links={{ signIn: '/signin', terms: null, privacy: null }}
        navigate={navigate}
        leaveForBusiness={business ? leaveForBusiness : null}
        leave={leave}
        pause={instant}
      >
        <Probe onValue={(value) => (latest = value)} onToast={(text) => (said = text)} />
      </PersonalFlowProvider>
    </QueryClientProvider>
  );
  const view = render(tree(step));
  /**
   * Everything the query client is holding on to, as text, to search for things that must not be kept:
   * each mutation's whole state and each query's key and data, with errors written out in full, because
   * turning an Error into JSON on its own drops its message.
   */
  const spelled = (error: unknown) => (error instanceof Error ? [error.name, error.message, { ...error }] : error);
  const retained = () =>
    JSON.stringify([
      queryClient.getMutationCache().getAll().map((mutation) => ({ ...mutation.state, error: spelled(mutation.state.error), failureReason: spelled(mutation.state.failureReason), options: Object.keys(mutation.options) })),
      queryClient.getQueryCache().getAll().map((query) => [query.queryKey, query.state.data, spelled(query.state.error)]),
    ]);
  const flow = () => latest!;
  const create = async (expected: PersonalStep | null = 'ready') => {
    act(() => flow().actions.createAccount());
    if (expected) await waitFor(() => expect(navigate).toHaveBeenCalledWith(expected, { replace: true }));
  };
  return { session, registrar, capabilities, store, navigate, leave, leaveForBusiness, retained, flow, create, toast: () => said, goTo: (next: PersonalStep) => view.rerender(tree(next)) };
};

describe('PersonalFlowProvider: the questions', () => {
  it('walks them in order, keeping each answer', () => {
    const { flow, store, navigate } = setup({ step: 'type', events: [] });
    const moves = () => navigate.mock.calls.map(([step]) => step);

    act(() => flow().actions.startPersonal());
    act(() => flow().actions.enterName('Amara', 'Okafor'));
    act(() => flow().actions.enterBirth({ day: 14, month: 3, year: 1994 }, 'woman'));
    act(() => flow().actions.chooseAddress('amara.okafor'));
    act(() => flow().actions.choosePassword(password));
    act(() => flow().actions.continueWithoutPasskey());
    act(() => flow().actions.enterRecovery({ country: 'NG', phone: '803 555 0142', email: '' }));

    expect(moves()).toEqual(['name', 'birth', 'address', 'password', 'add-passkey', 'recovery', 'review']);
    expect(store.getState()).toMatchObject({ firstName: 'Amara', birth: { year: 1994 }, username: 'amara.okafor', password, recovery: { phone: '803 555 0142' }, recoveryAnswered: true });
    expect(flow().state).toMatchObject({ address, fullName: 'Amara Okafor' });
  });

  it('keeps the address that was chosen when the other kind is opened from the review and then left', () => {
    const { flow, store, navigate } = setup();

    act(() => flow().actions.edit('address'));
    act(() => flow().actions.useOwnEmail());

    expect(navigate).toHaveBeenLastCalledWith('own-email');
    expect(store.getState()).toMatchObject({ addressKind: 'yahel', username: 'amara.okafor' });
    expect(flow().state.address).toBe(address);
  });

  it('never hands the password to a step, only whether one is chosen', () => {
    const { flow } = setup();

    expect(flow().state.hasPassword).toBe(true);
    expect(JSON.stringify(flow().state)).not.toContain(password);
    expect(flow().state).not.toHaveProperty('password');
  });

  it('moves on with the password already chosen, without it being typed again', () => {
    const { flow, store, navigate } = setup({ step: 'password' });

    act(() => flow().actions.keepPassword());

    expect(navigate).toHaveBeenLastCalledWith('add-passkey');
    expect(store.getState().password).toBe(password);
  });

  it('starts again from nothing on request: no answers, no password, no passkey', () => {
    const { flow, store, navigate } = setup({ events: [...answers, { type: 'passkey-created', attestation }, { type: 'address-typed', draft: 'amara' }] });

    act(() => flow().actions.startAgain());

    expect(store.getState()).toEqual(store.getInitialState());
    expect(navigate).toHaveBeenLastCalledWith('type', { replace: true });
  });

  it('branches to an existing email and back', () => {
    const { flow, store, navigate } = setup({ step: 'address', events: answers.slice(0, 2) });

    act(() => flow().actions.useOwnEmail());
    expect(navigate).toHaveBeenLastCalledWith('own-email');
    act(() => flow().actions.chooseOwnEmail(ownEmail));
    expect(navigate).toHaveBeenLastCalledWith('password');
    expect(flow().state.address).toBe(ownEmail);

    act(() => flow().actions.useYahelAddress());
    expect(navigate).toHaveBeenLastCalledWith('address');
    // Looking at the other kind changes nothing until an address of that kind is given.
    expect(store.getState()).toMatchObject({ addressKind: 'own', ownEmail });
    act(() => flow().actions.chooseAddress('amara.okafor'));
    expect(store.getState().addressKind).toBe('yahel');
  });

  it('skips the passkey offer where none can be made, and recovery when asked', () => {
    const { flow, store, navigate } = setup({ step: 'password', passkeys: false, events: answers.slice(0, 3) });

    act(() => flow().actions.choosePassword(password));
    expect(navigate).toHaveBeenLastCalledWith('recovery');
    act(() => flow().actions.skipRecovery());
    expect(navigate).toHaveBeenLastCalledWith('review');
    expect(store.getState().recoveryAnswered).toBe(true);
    expect(flow().meta.offers.passkey).toBe(false);
  });

  it.each([
    ['name', 'name', (flow: PersonalFlowValue) => flow.actions.enterName('Amarachi', 'Okafor')],
    ['birthday', 'birth', (flow: PersonalFlowValue) => flow.actions.enterBirth({ day: 15, month: 3, year: 1994 }, 'unspecified')],
    ['address', 'address', (flow: PersonalFlowValue) => flow.actions.chooseAddress('okafor.amara')],
    ['recovery', 'recovery', (flow: PersonalFlowValue) => flow.actions.skipRecovery()],
  ] as const)('changes the %s from the review and returns there', (row, step, answer) => {
    const { flow, store, navigate } = setup();

    act(() => flow().actions.edit(row));
    expect(navigate).toHaveBeenLastCalledWith(step);
    expect(store.getState().editing).toBe(true);

    act(() => answer(flow()));
    expect(navigate).toHaveBeenLastCalledWith('review');
  });

  it('changes the sign-in from the review by way of the passkey offer', () => {
    const { flow, navigate } = setup();

    act(() => flow().actions.edit('signIn'));
    act(() => flow().actions.choosePassword('Harmattan in Jos 2026!'));
    expect(navigate).toHaveBeenLastCalledWith('add-passkey');
    act(() => flow().actions.continueWithoutPasskey());
    expect(navigate).toHaveBeenLastCalledWith('review');
  });

  it('edits the kind of address that was chosen', () => {
    const { flow, navigate } = setup({ events: [...answers, { type: 'own-email-chosen', email: ownEmail }] });

    act(() => flow().actions.edit('address'));

    expect(navigate).toHaveBeenLastCalledWith('own-email');
  });

  it('says where the step sits, how to go back and what is offered', () => {
    const { flow, goTo } = setup({ step: 'birth' });
    expect(flow().meta).toMatchObject({ backHref: '/personal/name', progress: { current: 2, part: 'basics' }, mailDomain: 'yahel.example', offers: { passkey: true, business: false, contact: true, preferences: true } });

    goTo('ready');
    expect(flow().meta).toMatchObject({ backHref: null, progress: null, direction: 'forward' });
    goTo('birth');
    expect(flow().meta.direction).toBe('back');
  });

  it('offers no trusted contact, choices or address check without stand-ins', () => {
    const { flow } = setup({ step: 'address', standIns: false });

    expect(flow().meta.offers).toMatchObject({ contact: false, preferences: false });
    expect(flow().state.addressCheck).toEqual({ status: 'unoffered', alternatives: [] });
  });

  it('leaves for the business sign-up only when it has an address', () => {
    const offered = setup({ step: 'type', business: true });
    act(() => offered.flow().actions.startBusiness());
    expect(offered.leaveForBusiness).toHaveBeenCalledTimes(1);
    expect(offered.flow().meta.offers.business).toBe(true);

    expect(setup({ step: 'type' }).flow().meta.offers.business).toBe(false);
  });
});

describe('PersonalFlowProvider: the address check', () => {
  it('suggests free addresses from the person’s name before anything is typed', async () => {
    const { flow } = setup({ step: 'address', events: answers.slice(0, 2) });

    await waitFor(() => expect(flow().state.addressCheck).toEqual({ status: 'idle', alternatives: ['amara.okafor', 'okafor.amara', 'amaraokafor'] }));
  });

  it('holds what is typed in one place, so a field that is empty again is not still called taken', async () => {
    const { flow, store, goTo } = setup({ step: 'address', events: answers.slice(0, 2) });

    act(() => flow().actions.typeAddress('amara'));
    await waitFor(() => expect(flow().state.addressCheck.status).toBe('taken'));
    expect(store.getState().addressDraft).toBe('amara');
    goTo('birth');
    goTo('address');
    expect(flow().state.addressDraft).toBe('amara');
    expect(flow().state.addressCheck.status).toBe('taken');

    act(() => flow().actions.typeAddress(''));
    expect(flow().state.addressCheck.status).toBe('idle');
  });

  it('checks what is typed once typing pauses, and says only free or taken', async () => {
    const { flow, capabilities } = setup({ step: 'address', events: answers.slice(0, 2) });
    const check = vi.spyOn(capabilities.addresses!, 'check');

    act(() => flow().actions.typeAddress('ama'));
    expect(flow().state.addressCheck.status).toBe('idle');
    act(() => flow().actions.typeAddress('amar'));
    act(() => flow().actions.typeAddress('amara'));
    expect(flow().state.addressCheck.status).toBe('checking');

    await waitFor(() => expect(flow().state.addressCheck).toEqual({ status: 'taken', alternatives: ['amara.mail', 'amara1', 'hello.amara'] }));
    expect(check.mock.calls.map(([name]) => name)).not.toContain('amar');

    act(() => flow().actions.typeAddress('chidi.eze'));
    await waitFor(() => expect(flow().state.addressCheck.status).toBe('available'));
  });

  it('carries on when the check cannot be made', async () => {
    const { flow, capabilities } = setup({ step: 'address', events: answers.slice(0, 2) });
    vi.spyOn(capabilities.addresses!, 'check').mockRejectedValue(failure(429, 'TOO_MANY_REQUESTS'));

    act(() => flow().actions.typeAddress('chidi.eze'));

    await waitFor(() => expect(flow().state.addressCheck).toEqual({ status: 'unknown', alternatives: [] }));
  });
});

describe('PersonalFlowProvider: the passkey', () => {
  it('makes one on the device, labelled for the person, keeps its public half and moves on', async () => {
    const { flow, registrar, store, navigate } = setup({ step: 'add-passkey', events: answers.slice(0, 4) });

    act(() => flow().actions.startPasskey());
    expect(navigate).toHaveBeenLastCalledWith('passkey');
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('recovery'));
    expect(registrar!.create).toHaveBeenCalledWith({ address, name: 'Amara Okafor' });
    expect(store.getState().passkey).toEqual(attestation);
  });

  it('stays put when the prompt is closed, and says so', async () => {
    const { flow, registrar, store, navigate, goTo } = setup({ step: 'add-passkey', events: answers.slice(0, 4) });
    registrar!.create.mockResolvedValue({ status: 'cancelled' });

    act(() => flow().actions.startPasskey());
    goTo('passkey');

    await waitFor(() => expect(flow().state.passkeyCancelled).toBe(true));
    expect(store.getState().passkey).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('reports a device that could not make one', async () => {
    const { flow, registrar, goTo } = setup({ step: 'add-passkey', events: answers.slice(0, 4) });
    registrar!.create.mockRejectedValue(new DOMException('x', 'InvalidStateError'));

    act(() => flow().actions.startPasskey());
    goTo('passkey');

    await waitFor(() => expect(flow().meta.requests.passkey.feedback).toEqual({ place: 'banner', tone: 'warning', text: m.passkeyFailed }));
  });
});

describe('PersonalFlowProvider: creating the account', () => {
  it('registers what was answered, signs in, saves the ways back in and finishes', async () => {
    const { session, store, navigate, create } = setup();

    await create();

    expect(navigate).toHaveBeenCalledWith('creating');
    expect(session.api.auth.register).toHaveBeenCalledWith({ email: address, firstName: 'Amara', lastName: 'Okafor', dateOfBirth: '1994-03-14T00:00:00.000Z', password, gender: 'female' });
    expect(session.signIn).toHaveBeenCalledWith(address, password);
    expect(session.api.me.recovery.updateEmail).toHaveBeenCalledWith({ recoveryEmail: 'amara.o@personal.example' });
    expect(session.api.me.recovery.updatePhone).not.toHaveBeenCalled();
    expect(store.getState().creation).toMatchObject({ created: true, signedIn: true, finished: true, settled: ['recoveryEmail'], unsaved: [] });
  });

  it('sends a display name when there is no last name, and no gender when none was given', async () => {
    const { session, create } = setup({ events: [...answers, { type: 'name-entered', firstName: 'Amara', lastName: '' }, { type: 'birth-entered', birth: { day: 14, month: 3, year: 1994 }, gender: 'unspecified' }] });

    await create();

    expect(session.api.auth.register).toHaveBeenCalledWith({ email: address, firstName: 'Amara', lastName: '', displayName: 'Amara', dateOfBirth: '1994-03-14T00:00:00.000Z', password });
  });

  it('drops the password as soon as the account is signed in to, and keeps nothing secret in the query client', async () => {
    const { store, retained, create } = setup();

    await create();

    expect(store.getState().password).toBeNull();
    expect(retained()).not.toContain(password);
    expect(retained()).not.toContain('Sunrise');
  });

  it('keeps nothing secret in the query client while a request is in flight or after it has failed', async () => {
    const { session, flow, retained, create } = setup();
    let fail: (error: unknown) => void = () => undefined;
    session.signIn.mockImplementationOnce(() => new Promise((_resolve, reject) => (fail = reject)));

    await create(null);
    await waitFor(() => expect(session.signIn).toHaveBeenCalled());
    expect(flow().meta.requests.create.isPending).toBe(true);
    expect(retained()).not.toContain('Sunrise');

    // A failure whose own text repeats what was sent must not bring the password into the cache's view of it.
    await act(async () => fail(new ApiError({ status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'x' })));
    await waitFor(() => expect(flow().meta.requests.create.feedback).toMatchObject({ place: 'banner', tone: 'danger', title: shared.serverErrorTitle, text: shared.serverErrorText, next: 'retry' }));
    expect(retained()).toContain('INTERNAL_SERVER_ERROR');
    expect(retained()).not.toContain('Sunrise');
  });

  it('says how far it has got while it works', async () => {
    const { session, store, flow, create } = setup();
    let release: () => void = () => undefined;
    session.signIn.mockImplementation(() => new Promise((resolve) => (release = () => resolve({ ok: true }))));

    await create(null);
    await waitFor(() => expect(store.getState().creation.stage).toBe('signing-in'));
    expect(flow().meta.requests.create.isPending).toBe(true);

    await act(async () => release());
    await waitFor(() => expect(store.getState().creation.stage).toBe('finishing'));
  });

  it('creates the account once for two presses that arrive together', async () => {
    const { session, flow, navigate } = setup();

    act(() => {
      flow().actions.createAccount();
      flow().actions.createAccount();
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.api.auth.register).toHaveBeenCalledTimes(1);
  });

  it('keeps every answer when it fails, and a second try does not register again', async () => {
    const { session, store, flow, create } = setup();
    session.signIn.mockRejectedValueOnce(offline());

    await create(null);
    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual(unreachable));
    expect(store.getState()).toMatchObject({ firstName: 'Amara', username: 'amara.okafor', password, creation: { created: true, signedIn: false } });

    await create();
    expect(session.api.auth.register).toHaveBeenCalledTimes(1);
    expect(session.signIn).toHaveBeenCalledTimes(2);
  });

  it('recovers when the answer to registering was lost: the account that already exists is found to be this person’s', async () => {
    const { session, store, flow, create } = setup();
    session.api.auth.register.mockRejectedValueOnce(offline()).mockRejectedValueOnce(failure(409, 'EMAIL_ALREADY_EXISTS'));

    await create(null);
    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual(unreachable));
    await create();

    expect(session.signIn).toHaveBeenCalledTimes(1);
    expect(store.getState().creation).toMatchObject({ created: true, conflicted: false, signedIn: true });
  });

  it('sends the person back to pick another address when theirs was taken by someone else, without saying whose it is', async () => {
    const { session, store, flow, create } = setup();
    session.api.auth.register.mockRejectedValue(failure(409, 'EMAIL_ALREADY_EXISTS'));
    session.signIn.mockRejectedValue(failure(401, 'INVALID_CREDENTIALS'));

    await create('address');

    expect(store.getState()).toMatchObject({ rejection: { step: 'address', reason: 'taken' }, editing: true, password, creation: { started: false, conflicted: false } });
    expect(flow().meta.requests.create.feedback).toBeNull();
  });

  it('treats a duplicate record from the database exactly like an address that exists: signing in decides', async () => {
    const taken = setup();
    taken.session.api.auth.register.mockRejectedValue(failure(409, 'DUPLICATE_RECORD'));
    taken.session.signIn.mockRejectedValue(failure(401, 'INVALID_CREDENTIALS'));

    await taken.create('address');

    expect(taken.store.getState()).toMatchObject({ rejection: { step: 'address', reason: 'taken' }, creation: { started: false, conflicted: false } });
    expect(taken.flow().meta.requests.create.feedback).toBeNull();

    // The same answer when the password just chosen opens the account: it is this person's, from an attempt whose answer was lost.
    const own = setup();
    own.session.api.auth.register.mockRejectedValue(failure(409, 'DUPLICATE_RECORD'));

    await own.create();

    expect(own.session.signIn).toHaveBeenCalledTimes(1);
    expect(own.store.getState().creation).toMatchObject({ created: true, signedIn: true, finished: true });
  });

  it('treats a second step on a taken address as taken too, and keeps no challenge', async () => {
    const { session, store, retained, create } = setup();
    session.api.auth.register.mockRejectedValue(failure(409, 'EMAIL_ALREADY_EXISTS'));
    session.signIn.mockResolvedValue({ ok: false, reason: 'mfa-required', challengeToken: 'challenge-of-someone-else' });

    await create('address');

    expect(JSON.stringify(store.getState())).not.toContain('challenge-of-someone-else');
    expect(retained()).not.toContain('challenge-of-someone-else');
  });

  it.each([
    ['USER_UNDERAGE', 403, 'birth', { step: 'birth', reason: 'underage' }, answers],
    ['PERSONAL_SIGNUP_REQUIRES_PUBLIC_EMAIL', 400, 'own-email', { step: 'own-email', reason: 'not-personal' }, [...answers, { type: 'own-email-chosen', email: 'amara@northwind.example' } as const]],
  ] as const)('sends the person back to the question when the server answers %s', async (code, status, step, rejection, events) => {
    const { session, store, create } = setup({ events: [...events] });
    session.api.auth.register.mockRejectedValue(failure(status, code));

    await create(step);

    expect(store.getState().rejection).toEqual(rejection);
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it('shows a refusal it does not understand as a failure, on the creating screen', async () => {
    const { session, flow, navigate, create } = setup();
    session.api.auth.register.mockRejectedValue(failure(422, 'VALIDATION_ERROR'));

    await create(null);

    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual({ place: 'banner', tone: 'danger', title: m.detailsRefusedTitle, text: m.detailsRefused, next: 'review' }));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('saves the passkey and the choices to the new account', async () => {
    const { registrar, capabilities, store, create } = setup({ events: [...answers, { type: 'passkey-created', attestation }, { type: 'preferences-changed', preferences: { productNews: true, activityHistory: false } }] });
    const save = vi.spyOn(capabilities.preferences!, 'save');

    await create();

    expect(registrar!.save).toHaveBeenCalledWith(attestation);
    expect(save).toHaveBeenCalledWith({ productNews: true, activityHistory: false });
    expect(store.getState().creation.settled).toEqual(['recoveryEmail', 'preferences', 'passkey']);
  });

  it('does not send choices that were left off', async () => {
    const { capabilities, create } = setup();
    const save = vi.spyOn(capabilities.preferences!, 'save');

    await create();

    expect(save).not.toHaveBeenCalled();
  });

  it('does not take a session that ended during set-up for a refusal: nothing is noted as unsaved, and the whole screen says to sign in again', async () => {
    const { session, store, flow, navigate, create } = setup();
    session.api.me.recovery.updateEmail.mockRejectedValue(failure(401, 'SESSION_EXPIRED'));

    await create(null);

    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual({ place: 'screen', screen: 'session-ended' }));
    expect(store.getState().creation).toMatchObject({ created: true, signedIn: true, finished: false, settled: [], unsaved: [] });
    expect(navigate).not.toHaveBeenCalledWith('ready', { replace: true });
  });

  it('says so when the server ended every session during set-up', async () => {
    const { session, store, flow, create } = setup();
    session.api.me.recovery.updateEmail.mockRejectedValue(failure(401, 'TOKEN_REUSE_DETECTED'));

    await create(null);

    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual({ place: 'screen', screen: 'signed-out-everywhere' }));
    expect(store.getState().creation.unsaved).toEqual([]);
  });

  it('finishes without a part the server refuses, and notes it for the last screen', async () => {
    const { session, registrar, store, create } = setup({ events: [...answers, { type: 'passkey-created', attestation }] });
    session.api.me.recovery.updateEmail.mockRejectedValue(failure(422, 'VALIDATION_ERROR'));
    registrar!.save.mockRejectedValue(failure(400, 'INVALID_TOKEN'));

    await create();

    expect(store.getState().creation).toMatchObject({ finished: true, unsaved: ['recoveryEmail', 'passkey'] });
  });

  it('stops when a part cannot be reached, and a second try saves only what is left', async () => {
    const { session, registrar, flow, create } = setup({ events: [...answers, { type: 'passkey-created', attestation }] });
    registrar!.save.mockRejectedValueOnce(offline());

    await create(null);
    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual(unreachable));
    await create();

    expect(session.api.auth.register).toHaveBeenCalledTimes(1);
    expect(session.signIn).toHaveBeenCalledTimes(1);
    expect(session.api.me.recovery.updateEmail).toHaveBeenCalledTimes(1);
    expect(registrar!.save).toHaveBeenCalledTimes(2);
  });
});

describe('PersonalFlowProvider: confirming the recovery phone', () => {
  const withPhone: PersonalEvent[] = [...answers, { type: 'recovery-entered', country: 'NG', phone: '0803 555 0142', email: '' }];

  it('texts a code once the account exists, then confirms it and finishes', async () => {
    const { session, store, flow, navigate, retained, create } = setup({ events: withPhone });

    await create('code');
    expect(session.api.me.recovery.updatePhone).toHaveBeenCalledWith({ phone: '+2348035550142' });
    expect(store.getState().creation).toMatchObject({ phoneCodeAwaited: true, finished: false });

    act(() => flow().actions.verifyPhone('K9mP2r'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.api.me.recovery.verifyPhone).toHaveBeenCalledWith({ code: 'K9mP2r' });
    expect(store.getState().creation).toMatchObject({ phoneCodeAwaited: false, finished: true, unsaved: [] });
    expect(retained()).not.toContain('K9mP2r');
  });

  it('says a wrong code is wrong and lets another be tried', async () => {
    const { session, flow, goTo, create } = setup({ events: withPhone });
    await create('code');
    goTo('code');
    session.api.me.recovery.verifyPhone.mockRejectedValueOnce(failure(401, 'INVALID_TOKEN'));

    act(() => flow().actions.verifyPhone('wrong1'));
    await waitFor(() => expect(flow().meta.requests.verifyPhone.feedback).toEqual(wrongCode));
    act(() => flow().actions.verifyPhone('K9mP2r'));

    await waitFor(() => expect(session.api.me.recovery.verifyPhone).toHaveBeenCalledTimes(2));
  });

  it('sends a new code on request', async () => {
    const { session, flow, goTo, create, toast } = setup({ events: withPhone });
    await create('code');
    goTo('code');
    expect(toast()).toBeNull();

    act(() => flow().actions.resendPhoneCode());

    await waitFor(() => expect(flow().state.phoneCodeResent).toBe(true));
    // Said in passing, as a toast: the step itself shows nothing new.
    await waitFor(() => expect(toast()).toBe(m.newCodeSent));
    expect(session.api.me.recovery.updatePhone).toHaveBeenCalledTimes(2);
  });

  it('can be skipped, which is noted for the last screen', async () => {
    const { store, flow, navigate, create } = setup({ events: withPhone });
    await create('code');

    act(() => flow().actions.skipPhone());

    expect(navigate).toHaveBeenLastCalledWith('ready', { replace: true });
    expect(store.getState().creation).toMatchObject({ finished: true, unsaved: ['phoneSkipped'], phoneCodeAwaited: false });
  });

  it('finishes without the phone when the server will not take the number', async () => {
    const { session, store, create } = setup({ events: withPhone });
    session.api.me.recovery.updatePhone.mockRejectedValue(failure(409, 'PHONE_ALREADY_IN_USE'));

    await create();

    expect(store.getState().creation).toMatchObject({ finished: true, unsaved: ['phone'] });
  });
});

describe('PersonalFlowProvider: an email the person already has', () => {
  const own: PersonalEvent[] = [...answers, { type: 'own-email-chosen', email: ownEmail }];

  it('creates the account, asks for the emailed code, then signs in and finishes', async () => {
    const { session, store, flow, navigate, retained, create } = setup({ events: own });
    session.signIn.mockRejectedValueOnce(failure(403, 'EMAIL_NOT_VERIFIED'));

    await create('own-code');
    expect(session.api.auth.register).toHaveBeenCalledWith(expect.objectContaining({ email: ownEmail }));
    expect(session.api.auth.resendVerification).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ password, creation: { created: true, emailCode: 'awaited' } });

    act(() => flow().actions.confirmEmail('B4nQ7x'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.api.auth.verifyEmail).toHaveBeenCalledWith({ email: ownEmail, token: 'B4nQ7x' });
    expect(session.api.auth.register).toHaveBeenCalledTimes(1);
    expect(session.signIn).toHaveBeenCalledTimes(2);
    expect(store.getState().password).toBeNull();
    expect(retained()).not.toContain('B4nQ7x');
    expect(retained()).not.toContain(password);
  });

  it('says a wrong code is wrong, and sends a new one on request', async () => {
    const { session, flow, goTo, create, toast } = setup({ events: own });
    session.signIn.mockRejectedValueOnce(failure(403, 'EMAIL_NOT_VERIFIED'));
    await create('own-code');
    goTo('own-code');
    session.api.auth.verifyEmail.mockRejectedValueOnce(failure(401, 'INVALID_TOKEN'));

    act(() => flow().actions.confirmEmail('wrong1'));
    await waitFor(() => expect(flow().meta.requests.confirmEmail.feedback).toEqual(wrongCode));

    act(() => flow().actions.resendEmailCode());
    await waitFor(() => expect(flow().state.emailCodeResent).toBe(true));
    await waitFor(() => expect(toast()).toBe(m.emailCodeAskedAgain));
    expect(session.api.auth.resendVerification).toHaveBeenCalledWith({ email: ownEmail });
  });

  // Someone may have registered the address first, with their own password, and left it unconfirmed, waiting
  // for the real owner's code to switch their account on. So when the address has a registration or an account
  // this person's password does not open, no code is asked for and none is ever submitted.
  const takenByAnother = async () => {
    const context = setup({ events: own });
    context.session.api.auth.register.mockRejectedValue(failure(409, 'EMAIL_ALREADY_EXISTS'));
    context.session.signIn.mockRejectedValue(failure(401, 'INVALID_CREDENTIALS'));
    await context.create('own-code');
    context.goTo('own-code');
    return context;
  };

  it('shows the same screen for an address that already has a registration or an account, and asks the server for nothing', async () => {
    const { session, store, flow } = await takenByAnother();

    expect(session.api.auth.resendVerification).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ rejection: null, creation: { emailCode: 'unobtainable', conflicted: true, created: false } });
    expect(flow().meta.requests.create.feedback).toBeNull();
  });

  it('never submits a code for a registration that is not provably this person’s, whatever is typed', async () => {
    const { session, store, flow, navigate, retained } = await takenByAnother();
    navigate.mockClear();

    act(() => flow().actions.confirmEmail('B4nQ7x'));

    await waitFor(() => expect(flow().meta.requests.confirmEmail.feedback).toEqual(wrongCode));
    expect(session.api.auth.verifyEmail).not.toHaveBeenCalled();
    expect(session.api.auth.resendVerification).not.toHaveBeenCalled();
    expect(session.signIn).toHaveBeenCalledTimes(1);
    expect(store.getState().creation.emailCode).toBe('unobtainable');
    expect(navigate).not.toHaveBeenCalled();
    expect(retained()).not.toContain('B4nQ7x');
  });

  it('does not ask for a code for such a registration when "Send a new code" is pressed, and answers as it would for anyone', async () => {
    const { session, flow, toast } = await takenByAnother();

    act(() => flow().actions.resendEmailCode());

    await waitFor(() => expect(flow().state.emailCodeResent).toBe(true));
    // The same words as for an address a code really went to, so the answer says nothing about this one.
    await waitFor(() => expect(toast()).toBe(m.emailCodeAskedAgain));
    expect(session.api.auth.resendVerification).not.toHaveBeenCalled();
    expect(session.api.auth.verifyEmail).not.toHaveBeenCalled();
  });

  it('treats an existing account with a second step the same way: no code, nothing confirmed, no challenge kept', async () => {
    const { session, store, flow, retained, create } = setup({ events: own });
    session.api.auth.register.mockRejectedValue(failure(409, 'EMAIL_ALREADY_EXISTS'));
    session.signIn.mockResolvedValue({ ok: false, reason: 'mfa-required', challengeToken: 'challenge-of-someone-else' });

    await create('own-code');
    act(() => flow().actions.confirmEmail('B4nQ7x'));

    await waitFor(() => expect(flow().meta.requests.confirmEmail.feedback).toEqual(wrongCode));
    expect(session.api.auth.verifyEmail).not.toHaveBeenCalled();
    expect(session.api.auth.resendVerification).not.toHaveBeenCalled();
    expect(JSON.stringify(store.getState())).not.toContain('challenge-of-someone-else');
    expect(retained()).not.toContain('challenge-of-someone-else');
  });

  it('lets a mistyped address be put right from the code screen: the attempt ends and every other answer stands', async () => {
    const { session, store, flow, navigate, create } = setup({ events: own });
    session.signIn.mockRejectedValueOnce(failure(403, 'EMAIL_NOT_VERIFIED'));
    await create('own-code');

    act(() => flow().actions.useDifferentAddress());
    expect(navigate).toHaveBeenLastCalledWith('own-email', { replace: true });
    expect(store.getState()).toMatchObject({ editing: true, password, firstName: 'Amara', creation: { started: false, created: false, emailCode: 'not-needed' } });

    act(() => flow().actions.chooseOwnEmail('amara.okafor@mail.example'));
    expect(navigate).toHaveBeenLastCalledWith('review');
    await create('ready');
    expect(session.api.auth.register).toHaveBeenCalledTimes(2);
    expect(session.api.auth.register).toHaveBeenLastCalledWith(expect.objectContaining({ email: 'amara.okafor@mail.example' }));
  });

  it('picks up an unconfirmed registration of the person’s own from an earlier visit: their password opens it, so a code may be asked for and used', async () => {
    const { session, flow, navigate, create } = setup({ events: own });
    session.api.auth.register.mockRejectedValue(failure(409, 'EMAIL_ALREADY_EXISTS'));
    session.signIn.mockRejectedValueOnce(failure(403, 'EMAIL_NOT_VERIFIED'));

    await create('own-code');
    expect(session.api.auth.resendVerification).toHaveBeenCalledTimes(1);

    act(() => flow().actions.confirmEmail('B4nQ7x'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.api.auth.verifyEmail).toHaveBeenCalledWith({ email: ownEmail, token: 'B4nQ7x' });
  });
});

describe('PersonalFlowProvider: after the account exists', () => {
  it('invites a trusted contact and returns to the last screen', async () => {
    const { store, flow, navigate, capabilities } = setup({ step: 'contact' });
    const invite = vi.spyOn(capabilities.trustedContacts!, 'invite');

    act(() => flow().actions.inviteContact('chidi.eze@personal.example'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(invite).toHaveBeenCalledWith('chidi.eze@personal.example');
    expect(store.getState().contactInvited).toBe('chidi.eze@personal.example');
  });

  it('refuses to invite anyone where trusted contacts are not offered', async () => {
    const { flow } = setup({ step: 'contact', standIns: false });

    act(() => flow().actions.inviteContact('chidi.eze@personal.example'));

    await waitFor(() => expect(flow().meta.requests.inviteContact.feedback).toMatchObject({ place: 'banner', tone: 'danger', title: shared.serverErrorTitle, text: shared.serverErrorText, next: 'retry' }));
  });

  it('leaves for where the person was heading', () => {
    const { flow, leave } = setup({ step: 'ready' });

    act(() => flow().actions.continueToApp());

    expect(leave).toHaveBeenCalledTimes(1);
  });
});

describe('usePersonalFlow', () => {
  it('refuses to work outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe onValue={() => undefined} onToast={() => undefined} />)).toThrow(/PersonalFlowProvider/);
    vi.restoreAllMocks();
  });
});
