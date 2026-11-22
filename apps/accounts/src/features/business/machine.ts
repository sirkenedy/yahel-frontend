import type { BillingPeriod, DomainOffer, PromoCode } from '@yahel/api-client';
import type { BirthDate } from '../../flow/dates';

export const businessSteps = ['start', 'you', 'domain-question', 'domain', 'domain-ok', 'find', 'registrant', 'admin', 'plan', 'checkout', 'card-code', 'creating', 'ready'] as const;
export type BusinessStep = (typeof businessSteps)[number];

/** How many people the business has, in the bands the first question offers. */
export type TeamSize = 'solo' | 'small' | 'medium' | 'large' | 'huge';
export const teamSizes: readonly TeamSize[] = ['solo', 'small', 'medium', 'large', 'huge'];
/** The smallest team in each band: what the backend is told, and how many people checkout starts with. */
export const smallestTeam: Record<TeamSize, number> = { solo: 1, small: 2, medium: 10, large: 100, huge: 300 };

/** Where the business is, for invoices and, for a domain bought here, the registry's records. */
export interface BusinessAddress {
  street: string;
  street2: string;
  city: string;
  state: string;
  localArea: string;
  postalCode: string;
  phoneCountry: string;
  phone: string;
}

/** A payment the bank has been asked to authorise. Of the card, only its network and last four digits are kept. */
export interface Payment {
  id: string;
  card: { brand: string | null; lastFour: string };
  /** A masked number the bank says it sent its code to, when it says. */
  sentTo: string | null;
  authorised: boolean;
}

/** An answer the server refused, and the step that has to be answered again. */
export type Rejection = { step: 'domain'; reason: 'claimed' | 'public' } | { step: 'find'; reason: 'claimed' } | { step: 'admin'; reason: 'taken' } | { step: 'you'; reason: 'underage' };

/**
 * How far creating the workspace has got. Each part is recorded as it happens, so another try (after a
 * failure, a lost answer or a second press) picks up where the first stopped: the workspace is created once.
 */
export interface Creation {
  started: boolean;
  /** The workspace exists and is this person's. */
  created: boolean;
  /** The workspace's id, when the answer that created it was received. */
  tenantId: string | null;
  /** The payment has been tied to the workspace. */
  settled: boolean;
  finished: boolean;
}

/**
 * Everything the flow remembers between steps, in memory only: a reload clears it, and nothing here is ever
 * written to the address bar or to web storage. The administrator's password has to be kept from the step
 * that asks for it until the workspace is created, and is dropped the moment it is, and with everything
 * else (`reset`) when the flow is left or started again. It is never handed back to a step. Card details
 * and the bank's code are never here at all: they go from their fields straight into one request, which
 * keeps no copy (`flow/use-flow-request.ts`); `payment` holds only what a receipt would print.
 */
export interface BusinessState {
  businessName: string;
  size: TeamSize;
  /** ISO 3166-1 alpha-2. */
  country: string;
  firstName: string;
  lastName: string;
  /** An address the person can open today. Asked only where something can use it. */
  contactEmail: string;
  birth: BirthDate | null;
  domainSource: 'owned' | 'bought';
  /** A domain the business says it owns, as last entered. */
  ownedDomain: string;
  /** The person has said yes to using it. */
  ownedDomainConfirmed: boolean;
  /** What is in the domain search field. */
  search: string;
  bought: DomainOffer | null;
  address: BusinessAddress | null;
  /** The part before the @ of the administrator's address. */
  adminUser: string;
  password: string | null;
  marketing: { productNews: boolean; teamTips: boolean };
  period: BillingPeriod;
  promo: PromoCode | null;
  planChosen: boolean;
  /** How many people to start with; `null` until checkout, which starts from the team's size. */
  seats: number | null;
  payment: Payment | null;
  /** The person came back from checkout to change one answer, and returns there afterwards. */
  editing: boolean;
  rejection: Rejection | null;
  creation: Creation;
}

const initialCreation: Creation = { started: false, created: false, tenantId: null, settled: false, finished: false };

export const DEFAULT_COUNTRY = 'NG';

export const initialBusinessState: BusinessState = {
  businessName: '',
  size: 'medium',
  country: DEFAULT_COUNTRY,
  firstName: '',
  lastName: '',
  contactEmail: '',
  birth: null,
  domainSource: 'owned',
  ownedDomain: '',
  ownedDomainConfirmed: false,
  search: '',
  bought: null,
  address: null,
  adminUser: '',
  password: null,
  marketing: { productNews: false, teamTips: false },
  period: 'monthly',
  promo: null,
  planChosen: false,
  seats: null,
  payment: null,
  editing: false,
  rejection: null,
  creation: initialCreation,
};

export type BusinessEvent =
  | { type: 'business-entered'; businessName: string; size: TeamSize; country: string }
  | { type: 'you-entered'; firstName: string; lastName: string; contactEmail: string; birth: BirthDate }
  | { type: 'domain-source-chosen'; source: BusinessState['domainSource'] }
  | { type: 'owned-domain-entered'; domain: string }
  | { type: 'domain-refused'; reason: 'claimed' | 'public' }
  | { type: 'owned-domain-confirmed' }
  | { type: 'search-typed'; query: string }
  | { type: 'domain-picked'; offer: DomainOffer }
  | { type: 'address-entered'; address: BusinessAddress }
  /** `password` is `null` when the one already chosen is kept. */
  | { type: 'admin-entered'; adminUser: string; password: string | null; marketing: BusinessState['marketing'] }
  | { type: 'period-chosen'; period: BillingPeriod }
  | { type: 'promo-changed'; promo: PromoCode | null }
  | { type: 'plan-chosen' }
  | { type: 'seats-chosen'; seats: number }
  | { type: 'payment-started'; payment: Omit<Payment, 'authorised'> }
  | { type: 'payment-authorised' }
  | { type: 'payment-dropped' }
  | { type: 'edit-started' }
  | { type: 'edit-finished' }
  | { type: 'creation-started' }
  | { type: 'workspace-created'; tenantId: string | null }
  | { type: 'order-settled' }
  | { type: 'creation-finished' }
  /** `returnToCheckout`: everything else stands, so once this is put right the person goes back to checkout. */
  | { type: 'answer-rejected'; rejection: Rejection; returnToCheckout: boolean }
  | { type: 'reset' };

const clearRejection = (state: BusinessState, ...steps: Rejection['step'][]) => (state.rejection && steps.includes(state.rejection.step) ? null : state.rejection);
const inCreation = (state: BusinessState, change: Partial<Creation>): BusinessState => ({ ...state, creation: { ...state.creation, ...change } });

export function reduce(state: BusinessState, event: BusinessEvent): BusinessState {
  switch (event.type) {
    case 'business-entered':
      // The country sets the currency, so anything priced for the old one is asked for again.
      return { ...state, businessName: event.businessName, size: event.size, country: event.country, payment: null, ...(event.country === state.country ? {} : { promo: null, address: null }) };
    case 'you-entered':
      return { ...state, firstName: event.firstName, lastName: event.lastName, contactEmail: event.contactEmail, birth: event.birth, rejection: clearRejection(state, 'you') };
    case 'domain-source-chosen':
      // The first search is for the business's own name.
      return { ...state, domainSource: event.source, payment: null, search: event.source === 'bought' && state.search === '' ? state.businessName.toLowerCase() : state.search };
    case 'owned-domain-entered':
      return { ...state, domainSource: 'owned', ownedDomain: event.domain, ownedDomainConfirmed: false, payment: null, rejection: clearRejection(state, 'domain', 'find') };
    case 'domain-refused':
      return { ...state, ownedDomainConfirmed: false, rejection: { step: 'domain', reason: event.reason } };
    case 'owned-domain-confirmed':
      return { ...state, domainSource: 'owned', ownedDomainConfirmed: true };
    case 'search-typed':
      // What was picked belonged to the last search; a new one starts with nothing picked.
      return event.query === state.search ? state : { ...state, search: event.query, bought: null, payment: null };
    case 'domain-picked':
      return { ...state, domainSource: 'bought', bought: event.offer, payment: null, rejection: clearRejection(state, 'domain', 'find') };
    case 'address-entered':
      return { ...state, address: event.address };
    case 'admin-entered':
      return { ...state, adminUser: event.adminUser, password: event.password ?? state.password, marketing: event.marketing, rejection: clearRejection(state, 'admin') };
    case 'period-chosen':
      return { ...state, period: event.period, payment: null };
    case 'promo-changed':
      return { ...state, promo: event.promo, payment: null };
    case 'plan-chosen':
      return { ...state, planChosen: true };
    case 'seats-chosen':
      return { ...state, seats: event.seats, payment: null };
    case 'payment-started':
      return { ...state, payment: { ...event.payment, authorised: false } };
    case 'payment-authorised':
      return state.payment ? { ...state, payment: { ...state.payment, authorised: true } } : state;
    case 'payment-dropped':
      return { ...state, payment: null };
    case 'edit-started':
      return { ...state, editing: true };
    case 'edit-finished':
      return { ...state, editing: false };
    case 'creation-started':
      return inCreation(state, { started: true });
    case 'workspace-created':
      // The last thing the password is needed for.
      return { ...inCreation(state, { created: true, tenantId: event.tenantId }), password: null };
    case 'order-settled':
      return inCreation(state, { settled: true });
    case 'creation-finished':
      return inCreation(state, { finished: true });
    case 'answer-rejected':
      // The workspace was not created, so the attempt is over and its payment with it.
      return { ...state, rejection: event.rejection, editing: event.returnToCheckout, payment: null, creation: initialCreation, ...(event.rejection.step === 'domain' ? { ownedDomainConfirmed: false } : {}), ...(event.rejection.step === 'find' ? { bought: null } : {}) };
    case 'reset':
      return initialBusinessState;
  }
}

/** The domain the workspace will use. */
export const domainOf = (state: Pick<BusinessState, 'domainSource' | 'ownedDomain' | 'bought'>) => (state.domainSource === 'bought' ? (state.bought?.domain ?? '') : state.ownedDomain);

/** The address the administrator will sign in with. */
export const adminAddressOf = (state: Pick<BusinessState, 'domainSource' | 'ownedDomain' | 'bought' | 'adminUser'>) => `${state.adminUser}@${domainOf(state)}`;

/** How many people the order is for: what checkout was told, or the smallest team of the size given at the start. */
export const seatsOf = (state: Pick<BusinessState, 'seats' | 'size'>) => state.seats ?? smallestTeam[state.size];

/** What is true outside the flow's own state when a step is about to be shown. */
export interface BusinessFacts {
  /** A domain can be searched for and bought here. Without it only a domain already owned can be used. */
  domainsForSale: boolean;
  /** Plans and checkout exist. Without them the workspace is created straight after the administrator's sign-in. */
  billing: boolean;
}

const aboutYouAnswered = (state: BusinessState) => state.businessName !== '' && state.firstName !== '' && state.birth !== null;
const hasDomain = (state: BusinessState) => (state.domainSource === 'bought' ? state.bought !== null && state.address !== null : state.ownedDomain !== '' && state.ownedDomainConfirmed);
const hasAdmin = (state: BusinessState) => hasDomain(state) && state.adminUser !== '' && state.password !== null;

/**
 * The step that can honestly be shown when `step` is asked for: `step` itself if everything it depends
 * on is present, otherwise the nearest earlier step. This is what makes a reload, a pasted address or
 * the Forward button land somewhere that works.
 */
export function resumeStep(step: BusinessStep, state: BusinessState, facts: BusinessFacts): BusinessStep {
  // Once the workspace exists the answers are final: only what comes after can be shown.
  if (state.creation.created) return state.creation.finished ? 'ready' : 'creating';
  const domainStart = (): BusinessStep => (aboutYouAnswered(state) ? (facts.domainsForSale ? 'domain-question' : 'domain') : resumeStep('you', state, facts));
  switch (step) {
    case 'start':
      return 'start';
    case 'you':
      return state.businessName ? 'you' : 'start';
    case 'domain-question':
      return domainStart();
    case 'domain':
      return aboutYouAnswered(state) ? 'domain' : resumeStep('you', state, facts);
    case 'domain-ok':
      return aboutYouAnswered(state) && state.ownedDomain !== '' && state.rejection?.step !== 'domain' ? 'domain-ok' : resumeStep('domain', state, facts);
    case 'find':
      return facts.domainsForSale ? (aboutYouAnswered(state) ? 'find' : resumeStep('you', state, facts)) : domainStart();
    case 'registrant': {
      // The address of a business that owns its domain is asked for from checkout, where the invoice needs it.
      const asked = state.domainSource === 'bought' ? state.bought !== null : facts.billing && hasAdmin(state);
      return aboutYouAnswered(state) && asked ? 'registrant' : state.domainSource === 'bought' ? resumeStep('find', state, facts) : resumeStep('checkout', state, facts);
    }
    case 'admin':
      if (hasDomain(state)) return 'admin';
      if (state.domainSource === 'bought') return resumeStep(state.bought ? 'registrant' : 'find', state, facts);
      return state.ownedDomain !== '' && aboutYouAnswered(state) ? resumeStep('domain-ok', state, facts) : domainStart();
    case 'plan':
      return facts.billing && hasAdmin(state) ? 'plan' : resumeStep('admin', state, facts);
    case 'checkout':
      return facts.billing && hasAdmin(state) && state.planChosen ? 'checkout' : resumeStep('plan', state, facts);
    case 'card-code':
      return state.payment && !state.payment.authorised ? 'card-code' : resumeStep('checkout', state, facts);
    case 'creating':
      return state.creation.started ? 'creating' : resumeStep(facts.billing ? 'checkout' : 'admin', state, facts);
    case 'ready':
      return resumeStep('creating', state, facts);
  }
}

const returnsToCheckout: readonly BusinessStep[] = ['start', 'you', 'domain-question', 'admin', 'plan'];

/** Where the step's Back link leads, or `null` when there is nowhere earlier to go. */
export function backOf(step: BusinessStep, state: BusinessState, facts: BusinessFacts): BusinessStep | null {
  if (state.editing && returnsToCheckout.includes(step)) return 'checkout';
  switch (step) {
    case 'start':
    case 'creating':
    case 'ready':
      return null;
    case 'you':
      return 'start';
    case 'domain-question':
      return 'you';
    case 'domain':
      return facts.domainsForSale ? 'domain-question' : 'you';
    case 'domain-ok':
      return 'domain';
    case 'find':
      return 'domain-question';
    case 'registrant':
      return state.domainSource === 'bought' ? 'find' : 'checkout';
    case 'admin':
      return state.domainSource === 'bought' ? 'registrant' : 'domain-ok';
    case 'plan':
      return 'admin';
    case 'checkout':
      return 'plan';
    case 'card-code':
      return 'checkout';
  }
}

/** The workspace exists, or is being made: visiting the start of the flow does not begin again. */
export const hasWorkspaceUnderway = (state: BusinessState) => state.creation.created;

/** The step that follows `step` once it has been answered. An answer changed from checkout returns there. `creating` means: create the workspace now. */
export function nextOf(step: Exclude<BusinessStep, 'checkout' | 'card-code' | 'creating' | 'ready'>, state: BusinessState, facts: BusinessFacts): BusinessStep {
  const onward = (next: BusinessStep) => (state.editing && facts.billing ? 'checkout' : next);
  switch (step) {
    case 'start':
      return onward('you');
    case 'you':
      return onward(facts.domainsForSale ? 'domain-question' : 'domain');
    case 'domain-question':
      return state.domainSource === 'owned' ? 'domain' : 'find';
    case 'domain':
      return 'domain-ok';
    case 'find':
      return 'registrant';
    case 'domain-ok':
    case 'registrant':
      return onward('admin');
    case 'admin':
      return facts.billing ? onward('plan') : 'creating';
    case 'plan':
      return 'checkout';
  }
}

export type ProgressPart = 'business' | 'you' | 'domain' | 'admin' | 'plan' | 'checkout';

/** How far along the questions a step is, of how many, and which of them it belongs to. Steps outside the count have none. */
export function progressOf(step: BusinessStep, facts: BusinessFacts): { current: number; total: number; part: ProgressPart } | null {
  const total = facts.billing ? 6 : 4;
  const at = (current: number, part: ProgressPart) => ({ current, total, part });
  switch (step) {
    case 'start':
      return at(1, 'business');
    case 'you':
      return at(2, 'you');
    case 'domain-question':
    case 'domain':
    case 'domain-ok':
    case 'find':
    case 'registrant':
      return at(3, 'domain');
    case 'admin':
      return at(4, 'admin');
    case 'plan':
      return at(5, 'plan');
    case 'checkout':
    case 'card-code':
      return at(6, 'checkout');
    default:
      return null;
  }
}

export const stepPath = <Step extends BusinessStep>(step: Step) => `/business/${step}` as const;

export const stepOfPath = (pathname: string): BusinessStep | null => businessSteps.find((step) => pathname.replace(/\/$/, '') === stepPath(step)) ?? null;

/** Whether moving between two steps goes deeper into the flow or back out of it, for the transition. */
export const directionOf = (from: BusinessStep, to: BusinessStep) => (businessSteps.indexOf(to) < businessSteps.indexOf(from) ? 'back' : 'forward');
