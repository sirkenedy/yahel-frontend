import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AccountCapabilities, BillingPeriod, CardDetails, DomainOffer, OrderQuote, WorkspacePlan } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import type { FlowDirection } from '@yahel/ui';
import { createContext, use } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import type { ScreenFacts } from '../../flow/step-frame';
import { useDebouncedValue } from '../../flow/use-debounced-value';
import { requestStatus as status } from '../../flow/use-flow-request';
import type { FlowRequest } from '../../flow/use-flow-request';
import { useStepTravel } from '../../flow/use-step-travel';
import type { BusinessField, BusinessNext } from './feedback';
import { adminAddressOf, backOf, directionOf, domainOf, nextOf, progressOf, seatsOf, stepPath } from './machine';
import type { BusinessAddress, BusinessFacts, BusinessState, BusinessStep, TeamSize } from './machine';
import { domainSearchQuery, planQuery, quoteQuery } from './queries';
import { orderOf, useBusinessRequests } from './requests';
import type { BusinessRequests } from './requests';
import type { BusinessStore } from './store';

const SEARCH_DELAY = 350;
const pricedSteps: readonly BusinessStep[] = ['plan', 'checkout', 'gateway', 'card-code', 'paid'];

/** Something asked of the server while a step is on screen: still coming, arrived, or not coming. */
export type Loaded<Value> = { status: 'loading' | 'failed'; value: null } | { status: 'ready'; value: Value };

export interface BusinessFlowValue {
  /** The answers, without the password or the phone check: no step is ever handed either. */
  state: Omit<BusinessState, 'password' | 'seats' | 'challengeToken'> & {
    step: BusinessStep;
    hasPassword: boolean;
    /** The domain the workspace will use, owned or bought. */
    domain: string;
    adminAddress: string;
    /** How many people the order is for. */
    seats: number;
    /** Domains like what is in the search field that can be bought. */
    offers: Loaded<readonly DomainOffer[]> | { status: 'idle'; value: null };
    plan: Loaded<WorkspacePlan>;
    /** The server's sums for the order as it stands. While a change is being priced, the last sums stay. */
    quote: Loaded<OrderQuote>;
  };
  actions: {
    enterBusiness: (answers: { businessName: string; size: TeamSize; country: string }) => void;
    enterYou: (answers: { firstName: string; lastName: string; contactEmail: string }) => void;
    chooseDomainSource: (source: BusinessState['domainSource']) => void;
    checkDomain: (domain: string) => void;
    confirmDomain: () => void;
    buyInstead: () => void;
    ownInstead: () => void;
    typeSearch: (query: string) => void;
    pickDomain: (offer: DomainOffer) => void;
    continueWithDomain: () => void;
    enterAddress: (address: BusinessAddress) => void;
    /** `password` is `null` to keep the one already chosen. */
    enterAdmin: (answers: { adminUser: string; password: string | null; marketing: BusinessState['marketing'] }) => void;
    choosePeriod: (period: BillingPeriod) => void;
    applyPromo: (code: string) => void;
    removePromo: () => void;
    choosePlan: () => void;
    chooseSeats: (seats: number) => void;
    changePlan: () => void;
    /** The address invoices go to, asked from checkout for a domain already owned. */
    editContact: () => void;
    /** From checkout to the payment partner's page. */
    toPayment: () => void;
    /** Hands the card to the checkout. It is not kept: of it, only the network and last four digits are remembered. */
    pay: (card: CardDetails) => void;
    confirmCard: (code: string) => void;
    resendCardCode: () => void;
    useDifferentCard: () => void;
    /** Tries again to create the workspace, carrying on from where it stopped. */
    createWorkspace: () => void;
    /** From Ready to the phone check, which signs the administrator in. */
    checkPhone: () => void;
    /** From the paid order to Admin, by way of the passkey it recommends. */
    goToAdmin: () => void;
    /** Forgets every answer and returns to the first screen. */
    startAgain: () => void;
    retryPricing: () => void;
  };
  meta: {
    direction: FlowDirection;
    backHref: string | null;
    progress: ReturnType<typeof progressOf>;
    offers: BusinessFacts & { contactEmail: boolean; marketing: boolean };
    links: BusinessFlowLinks;
    screens: ScreenFacts;
    requests: Record<Exclude<keyof BusinessRequests, 'startCreating' | 'changeCard'>, FlowRequest<BusinessField, BusinessNext>>;
  };
}

export interface BusinessFlowLinks {
  signIn: string;
  personal: string;
  help: string | null;
  businessTerms: string | null;
  trialTerms: string | null;
  domainTerms: string | null;
}

export const BusinessFlowContext = createContext<BusinessFlowValue | null>(null);

export const useBusinessFlow = () => {
  const value = use(BusinessFlowContext);
  if (!value) throw new Error('Workspace sign-up steps must be rendered inside <BusinessFlowProvider>.');
  return value;
};

export interface BusinessFlowProviderProps {
  step: BusinessStep;
  session: Session;
  capabilities: AccountCapabilities;
  store: BusinessStore;
  facts: BusinessFacts;
  links: BusinessFlowLinks;
  navigate: (step: BusinessStep, options?: { replace?: boolean }) => void;
  /** Leaves for the administrator's phone check, which workspace sign-up hands its challenge to. */
  checkPhone: () => void;
  /** Leaves for Admin's first steps, once the order is paid. */
  goToAdmin: () => void;
  children: ReactNode;
}

const loaded = <Value,>(query: { data: Value | undefined; isError: boolean }): Loaded<Value> => (query.data !== undefined ? { status: 'ready', value: query.data } : { status: query.isError ? 'failed' : 'loading', value: null });

/**
 * Gives the workspace sign-up steps one thing to read: `{ state, actions, meta }`. The state comes from the
 * store (`machine.ts`), the requests from `requests.ts`; this component only joins them, and holds the three
 * things the server is asked while answers are being given: the plan, the order's sums and the domain search.
 */
export function BusinessFlowProvider({ step, session, capabilities, store, facts, links, navigate, checkPhone, goToAdmin, children }: BusinessFlowProviderProps) {
  const { password, seats: chosenSeats, challengeToken, ...flow } = useStore(store);
  const whole: BusinessState = { ...flow, password, seats: chosenSeats, challengeToken };
  const travel = useStepTravel(step, directionOf);
  const billing = capabilities.workspaceBilling;
  const priced = facts.billing && pricedSteps.includes(step);

  const plan = useQuery({ ...planQuery(billing, flow.country), enabled: priced });
  const order = plan.data ? orderOf(whole, plan.data.id) : null;
  const quote = useQuery({ ...quoteQuery(billing, order), enabled: priced && order !== null, placeholderData: keepPreviousData });

  // What is in the search field, asked about once typing pauses.
  const asked = useDebouncedValue(flow.search, SEARCH_DELAY);
  const search = useQuery({ ...domainSearchQuery(capabilities.domainMarket, asked), enabled: step === 'find' && domainSearchQuery(capabilities.domainMarket, asked).enabled });
  const offers: BusinessFlowValue['state']['offers'] = !domainSearchQuery(capabilities.domainMarket, flow.search).enabled ? { status: 'idle', value: null } : flow.search !== asked ? { status: 'loading', value: null } : loaded(search);

  const requests = useBusinessRequests({ visit: travel.visit, session, capabilities, store, navigate, planId: () => plan.data?.id ?? null });
  const advance = (from: Parameters<typeof nextOf>[0]) => {
    const next = nextOf(from, store.getState(), facts);
    if (next === 'creating') requests.startCreating();
    else navigate(next);
  };
  const back = backOf(step, whole, facts);

  const value: BusinessFlowValue = {
    state: { ...flow, step, hasPassword: password !== null, domain: domainOf(flow), adminAddress: adminAddressOf(flow), seats: seatsOf(whole), offers, plan: loaded(plan), quote: loaded(quote) },
    actions: {
      enterBusiness: (answers) => {
        store.dispatch({ type: 'business-entered', ...answers });
        advance('start');
      },
      enterYou: (answers) => {
        store.dispatch({ type: 'you-entered', ...answers });
        advance('you');
      },
      chooseDomainSource: (source) => {
        store.dispatch({ type: 'domain-source-chosen', source });
        advance('domain-question');
      },
      checkDomain: requests.checkDomain.start,
      confirmDomain: () => {
        store.dispatch({ type: 'owned-domain-confirmed' });
        advance('domain-ok');
      },
      buyInstead: () => {
        store.dispatch({ type: 'domain-source-chosen', source: 'bought' });
        navigate('find');
      },
      ownInstead: () => {
        store.dispatch({ type: 'domain-source-chosen', source: 'owned' });
        navigate('domain');
      },
      typeSearch: (query) => store.dispatch({ type: 'search-typed', query }),
      pickDomain: (offer) => store.dispatch({ type: 'domain-picked', offer }),
      // From the search to the domain found, and from there to its registrant's address.
      continueWithDomain: () => advance(step === 'found' ? 'found' : 'find'),
      enterAddress: (address) => {
        store.dispatch({ type: 'address-entered', address });
        advance('registrant');
      },
      enterAdmin: (answers) => {
        store.dispatch({ type: 'admin-entered', ...answers });
        advance('admin');
      },
      choosePeriod: (period) => store.dispatch({ type: 'period-chosen', period }),
      applyPromo: requests.applyPromo.start,
      removePromo: () => store.dispatch({ type: 'promo-changed', promo: null }),
      choosePlan: () => {
        store.dispatch({ type: 'plan-chosen' });
        advance('plan');
      },
      chooseSeats: (seats) => store.dispatch({ type: 'seats-chosen', seats }),
      changePlan: () => navigate('plan'),
      editContact: () => navigate('registrant'),
      toPayment: () => advance('checkout'),
      pay: requests.pay.start,
      confirmCard: requests.confirmCard.start,
      resendCardCode: requests.resendCardCode.start,
      useDifferentCard: requests.changeCard,
      createWorkspace: () => requests.startCreating(),
      checkPhone,
      goToAdmin,
      startAgain: () => {
        store.dispatch({ type: 'reset' });
        navigate('start', { replace: true });
      },
      retryPricing: () => void (plan.isError ? plan.refetch() : quote.refetch()),
    },
    meta: {
      direction: travel.direction,
      backHref: back ? stepPath(back) : null,
      progress: progressOf(step, facts),
      // The current email and the two choices are asked only where something takes them: the workspace order.
      offers: { ...facts, contactEmail: billing !== null, marketing: billing !== null },
      links,
      screens: { account: null, exits: { signIn: links.signIn, signUp: stepPath('start'), support: links.help }, serviceStatus: capabilities.serviceStatus },
      requests: {
        checkDomain: status(requests.checkDomain),
        applyPromo: status(requests.applyPromo),
        create: status(requests.create, requests.startCreating),
        pay: status(requests.pay),
        confirmCard: status(requests.confirmCard),
        resendCardCode: status(requests.resendCardCode, requests.resendCardCode.start),
      },
    },
  };

  return <BusinessFlowContext value={value}>{children}</BusinessFlowContext>;
}
