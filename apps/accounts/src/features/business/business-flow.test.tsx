import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, createAccountCapabilities } from '@yahel/api-client';
import type { WorkspaceBilling } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import { createSession } from '@yahel/auth';
import type { Session } from '@yahel/auth';
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
const made = { phoneRequired: true, challengeToken: 'pc-1', tenant: { id: 't1', slug: 'northwind-studio', displayName: 'Northwind Studio', status: 'pending_setup' }, domain: { domain: 'northwind.example', status: 'pending' } };
const links = { signIn: '/signin', personal: '/personal', help: 'https://yahel.example/help', businessTerms: null, trialTerms: null, domainTerms: null };
const address = { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '', phoneCountry: 'NG', phone: '803 555 0142' };

const answers: BusinessEvent[] = [
  { type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' },
  { type: 'you-entered', firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara@mail.example' },
  { type: 'owned-domain-entered', domain: 'northwind.example' },
  { type: 'owned-domain-confirmed' },
  { type: 'admin-entered', adminUser: 'amara', password, marketing: { productNews: true, teamTips: false } },
];
/** The workspace made, its phone checked and the administrator signed in: what the plan and checkout start from. */
const madeAndSignedIn: BusinessEvent[] = [...answers, { type: 'creation-started' }, { type: 'workspace-created', tenantId: 't1', challengeToken: 'pc-1' }, { type: 'creation-finished' }, { type: 'plan-chosen' }, { type: 'address-entered', address }];

const fakeSession = (status: 'signed-in' | 'signed-out' = 'signed-out') => {
  // The slot the tab uses: a sign-in that opens a session moves it, as the real session does.
  let inUse: number | null = null;
  const signIn = vi.fn<Session['signIn']>().mockResolvedValue({ ok: false, reason: 'phone-required', challengeToken: 'pc-2' });
  return {
    store: createStore(() => ({ status, profile: null, slot: null, handle: null })),
    registerBusiness: vi.fn().mockResolvedValue(made),
    signIn: Object.assign(signIn, {
      opens: (slot: number) => {
        inUse = slot;
      },
    }),
    slotInUse: () => inUse,
    signOut: vi.fn(async () => {
      inUse = null;
    }),
    switchTo: vi.fn().mockResolvedValue(true),
    api: { auth: {} },
  };
};

function Probe({ onValue, onToast }: { onValue: (value: BusinessFlowValue) => void; onToast: (toast: ReturnType<typeof useToast>) => void }) {
  onValue(useBusinessFlow());
  onToast(useToast());
  return null;
}

const setup = ({ step = 'gateway' as BusinessStep, standIns = true, signedIn = true, events = madeAndSignedIn, before = undefined as ((billing: WorkspaceBilling) => unknown) | undefined, session: given = undefined as Session | undefined } = {}) => {
  act(() => dismissToast());
  const session = (given ?? fakeSession(signedIn ? 'signed-in' : 'signed-out')) as ReturnType<typeof fakeSession>;
  const capabilities = createAccountCapabilities(session.api as unknown as Session['api'], standIns ? createStandIns(instant) : undefined);
  if (capabilities.workspaceBilling) before?.(capabilities.workspaceBilling);
  const store = createBusinessStore();
  events.forEach(store.dispatch);
  const navigate = vi.fn();
  const checkPhone = vi.fn();
  const goToAdmin = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let latest: BusinessFlowValue | undefined;
  let said: ReturnType<typeof useToast> = null;
  const tree = (current: BusinessStep) => (
    <QueryClientProvider client={queryClient}>
      <BusinessFlowProvider step={current} session={session as unknown as Session} capabilities={capabilities} store={store} facts={businessFacts({ capabilities, session: session as unknown as Session })} links={links} navigate={navigate} checkPhone={checkPhone} goToAdmin={goToAdmin}>
        <Probe onValue={(value) => (latest = value)} onToast={(toast) => (said = toast)} />
      </BusinessFlowProvider>
    </QueryClientProvider>
  );
  const view = render(tree(step));
  const flow = () => latest!;
  /** Everything the query client is holding on to, as text, to search for things that must not be kept. */
  const retained = () => JSON.stringify([queryClient.getMutationCache().getAll().map((mutation) => mutation.state), queryClient.getQueryCache().getAll().map((query) => [query.queryKey, query.state.data])]);
  const priced = () => waitFor(() => expect(flow().state.quote.status).toBe('ready'));
  return { session, capabilities, billing: capabilities.workspaceBilling!, store, navigate, checkPhone, goToAdmin, flow, retained, priced, toast: () => said, goTo: (next: BusinessStep) => view.rerender(tree(next)) };
};

afterEach(() => vi.restoreAllMocks());

/** Up to the admin sign-in, before anything is created or signed in. */
const asking = { signedIn: false, step: 'admin' as BusinessStep, events: answers };

describe('BusinessFlowProvider: answering', () => {
  it('moves through the questions in the designed order for a domain the business owns, and creates the workspace after the admin sign-in', async () => {
    const { flow, navigate, store } = setup({ ...asking, step: 'start', events: [] });

    act(() => flow().actions.enterBusiness({ businessName: 'Northwind Studio', size: 'small', country: 'NG' }));
    expect(navigate).toHaveBeenLastCalledWith('you');
    act(() => flow().actions.enterYou({ firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara@mail.example' }));
    expect(navigate).toHaveBeenLastCalledWith('domain-question');
    act(() => flow().actions.chooseDomainSource('owned'));
    expect(navigate).toHaveBeenLastCalledWith('domain');
    act(() => void flow().actions.checkDomain('northwind.example'));
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('domain-ok'));
    act(() => flow().actions.confirmDomain());
    expect(navigate).toHaveBeenLastCalledWith('admin');
    act(() => flow().actions.enterAdmin({ adminUser: 'amara', password, marketing: { productNews: false, teamTips: false } }));
    expect(navigate).toHaveBeenCalledWith('creating', undefined);
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('ready', { replace: true }));
    expect(flow().state).not.toHaveProperty('password');
    expect(flow().state).not.toHaveProperty('challengeToken');
    expect(store.getState()).toMatchObject({ password: null, challengeToken: 'pc-1' });
  });

  it('goes through the search, the domain found and the registrant’s address for a domain bought here', async () => {
    const { flow, navigate, store, goTo } = setup({ ...asking, step: 'domain-question', events: answers.slice(0, 2) });

    act(() => flow().actions.chooseDomainSource('bought'));
    expect(navigate).toHaveBeenLastCalledWith('find');
    goTo('find');
    act(() => flow().actions.pickDomain({ domain: 'example.com', yearly: { amount: 1_850_000, currency: 'NGN' }, bestMatch: true }));
    act(() => flow().actions.continueWithDomain());
    expect(navigate).toHaveBeenLastCalledWith('found');
    goTo('found');
    act(() => flow().actions.continueWithDomain());
    expect(navigate).toHaveBeenLastCalledWith('registrant');
    act(() => flow().actions.enterAddress(address));
    expect(navigate).toHaveBeenLastCalledWith('admin');
    expect(store.getState()).toMatchObject({ domainSource: 'bought', address });
  });

  it('keeps a refused domain on its step: claimed or public, as whatever checks it says', async () => {
    const { flow, navigate, store } = setup({ ...asking, step: 'domain', events: answers.slice(0, 2) });

    act(() => void flow().actions.checkDomain('taken.example'));
    await waitFor(() => expect(flow().state.rejection).toEqual({ step: 'domain', reason: 'claimed' }));
    act(() => void flow().actions.checkDomain('gmail.com'));
    await waitFor(() => expect(flow().state.rejection).toEqual({ step: 'domain', reason: 'public' }));
    expect(navigate).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ ownedDomain: 'gmail.com', ownedDomainConfirmed: false });
  });

  it('searches for what is typed once typing pauses, and says what it found', async () => {
    const { flow } = setup({ ...asking, step: 'find', events: [...answers.slice(0, 2), { type: 'domain-source-chosen', source: 'bought' }] });
    await waitFor(() => expect(flow().state.offers).toMatchObject({ status: 'ready', value: [{ domain: expect.stringMatching(/^northwindstudio\./) as string, bestMatch: true }, {}, {}, {}] }));

    act(() => flow().actions.typeSearch('example'));
    await waitFor(() => expect(flow().state.offers.value?.[0]?.domain).toBe('example.com'));
  });

  it('forgets everything on "Start again"', () => {
    const { flow, navigate, store } = setup(asking);
    act(() => flow().actions.startAgain());

    expect(store.getState()).toMatchObject({ businessName: '', password: null, payment: null });
    expect(navigate).toHaveBeenLastCalledWith('start', { replace: true });
  });

  it('hands Ready on to the phone check, and the paid order on to Admin', () => {
    const { flow, checkPhone, goToAdmin } = setup({ step: 'ready' });
    act(() => flow().actions.checkPhone());
    act(() => flow().actions.goToAdmin());
    expect(checkPhone).toHaveBeenCalledTimes(1);
    expect(goToAdmin).toHaveBeenCalledTimes(1);
  });

  it('tells the steps what they need: progress, the way back, what is offered and where the ways out lead', () => {
    const { flow } = setup({ step: 'checkout' });

    expect(flow().meta).toMatchObject({ backHref: '/business/plan', progress: { current: 6, total: 6, part: 'checkout' }, offers: { domainsForSale: true, billing: true, signedIn: true, contactEmail: true, marketing: true }, links, screens: { account: null, exits: { signIn: '/signin', signUp: '/business/start', support: links.help } } });
  });
});

describe('BusinessFlowProvider: the plan and the order', () => {
  it('shows the plan and the server’s sums for the order as it stands, and prices each change', async () => {
    const { flow, priced, store } = setup({ step: 'plan' });
    await priced();
    expect(flow().state.plan.value).toMatchObject({ name: 'Yahel Business' });
    expect(flow().state.quote.value).toMatchObject({ period: 'monthly', seats: 2, trial: true, dueToday: { amount: 0 } });

    act(() => flow().actions.choosePeriod('yearly'));
    act(() => flow().actions.chooseSeats(12));
    await waitFor(() => expect(flow().state.quote.value).toMatchObject({ period: 'yearly', seats: 12, trial: false }));
    expect(store.getState()).toMatchObject({ period: 'yearly', seats: 12 });
  });

  it('applies a promo code, says so, and takes it off again', async () => {
    const { flow, priced, toast } = setup({ step: 'plan' });
    await priced();

    act(() => void flow().actions.applyPromo('nope'));
    await waitFor(() => expect(flow().meta.requests.applyPromo.feedback).toEqual({ place: 'field', field: 'promo', text: m.promoInvalid }));
    act(() => void flow().actions.applyPromo('launch'));
    await waitFor(() => expect(flow().state.promo).toEqual({ code: 'LAUNCH', percent: 20, months: 3 }));
    expect(toast()?.text).toBe(m.promoSaid(20, 3));
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
    const { flow, billing } = setup(asking);
    const plan = vi.spyOn(billing, 'plan');
    expect(flow().state.plan).toEqual({ status: 'loading', value: null });
    expect(plan).not.toHaveBeenCalled();
  });

  it('from checkout, goes to the payment page, the plan, or the contact information', () => {
    const { flow, navigate } = setup({ step: 'checkout' });
    act(() => flow().actions.toPayment());
    expect(navigate).toHaveBeenLastCalledWith('gateway');
    act(() => flow().actions.changePlan());
    expect(navigate).toHaveBeenLastCalledWith('plan');
    act(() => flow().actions.editContact());
    expect(navigate).toHaveBeenLastCalledWith('registrant');
    act(() => flow().actions.enterAddress({ ...address, city: 'Ikeja' }));
    expect(navigate).toHaveBeenLastCalledWith('checkout');
  });
});

describe('BusinessFlowProvider: paying, once signed in', () => {
  it('hands the card to the checkout once and remembers only its network and last four digits', async () => {
    const { flow, navigate, store, billing, priced } = setup();
    const pay = vi.spyOn(billing, 'pay');
    await priced();

    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));

    expect(pay).toHaveBeenCalledWith({ planId: 'business', period: 'monthly', seats: 2, promoCode: null, domain: null }, card, { businessName: 'Northwind Studio', email: 'amara@mail.example', address: { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '', country: 'NG', phone: '+2348035550142' } });
    expect(store.getState().payment).toEqual({ id: expect.stringMatching(/^pay_demo_/) as string, card: { brand: 'Visa', lastFour: '4081' }, sentTo: '••• ••• ••42', authorised: false });
  });

  it('a confirmed code ties the payment to the workspace made and leads to the paid order', async () => {
    const { flow, navigate, store, billing, priced, goTo } = setup();
    const complete = vi.spyOn(billing, 'complete');
    await priced();
    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));
    goTo('card-code');
    act(() => void flow().actions.confirmCard('482913'));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('paid', { replace: true }));
    expect(complete).toHaveBeenCalledWith(store.getState().payment!.id, { tenantId: 't1', domain: 'northwind.example', marketing: { productNews: true, teamTips: false } });
    expect(store.getState().creation.settled).toBe(true);
  });

  it('tells a declined card on the step and opens no payment', async () => {
    const { flow, navigate, store, priced } = setup();
    await priced();
    act(() => void flow().actions.pay({ ...card, number: '4000 0000 0000 0002' }));

    await waitFor(() => expect(flow().meta.requests.pay.feedback).toEqual({ place: 'banner', tone: 'danger', title: m.cardDeclinedTitle, text: m.cardDeclined }));
    expect(store.getState().payment).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('tells a wrong and a spent code apart, and a new code makes the payment usable again', async () => {
    const { flow, priced, navigate, toast, goTo } = setup();
    await priced();
    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));
    goTo('card-code');
    for (let tries = 0; tries < 4; tries += 1) {
      act(() => void flow().actions.confirmCard('000000'));
      await waitFor(() => expect(flow().meta.requests.confirmCard.isPending).toBe(false));
      expect(flow().meta.requests.confirmCard.feedback).toEqual({ place: 'field', field: 'code', text: m.bankCodeWrong });
    }
    act(() => void flow().actions.confirmCard('000000'));
    await waitFor(() => expect(flow().meta.requests.confirmCard.feedback).toMatchObject({ title: m.bankCodeDeadTitle, next: 'resend' }));

    act(() => void flow().actions.resendCardCode());
    await waitFor(() => expect(toast()?.text).toBe(m.bankResent));
    act(() => void flow().actions.confirmCard('482913'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('paid', { replace: true }));
  });

  it('lets go of the payment on "Use a different card" and returns to the payment page', async () => {
    const { flow, navigate, store, billing, priced } = setup();
    const release = vi.spyOn(billing, 'release');
    await priced();
    act(() => void flow().actions.pay(card));
    await waitFor(() => expect(store.getState().payment).not.toBeNull());
    const { id } = store.getState().payment!;

    act(() => flow().actions.useDifferentCard());

    expect(release).toHaveBeenCalledWith(id);
    expect(store.getState().payment).toBeNull();
    expect(navigate).toHaveBeenLastCalledWith('gateway', { replace: true });
  });
});

describe('BusinessFlowProvider: creating the workspace', () => {
  it('registers what was answered with the reachable email and no date of birth, keeps the phone check, and forgets the password', async () => {
    const { flow, session, store, navigate } = setup(asking);
    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.registerBusiness).toHaveBeenCalledWith({ email: 'amara@northwind.example', password, firstName: 'Amara', lastName: 'Okafor', businessName: 'Northwind Studio', slug: 'northwind-studio', country: { name: 'Nigeria', code: 'NG', currency: 'NGN' }, employeeCount: 2, domain: 'northwind.example', contactEmail: 'amara@mail.example' });
    expect(store.getState()).toMatchObject({ password: null, challengeToken: 'pc-1', creation: { created: true, tenantId: 't1', finished: true, settled: false } });
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it('makes one request for two presses', async () => {
    const { flow, session, navigate } = setup(asking);
    act(() => {
      flow().actions.createWorkspace();
      flow().actions.createWorkspace();
    });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.registerBusiness).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['PUBLIC_EMAIL_NOT_ALLOWED', 400, { step: 'domain', reason: 'public' }],
    ['DOMAIN_CONFLICT', 409, { step: 'domain', reason: 'claimed' }],
    ['DOMAIN_ALREADY_CLAIMED', 409, { step: 'domain', reason: 'claimed' }],
  ] as const)('sends the person back to the answer the server refused (%s), and keeps the rest', async (code, status, rejection) => {
    const { flow, session, store, navigate } = setup(asking);
    session.registerBusiness.mockRejectedValueOnce(failure(status, code));
    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith(rejection.step, { replace: true }));
    expect(store.getState()).toMatchObject({ rejection, password, businessName: 'Northwind Studio', creation: { started: false, created: false } });
  });

  it('tries the short name made from the domain when the one made from the business name is taken, and stops when both are', async () => {
    const first = setup(asking);
    first.session.registerBusiness.mockRejectedValueOnce(failure(409, 'DUPLICATE_RECORD'));
    act(() => first.flow().actions.createWorkspace());
    await waitFor(() => expect(first.navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(first.session.registerBusiness.mock.calls.map(([details]) => (details as { slug: string }).slug)).toEqual(['northwind-studio', 'northwind-example']);

    const both = setup(asking);
    both.session.registerBusiness.mockRejectedValue(failure(409, 'DUPLICATE_RECORD'));
    act(() => both.flow().actions.createWorkspace());
    await waitFor(() => expect(both.flow().meta.requests.create.feedback).toMatchObject({ place: 'banner', tone: 'danger' }));
    expect(both.store.getState().creation.created).toBe(false);
  });

  it('recovers when the answer to creating was lost: a phone check for the address shows the administrator is this person’s', async () => {
    const { session, flow, navigate, store } = setup(asking);
    session.registerBusiness.mockRejectedValueOnce(lost()).mockRejectedValueOnce(failure(409, 'EMAIL_ALREADY_EXISTS'));
    act(() => flow().actions.createWorkspace());
    await waitFor(() => expect(flow().meta.requests.create.feedback).toEqual({ place: 'banner', tone: 'offline', title: fm.unreachableTitle, text: fm.unreachableText, next: 'retry' }));
    expect(store.getState()).toMatchObject({ password, creation: { created: false } });

    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(session.signIn).toHaveBeenCalledWith('amara@northwind.example', password);
    expect(store.getState()).toMatchObject({ password: null, challengeToken: 'pc-2', creation: { created: true, tenantId: null, finished: true } });
    expect(session.signOut).not.toHaveBeenCalled();
  });

  it.each([
    ['whose password is someone else’s', () => Promise.reject(failure(401, 'INVALID_CREDENTIALS')), 0],
    ['that is already set up and opens', () => Promise.resolve({ ok: true, slot: 2, handle: 'h-2' } as const), 1],
    ['that asks for a second step', () => Promise.resolve({ ok: false, reason: 'mfa-required', challengeToken: 'c' } as const), 0],
  ])('refuses the username for an address that already has an account %s, and signs nobody in', async (_, answer, signOuts) => {
    const { flow, session, navigate, store } = setup(asking);
    session.registerBusiness.mockRejectedValueOnce(failure(409, 'EMAIL_ALREADY_EXISTS'));
    session.signIn.mockImplementationOnce(async () => {
      const result = await answer();
      if (result.ok) session.signIn.opens(result.slot);
      return result;
    });
    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('admin', { replace: true }));
    expect(store.getState()).toMatchObject({ rejection: { step: 'admin', reason: 'taken' }, creation: { created: false } });
    expect(session.signOut).toHaveBeenCalledTimes(signOuts);
    if (signOuts) expect(session.signOut).toHaveBeenCalledWith(2);
  });

  it('closes only the session the check opened, and goes back to the account this tab was using', async () => {
    const { flow, session, navigate } = setup(asking);
    session.signIn.opens(0);
    session.registerBusiness.mockRejectedValueOnce(failure(409, 'EMAIL_ALREADY_EXISTS'));
    session.signIn.mockImplementationOnce(async () => {
      session.signIn.opens(3);
      return { ok: true, slot: 3, handle: 'h-3' };
    });
    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('admin', { replace: true }));
    expect(session.signOut).toHaveBeenCalledWith(3);
    expect(session.signOut).not.toHaveBeenCalledWith(0);
    expect(session.switchTo).toHaveBeenCalledWith(0, undefined);
  });

  it('with a real session, checking an existing address that answers with a phone check leaves nobody signed in', async () => {
    const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    const fetch = vi.fn(async (url: string | URL | Request) => {
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/auth/register-business')) return reply(409, { error: { code: 'EMAIL_ALREADY_EXISTS' } });
      if (path.endsWith('/auth/login')) return reply(201, { data: { phoneRequired: true, challengeToken: 'pc-9' } });
      return reply(404, { error: { code: 'NOT_FOUND' } });
    });
    const real = createSession({ baseUrl: 'https://api.yahel.example', fetch: fetch as typeof globalThis.fetch });
    const { flow, navigate, store } = setup({ ...asking, standIns: false, session: real });

    act(() => flow().actions.createWorkspace());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('ready', { replace: true }));
    expect(store.getState().challengeToken).toBe('pc-9');
    expect(real.store.getState().status).not.toBe('signed-in');
  });

  it('keeps no card detail, bank code or password anywhere, while the requests run and once they have settled', async () => {
    const { flow, navigate, retained, store, priced, goTo } = setup();
    const secrets = [card.number, card.number.replace(/ /g, ''), '4084 0840 8408', card.expiry, card.securityCode, card.name, '135790', password];
    await priced();
    act(() => void flow().actions.pay(card));
    expect(retained()).toContain('"status":"pending"');
    for (const secret of secrets) expect(retained()).not.toContain(secret);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('card-code'));
    goTo('card-code');
    act(() => void flow().actions.confirmCard('135790'));
    for (const secret of secrets) expect(retained()).not.toContain(secret);
    await waitFor(() => expect(flow().meta.requests.confirmCard.isPending).toBe(false));

    const held = `${retained()} ${JSON.stringify(store.getState())} ${JSON.stringify(flow().state)}`;
    for (const secret of secrets) expect(held).not.toContain(secret);
  });
});

describe('BusinessFlowProvider: where nothing answers for plans or domains', () => {
  const bare = { standIns: false, signedIn: false, step: 'you' as BusinessStep, events: answers.slice(0, 1) };

  it('offers only what the backend has: a domain already owned, then the workspace straight after the admin sign-in', async () => {
    const { flow, navigate, session, store } = setup(bare);
    expect(flow().meta.offers).toEqual({ domainsForSale: false, billing: false, signedIn: false, contactEmail: false, marketing: false });
    expect(flow().meta.progress).toMatchObject({ total: 4 });

    act(() => flow().actions.enterYou({ firstName: 'Amara', lastName: '', contactEmail: '' }));
    expect(navigate).toHaveBeenLastCalledWith('domain');
    act(() => void flow().actions.checkDomain('northwind.example'));
    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('domain-ok'));
    act(() => flow().actions.confirmDomain());
    act(() => flow().actions.enterAdmin({ adminUser: 'amara', password, marketing: { productNews: false, teamTips: false } }));

    await waitFor(() => expect(navigate).toHaveBeenLastCalledWith('ready', { replace: true }));
    expect(session.registerBusiness).toHaveBeenCalledWith(expect.not.objectContaining({ contactEmail: expect.anything() as unknown }));
    expect(store.getState().creation).toMatchObject({ created: true, finished: true });
  });
});
