import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, createAccountCapabilities } from '@yahel/api-client';
import type { WorkspaceBilling } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import { createSession } from '@yahel/auth';
import type { KeyValueStorage, Session } from '@yahel/auth';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { flowMessages as fm } from '../../flow/messages';
import { dismissToast, useToast } from '../../flow/toasts';
import { BusinessFlowProvider, useBusinessFlow } from './business-flow';
import type { BusinessFlowValue } from './business-flow';
import type { BusinessEvent, BusinessStep } from './machine';
import { businessMessages as m } from './messages';
import { businessFacts } from './route-guard';
import { createBusinessStore } from './store';

const instant = async () => undefined;
const password = 'Northwind Lagos 2026!';
const card = { number: '4084 0840 8408 4081', expiry: '08/31', securityCode: '737', name: 'Amara Cardholder' };
const failure = (status: number, code: string) => new ApiError({ status, code, message: 'x' });
const lost = () => failure(0, 'NETWORK_ERROR');
const made = { message: 'ok', identity: { id: 'i1', email: 'amara@northwind.example', emailVerified: false }, tenant: { id: 't1', slug: 'northwind-studio', displayName: 'Northwind Studio', status: 'pending_setup' }, domain: { domain: 'northwind.example', status: 'pending' } };
const links = { signIn: '/signin', adminSignIn: '/signin', personal: '/personal', help: 'https://yahel.example/help', businessTerms: null, trialTerms: null, domainTerms: null };
const address = { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '', phoneCountry: 'NG', phone: '803 555 0142' };

const answers: BusinessEvent[] = [
  { type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' },
  { type: 'you-entered', firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara@mail.example', birth: { day: 14, month: 3, year: 1994 } },
  { type: 'owned-domain-entered', domain: 'northwind.example' },
  { type: 'owned-domain-confirmed' },
  { type: 'admin-entered', adminUser: 'amara', password, marketing: { productNews: true, teamTips: false } },
  { type: 'plan-chosen' },
  { type: 'address-entered', address },
];

const fakeSession = () => ({
  store: createStore(() => ({ status: 'signed-out' as const, profile: null })),
  registerBusiness: vi.fn().mockResolvedValue(made),
  signIn: vi.fn<Session['signIn']>().mockRejectedValue(failure(403, 'EMAIL_NOT_VERIFIED')),
  signOut: vi.fn().mockResolvedValue(undefined),
  api: { auth: {} },
});

function Probe({ onValue, onToast }: { onValue: (value: BusinessFlowValue) => void; onToast: (toast: ReturnType<typeof useToast>) => void }) {
  onValue(useBusinessFlow());
  onToast(useToast());
  return null;
}

const setup = ({ step = 'checkout' as BusinessStep, standIns = true, events = answers, before = undefined as ((billing: WorkspaceBilling) => unknown) | undefined, session: given = undefined as Session | undefined } = {}) => {
  act(() => dismissToast());
  const session = (given ?? fakeSession()) as ReturnType<typeof fakeSession>;
  const capabilities = createAccountCapabilities(session.api as unknown as Session['api'], standIns ? createStandIns(instant) : undefined);
  if (capabilities.workspaceBilling) before?.(capabilities.workspaceBilling);
  const store = createBusinessStore();
  events.forEach(store.dispatch);
  const navigate = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let latest: BusinessFlowValue | undefined;
  let said: ReturnType<typeof useToast> = null;
  const tree = (current: BusinessStep) => (
    <QueryClientProvider client={queryClient}>
      <BusinessFlowProvider step={current} session={session as unknown as Session} capabilities={capabilities} store={store} facts={businessFacts({ capabilities })} links={links} navigate={navigate}>
        <Probe onValue={(value) => (latest = value)} onToast={(toast) => (said = toast)} />
      </BusinessFlowProvider>
    </QueryClientProvider>
  );
  const view = render(tree(step));
  const flow = () => latest!;
  /** Everything the query client is holding on to, as text, to search for things that must not be kept. */
  const retained = () => JSON.stringify([queryClient.getMutationCache().getAll().map((mutation) => mutation.state), queryClient.getQueryCache().getAll().map((query) => [query.queryKey, query.state.data])]);
  const priced = () => waitFor(() => expect(flow().state.quote.status).toBe('ready'));
  /** Pays with the card and confirms the bank's code, which starts creating the workspace. */
  const payAndConfirm = async (code = '482913') => {
    await priced();
    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));
    act(() => void flow().actions.confirmCard(code));
  };
  return { session, capabilities, billing: capabilities.workspaceBilling!, store, navigate, flow, retained, priced, payAndConfirm, toast: () => said, goTo: (next: BusinessStep) => view.rerender(tree(next)) };
};

afterEach(() => vi.restoreAllMocks());

describe('BusinessFlowProvider: answering', () => {
  it('moves through the questions in the designed order for a domain the business owns', async () => {
    const { flow, navigate, store } = setup({ step: 'start', events: [] });

    act(() => flow().actions.enterBusiness({ businessName: 'Northwind Studio', size: 'small', country: 'NG' }));
    expect(navigate).toHaveBeenLastCalledWith('you');
    act(() => flow().actions.enterYou({ firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara@mail.example', birth: { day: 14, month: 3, year: 1994 } }));
    expect(navigate).toHaveBeenLastCalledWith('domain-question');
    act(() => flow().actions.chooseDomainSource('owned'));
    expect(navigate).toHaveBeenLastCalledWith('domain');
    act(() => void flow().actions.checkDomain('northwind.example'));
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('domain-ok'));
    act(() => flow().actions.confirmDomain());
    expect(navigate).toHaveBeenLastCalledWith('admin');
    act(() => flow().actions.enterAdmin({ adminUser: 'amara', password, marketing: { productNews: false, teamTips: false } }));
    expect(navigate).toHaveBeenLastCalledWith('plan');
    act(() => flow().actions.choosePlan());
    expect(navigate).toHaveBeenLastCalledWith('checkout');

    expect(flow().state).toMatchObject({ domain: 'northwind.example', adminAddress: 'amara@northwind.example', hasPassword: true, seats: 2 });
    expect(flow().state).not.toHaveProperty('password');
    expect(store.getState().password).toBe(password);
  });

  it('goes through the search and the registrant’s address for a domain bought here', async () => {
    const { flow, navigate, store } = setup({ step: 'domain-question', events: answers.slice(0, 2) });

    act(() => flow().actions.chooseDomainSource('bought'));
    expect(navigate).toHaveBeenLastCalledWith('find');
    expect(flow().state.search).toBe('northwind studio');
    act(() => flow().actions.pickDomain({ domain: 'example.com', yearly: { amount: 1_850_000, currency: 'NGN' }, bestMatch: true }));
    act(() => flow().actions.continueWithDomain());
    expect(navigate).toHaveBeenLastCalledWith('registrant');
    act(() => flow().actions.enterAddress(address));
    expect(navigate).toHaveBeenLastCalledWith('admin');
    expect(store.getState()).toMatchObject({ domainSource: 'bought', address });

    act(() => flow().actions.ownInstead());
    expect(navigate).toHaveBeenLastCalledWith('domain');
    act(() => flow().actions.buyInstead());
    expect(navigate).toHaveBeenLastCalledWith('find');
  });

  it('keeps a refused domain on its step: claimed or public, as whatever checks it says', async () => {
    const { flow, navigate, store } = setup({ step: 'domain', events: answers.slice(0, 2) });

    act(() => void flow().actions.checkDomain('taken.example'));
    await waitFor(() => expect(flow().state.rejection).toEqual({ step: 'domain', reason: 'claimed' }));
    act(() => void flow().actions.checkDomain('gmail.com'));
    await waitFor(() => expect(flow().state.rejection).toEqual({ step: 'domain', reason: 'public' }));
    expect(navigate).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ ownedDomain: 'gmail.com', ownedDomainConfirmed: false });
  });

  it('searches for what is typed once typing pauses, and says what it found', async () => {
    const { flow } = setup({ step: 'find', events: [...answers.slice(0, 2), { type: 'domain-source-chosen', source: 'bought' }] });
    expect(flow().state.offers.status).toBe('loading');
    await waitFor(() => expect(flow().state.offers).toMatchObject({ status: 'ready', value: [{ domain: expect.stringMatching(/^northwindstudio\./) as string, bestMatch: true }, {}, {}, {}] }));

    act(() => flow().actions.typeSearch('example'));
    expect(flow().state.offers.status).toBe('loading');
    await waitFor(() => expect(flow().state.offers.value?.[0]?.domain).toBe('example.com'));
    act(() => flow().actions.typeSearch('!'));
    expect(flow().state.offers.status).toBe('idle');
  });

  it('returns to checkout after a change made from it, and asks for a business’s address from there', () => {
    const { flow, navigate, store } = setup();

    act(() => flow().actions.edit('business'));
    expect(navigate).toHaveBeenLastCalledWith('start');
    expect(store.getState().editing).toBe(true);
    act(() => flow().actions.enterBusiness({ businessName: 'Northwind Works', size: 'small', country: 'NG' }));
    expect(navigate).toHaveBeenLastCalledWith('checkout');
    expect(flow().meta.backHref).toBe('/business/plan');

    for (const [row, step] of [['domain', 'domain-question'], ['admin', 'admin'], ['plan', 'plan'], ['address', 'registrant']] as const) {
      act(() => flow().actions.edit(row));
      expect(navigate).toHaveBeenLastCalledWith(step);
    }
    act(() => flow().actions.enterAddress({ ...address, city: 'Ikeja' }));
    expect(navigate).toHaveBeenLastCalledWith('checkout');
  });

  it('forgets everything on "Start again"', () => {
    const { flow, navigate, store } = setup();
    act(() => flow().actions.startAgain());

    expect(store.getState()).toMatchObject({ businessName: '', password: null, payment: null });
    expect(navigate).toHaveBeenLastCalledWith('start', { replace: true });
  });

  it('tells the steps what they need: progress, the way back, what is offered and where the ways out lead', () => {
    const { flow } = setup({ step: 'plan' });

    expect(flow().meta).toMatchObject({ backHref: '/business/admin', progress: { current: 5, total: 6, part: 'plan' }, offers: { domainsForSale: true, billing: true, contactEmail: true, marketing: true }, links, screens: { account: null, exits: { signIn: '/signin', signUp: '/business/start', support: links.help } } });
  });
});

describe('BusinessFlowProvider: the plan and the order', () => {
  it('shows the plan and the server’s sums for the order as it stands, and prices each change', async () => {
    const { flow, priced, store } = setup({ step: 'plan' });
    expect(flow().state.plan.status).toBe('loading');
    await priced();
    expect(flow().state.plan.value).toMatchObject({ name: 'Yahel Business', seatPrice: { monthly: { amount: 500_000, currency: 'NGN' } } });
    expect(flow().state.quote.value).toMatchObject({ period: 'monthly', seats: 2, trial: true, dueToday: { amount: 0 } });

    act(() => flow().actions.choosePeriod('yearly'));
    act(() => flow().actions.chooseSeats(12));
    await waitFor(() => expect(flow().state.quote.value).toMatchObject({ period: 'yearly', seats: 12, trial: false, dueToday: { amount: 60_480_000 } }));
    // While a change is being priced the last sums stay on screen.
    expect(flow().state.quote.status).toBe('ready');
    expect(store.getState()).toMatchObject({ period: 'yearly', seats: 12 });
  });

  it('applies a promo code, says so, and takes it off again', async () => {
    const { flow, priced, toast } = setup({ step: 'plan' });
    await priced();

    act(() => void flow().actions.applyPromo('nope'));
    await waitFor(() => expect(flow().meta.requests.applyPromo.feedback).toEqual({ place: 'field', field: 'promo', text: m.promoInvalid }));
    expect(flow().state.promo).toBeNull();

    act(() => void flow().actions.applyPromo('launch'));
    await waitFor(() => expect(flow().state.promo).toEqual({ code: 'LAUNCH', percent: 20, months: 3 }));
    expect(toast()?.text).toBe(m.promoSaid(20, 3));
    await waitFor(() => expect(flow().state.quote.value?.discountedSeatPrice).toEqual({ amount: 400_000, currency: 'NGN' }));

    act(() => flow().actions.removePromo());
    await waitFor(() => expect(flow().state.quote.value?.promo).toBeNull());
  });

  it('says when the prices cannot be had, and asks again on request', async () => {
    const { flow, billing } = setup({ step: 'plan', before: (answering) => vi.spyOn(answering, 'plan').mockRejectedValueOnce(lost()) });
    await waitFor(() => expect(flow().state.plan.status).toBe('failed'));

    act(() => flow().actions.retryPricing());
    await waitFor(() => expect(flow().state.plan.status).toBe('ready'));
    expect(billing.plan).toHaveBeenCalledTimes(2);
  });

  it('asks for no price on steps that show none', () => {
    const { flow, billing } = setup({ step: 'admin' });
    const plan = vi.spyOn(billing, 'plan');

    expect(flow().state.plan).toEqual({ status: 'loading', value: null });
    expect(plan).not.toHaveBeenCalled();
  });
});

describe('BusinessFlowProvider: paying', () => {
  it('hands the card to the checkout once and remembers only its network and last four digits', async () => {
    const { flow, navigate, store, billing, priced } = setup();
    const pay = vi.spyOn(billing, 'pay');
    await priced();

    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));

    expect(pay).toHaveBeenCalledWith({ planId: 'business', period: 'monthly', seats: 2, promoCode: null, domain: null }, card, { businessName: 'Northwind Studio', email: 'amara@mail.example', address: { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '', country: 'NG', phone: '+2348035550142' } });
    expect(store.getState().payment).toEqual({ id: expect.stringMatching(/^pay_demo_/) as string, card: { brand: 'Visa', lastFour: '4081' }, sentTo: '••• ••• ••42', authorised: false });
  });

  it('tells a declined card on the step and opens no payment', async () => {
    const { flow, navigate, store, priced } = setup();
    await priced();

    act(() => void flow().actions.pay({ ...card, number: '4000 0000 0000 0002' }));

    await waitFor(() => expect(flow().meta.requests.pay.feedback).toEqual({ place: 'banner', tone: 'danger', title: m.cardDeclinedTitle, text: m.cardDeclined }));
    expect(store.getState().payment).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('tells a wrong, an expired and a spent code apart, and a new code makes the payment usable again', async () => {
    const { flow, priced, navigate, session, toast, goTo } = setup();
    await priced();
    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));
    goTo('card-code');
    act(() => void flow().actions.confirmCard('999999'));
    await waitFor(() => expect(flow().meta.requests.confirmCard.feedback).toEqual({ place: 'field', field: 'code', text: m.bankCodeExpired }));

    for (let tries = 0; tries < 4; tries += 1) {
      act(() => void flow().actions.confirmCard('000000'));
      await waitFor(() => expect(flow().meta.requests.confirmCard.isPending).toBe(false));
      expect(flow().meta.requests.confirmCard.feedback).toEqual({ place: 'field', field: 'code', text: m.bankCodeWrong });
    }
    act(() => void flow().actions.confirmCard('000000'));
    await waitFor(() => expect(flow().meta.requests.confirmCard.feedback).toEqual({ place: 'banner', tone: 'danger', title: m.bankCodeDeadTitle, text: m.bankCodeDead, next: 'resend' }));
    expect(session.registerBusiness).not.toHaveBeenCalled();

    act(() => void flow().actions.resendCardCode());
    await waitFor(() => expect(toast()?.text).toBe(m.bankResent));
    act(() => void flow().actions.confirmCard('482913'));
    await waitFor(() => expect(session.registerBusiness).toHaveBeenCalledTimes(1));
  });

  it('lets go of an earlier payment when the card is handed over again, so no authorisation is left held', async () => {
    const { flow, store, billing, priced } = setup();
    const release = vi.spyOn(billing, 'release');
    const pay = vi.spyOn(billing, 'pay');
    await priced();
    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(store.getState().payment).not.toBeNull());
    const first = store.getState().payment!.id;

    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(store.getState().payment?.id).not.toBe(first));

    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith(first);
  });

  it('lets go of the payment on "Use a different card" and returns to checkout', async () => {
    const { flow, navigate, store, billing, priced } = setup();
    const release = vi.spyOn(billing, 'release');
    await priced();
    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(store.getState().payment).not.toBeNull());
    const { id } = store.getState().payment!;

    act(() => flow().actions.useDifferentCard());

    expect(release).toHaveBeenCalledWith(id);
    expect(store.getState().payment).toBeNull();
    expect(navigate).toHaveBeenLastCalledWith('checkout', { replace: true });
  });
});

describe('BusinessFlowProvider: creating the workspace', () => {
  it('creates it once the bank has approved, ties the payment to it and forgets the password', async () => {
    const { payAndConfirm, session, store, navigate, billing } = setup();
    const complete = vi.spyOn(billing, 'complete');
    await payAndConfirm();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(navigate).toHaveBeenCalledWith('creating', { replace: true });
    expect(session.registerBusiness).toHaveBeenCalledTimes(1);
    expect(session.registerBusiness).toHaveBeenCalledWith({ email: 'amara@northwind.example', password, firstName: 'Amara', lastName: 'Okafor', businessName: 'Northwind Studio', slug: 'northwind-studio', country: { name: 'Nigeria', code: 'NG', currency: 'NGN' }, dateOfBirth: '1994-03-14T00:00:00.000Z', employeeCount: 2, domain: 'northwind.example' });
    expect(complete).toHaveBeenCalledWith(store.getState().payment!.id, { tenantId: 't1', domain: 'northwind.example', marketing: { productNews: true, teamTips: false } });
    expect(store.getState()).toMatchObject({ password: null, creation: { created: true, tenantId: 't1', settled: true, finished: true } });
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it('makes one request for two presses', async () => {
    const { flow, session, navigate } = setup({ standIns: false, step: 'admin', events: answers.slice(0, 5) });

    act(() => {
      flow().actions.createWorkspace();
      flow().actions.createWorkspace();
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.registerBusiness).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['USER_UNDERAGE', 403, { step: 'you', reason: 'underage' }],
    ['PUBLIC_EMAIL_NOT_ALLOWED', 400, { step: 'domain', reason: 'public' }],
    ['DOMAIN_CONFLICT', 409, { step: 'domain', reason: 'claimed' }],
    ['DOMAIN_ALREADY_CLAIMED', 409, { step: 'domain', reason: 'claimed' }],
  ] as const)('sends the person back to the answer the server refused (%s), lets the payment go and keeps the rest', async (code, status, rejection) => {
    const { payAndConfirm, session, store, navigate, billing } = setup();
    const release = vi.spyOn(billing, 'release');
    session.registerBusiness.mockRejectedValueOnce(failure(status, code));
    await payAndConfirm();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith(rejection.step, { replace: true }));
    expect(store.getState()).toMatchObject({ rejection, editing: true, payment: null, password, businessName: 'Northwind Studio', creation: { started: false, created: false } });
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('for a domain bought here, a domain that has gone leads back to the search', async () => {
    const offer = { domain: 'example.com', yearly: { amount: 1_850_000, currency: 'NGN' }, bestMatch: true };
    const { payAndConfirm, session, store, navigate } = setup({ events: [...answers.slice(0, 2), { type: 'domain-source-chosen', source: 'bought' }, { type: 'domain-picked', offer }, ...answers.slice(4)] });
    session.registerBusiness.mockRejectedValueOnce(failure(409, 'DOMAIN_CONFLICT'));
    await payAndConfirm();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('find', { replace: true }));
    expect(store.getState()).toMatchObject({ rejection: { step: 'find', reason: 'claimed' }, bought: null });
  });

  it('tries the short name made from the domain when the one made from the business name is taken', async () => {
    const { payAndConfirm, session, navigate } = setup();
    session.registerBusiness.mockRejectedValueOnce(failure(409, 'DUPLICATE_RECORD'));
    await payAndConfirm();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.registerBusiness.mock.calls.map(([details]) => (details as { slug: string }).slug)).toEqual(['northwind-studio', 'northwind-example']);
  });

  it('while creating, holds the flow on creating; a failure lets the person go back again', async () => {
    const { payAndConfirm, session, flow, store } = setup();
    let answer: (value: unknown) => void = () => undefined;
    session.registerBusiness.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    session.registerBusiness.mockRejectedValueOnce(lost());
    await payAndConfirm();
    await waitFor(() => expect(store.getState().creation.started).toBe(true));
    expect(store.getState().creation.created).toBe(false);
    expect(flow().meta.requests.create.isPending).toBe(true);
    act(() => answer(made));
    await waitFor(() => expect(store.getState().creation.finished).toBe(true));

    const again = setup();
    again.session.registerBusiness.mockRejectedValueOnce(lost());
    await again.payAndConfirm();
    await waitFor(() => expect(again.flow().meta.requests.create.feedback).toMatchObject({ place: 'banner' }));
    expect(again.store.getState().creation).toMatchObject({ started: false, created: false });
  });

  it('stops with the failure when both short names are refused as duplicates', async () => {
    const { payAndConfirm, session, flow, store } = setup();
    session.registerBusiness.mockRejectedValue(failure(409, 'DUPLICATE_RECORD'));
    await payAndConfirm();

    await waitFor(() => expect(flow().meta.requests.create.feedback).toMatchObject({ place: 'banner', tone: 'danger' }));
    expect(session.registerBusiness).toHaveBeenCalledTimes(2);
    expect(store.getState().creation.created).toBe(false);
  });

  it('recovers when the answer to creating was lost: the workspace that already exists is found to be this person’s', async () => {
    const { payAndConfirm, session, flow, navigate, store } = setup();
    session.registerBusiness.mockRejectedValueOnce(lost()).mockRejectedValueOnce(failure(409, 'EMAIL_ALREADY_EXISTS'));
    await payAndConfirm();
    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual({ place: 'banner', tone: 'offline', title: fm.unreachableTitle, text: fm.unreachableText, next: 'retry' }));
    expect(store.getState()).toMatchObject({ password, creation: { created: false } });

    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.signIn).toHaveBeenCalledWith('amara@northwind.example', password);
    expect(store.getState()).toMatchObject({ password: null, creation: { created: true, tenantId: null, finished: true } });
    expect(session.registerBusiness).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['whose password is someone else’s', () => Promise.reject(failure(401, 'INVALID_CREDENTIALS')), 0],
    ['that is already confirmed and opens', () => Promise.resolve({ ok: true, slot: 0, handle: 'h-0' } as const), 1],
    // Nothing was stored for a second step, but only a refusal is certain to have opened nothing: the session is closed anyway.
    ['that asks for a second step', () => Promise.resolve({ ok: false, reason: 'mfa-required', challengeToken: 'c' } as const), 1],
  ])('refuses the username for an address that already has an account %s, and signs nobody in', async (_, answer, signOuts) => {
    const { payAndConfirm, session, navigate, store } = setup();
    session.registerBusiness.mockRejectedValueOnce(failure(409, 'EMAIL_ALREADY_EXISTS'));
    session.signIn.mockImplementationOnce(answer);
    await payAndConfirm();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('admin', { replace: true }));
    expect(store.getState()).toMatchObject({ rejection: { step: 'admin', reason: 'taken' }, creation: { created: false } });
    expect(session.signOut).toHaveBeenCalledTimes(signOuts);
  });

  it('takes no money when no answer named the workspace: the payment is let go, never completed', async () => {
    const { payAndConfirm, session, navigate, billing, store } = setup();
    const complete = vi.spyOn(billing, 'complete');
    const release = vi.spyOn(billing, 'release');
    session.registerBusiness.mockRejectedValueOnce(failure(409, 'EMAIL_ALREADY_EXISTS'));
    await payAndConfirm();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(store.getState().creation).toMatchObject({ created: true, tenantId: null, finished: true });
    expect(complete).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledWith(store.getState().payment!.id);
  });

  it.each([
    ['the profile cannot be loaded after the tokens were accepted', { login: 'tokens', me: 500 }, 'failed'],
    ['the account is confirmed and opens', { login: 'tokens', me: 200 }, 'refused'],
    ['the password is someone else’s', { login: 'INVALID_CREDENTIALS' }, 'refused'],
    ['the address is still to be confirmed', { login: 'EMAIL_NOT_VERIFIED' }, 'ready'],
    ['sign-in cannot be reached', { login: 'lost' }, 'failed'],
  ] as const)('leaves no session and no refresh token behind when checking an existing address and %s', async (_, replies, outcome) => {
    const kept = new Map<string, string>();
    const memory: KeyValueStorage = { getItem: (key) => kept.get(key) ?? null, setItem: (key, value) => void kept.set(key, value), removeItem: (key) => void kept.delete(key) };
    const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    const fetch = vi.fn(async (url: string | URL | Request) => {
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/auth/register-business')) return reply(409, { error: { code: 'EMAIL_ALREADY_EXISTS' } });
      if (path.endsWith('/auth/login')) {
        if (replies.login === 'lost') throw new TypeError('Failed to fetch');
        return replies.login === 'tokens' ? reply(201, { data: { accessToken: 'a-1', expiresIn: 900, tokenType: 'Bearer', slot: 0, handle: 'h-0' } }) : reply(replies.login === 'INVALID_CREDENTIALS' ? 401 : 403, { error: { code: replies.login } });
      }
      if (path.endsWith('/me')) return 'me' in replies && replies.me === 200 ? reply(200, { data: { id: 'u', email: 'amara@northwind.example' } }) : reply(500, { error: { code: 'INTERNAL_ERROR' } });
      if (path.endsWith('/auth/logout')) return reply(201, { data: null });
      return reply(404, { error: { code: 'NOT_FOUND' } });
    });
    const real = createSession({ baseUrl: 'https://api.yahel.example', slotStorage: memory, fetch: fetch as typeof globalThis.fetch });
    const { flow, navigate, store } = setup({ standIns: false, step: 'admin', events: answers.slice(0, 5), session: real });

    act(() => flow().actions.createWorkspace());

    if (outcome === 'ready') await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    if (outcome === 'refused') await waitFor(() => expect(store.getState().rejection).toEqual({ step: 'admin', reason: 'taken' }));
    if (outcome === 'failed') await waitFor(() => expect(flow().meta.requests.create.feedback).not.toBeNull());
    await waitFor(() => expect(flow().meta.requests.create.isPending).toBe(false));
    expect(kept.get('yahel.refresh-token')).toBeUndefined();
    expect(real.store.getState()).toMatchObject({ profile: null });
    expect(real.store.getState().status).not.toBe('signed-in');
  });

  it('once the workspace exists, another try only finishes what is left and never creates it again', async () => {
    const { payAndConfirm, session, flow, navigate, billing, store } = setup();
    const complete = vi.spyOn(billing, 'complete').mockRejectedValueOnce(lost());
    await payAndConfirm();
    await waitFor(() => expect(flow().meta.requests.create.feedback).toMatchObject({ place: 'banner' }));
    expect(store.getState().creation).toMatchObject({ created: true, settled: false, finished: false });

    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.registerBusiness).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('keeps no card detail, bank code or password anywhere, while the requests run and once they have settled', async () => {
    const { flow, navigate, retained, store, priced } = setup();
    const secrets = [card.number, card.number.replace(/ /g, ''), '4084 0840 8408', card.expiry, card.securityCode, card.name, '135790', password];
    await priced();
    act(() => void flow().actions.pay(card));
    // Looked at while the payment is in flight, when its mutation is in the cache: settled ones are dropped (gcTime 0).
    expect(retained()).toContain('"status":"pending"');
    for (const secret of secrets) expect(retained()).not.toContain(secret);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));
    act(() => void flow().actions.confirmCard('135790'));
    expect(retained()).toContain('"status":"pending"');
    for (const secret of secrets) expect(retained()).not.toContain(secret);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    await waitFor(() => expect(flow().meta.requests.create.isPending).toBe(false));

    const held = `${retained()} ${JSON.stringify(store.getState())} ${JSON.stringify(flow().state)}`;
    for (const secret of secrets) expect(held).not.toContain(secret);
    expect(store.getState().payment?.card).toEqual({ brand: 'Visa', lastFour: '4081' });
  });
});

describe('BusinessFlowProvider: where nothing answers for plans or domains', () => {
  const bare = { standIns: false, step: 'you' as BusinessStep, events: answers.slice(0, 1) };

  it('offers only what the backend has: a domain already owned, then the workspace straight after the admin sign-in', async () => {
    const { flow, navigate, session, store } = setup(bare);
    expect(flow().meta.offers).toEqual({ domainsForSale: false, billing: false, contactEmail: false, marketing: false });
    expect(flow().meta.progress).toMatchObject({ total: 4 });

    act(() => flow().actions.enterYou({ firstName: 'Amara', lastName: '', contactEmail: '', birth: { day: 14, month: 3, year: 1994 } }));
    expect(navigate).toHaveBeenLastCalledWith('domain');
    // Nothing can check the domain ahead of time, so it is taken as given: creating the workspace decides.
    act(() => void flow().actions.checkDomain('northwind.example'));
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('domain-ok'));
    act(() => flow().actions.confirmDomain());
    act(() => flow().actions.enterAdmin({ adminUser: 'amara', password, marketing: { productNews: false, teamTips: false } }));

    expect(navigate).toHaveBeenCalledWith('creating', undefined);
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('ready', { replace: true }));
    expect(session.registerBusiness).toHaveBeenCalledWith(expect.objectContaining({ email: 'amara@northwind.example', lastName: '', domain: 'northwind.example' }));
    expect(store.getState().creation).toMatchObject({ created: true, settled: false, finished: true });
  });

  it('after a refusal, returns to the step and then on through the admin sign-in, there being no checkout to return to', async () => {
    const { flow, navigate, session, store } = setup({ ...bare, step: 'admin', events: answers.slice(0, 5) });
    session.registerBusiness.mockRejectedValueOnce(failure(409, 'DOMAIN_CONFLICT'));

    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('domain', { replace: true }));
    expect(store.getState()).toMatchObject({ editing: false, rejection: { step: 'domain', reason: 'claimed' } });
  });
});
