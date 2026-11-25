import type { BillingPeriod, DomainOffer, PromoCode } from '@yahel/api-client';

export const businessSteps = ['start', 'you', 'domain-question', 'domain', 'domain-ok', 'find', 'found', 'registrant', 'admin', 'creating', 'ready', 'plan', 'checkout', 'gateway', 'card-code', 'paid'] as const;
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
export type Rejection = { step: 'domain'; reason: 'claimed' | 'public' } | { step: 'find'; reason: 'claimed' } | { step: 'admin'; reason: 'taken' };

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
  finished: boolean;
  /** The order was paid for and tied to the workspace, after the administrator's phone was checked. */
  settled: boolean;
}

/**
 * Everything the flow remembers between steps, in memory only: a reload clears it, and nothing here is ever
 * written to the address bar or to web storage. The administrator's password has to be kept from the step
 * that asks for it until the workspace is created, and is dropped the moment it is, and with everything
 * else (`reset`) when the flow is left or started again. It is never handed back to a step. Card details
 * and the bank's code are never here at all: they go from their fields straight into one request, which
 * keeps no copy (`flow/use-flow-request.ts`); `payment` holds only what a receipt would print. Registration
 * answers with a phone challenge, not a session (F-97): it is kept until it is handed to the phone step.
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
  /** The personal account in use whose name and address filled in the empty fields, once per visit. `null` until then. */
  prefilledFrom: string | null;
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
  rejection: Rejection | null;
  creation: Creation;
  /** The phone check registration answered with: no session exists until its texted code is met. */
  challengeToken: string | null;
}

const initialCreation: Creation = { started: false, created: false, tenantId: null, finished: false, settled: false };

export const DEFAULT_COUNTRY = 'NG';
/** Nigerian addresses have a local government area and numeric postal codes. */
export const NIGERIA = 'NG';

export const initialBusinessState: BusinessState = {
  businessName: '',
  size: 'medium',
  country: DEFAULT_COUNTRY,
  firstName: '',
  lastName: '',
  contactEmail: '',
  prefilledFrom: null,
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
  rejection: null,
  creation: initialCreation,
  challengeToken: null,
};

export type BusinessEvent =
  | { type: 'business-entered'; businessName: string; size: TeamSize; country: string }
  | { type: 'you-entered'; firstName: string; lastName: string; contactEmail: string }
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
  | { type: 'creation-started' }
  /** The attempt ended without an answer that settles it: the person may go back and change things. */
  | { type: 'creation-stopped' }
  | { type: 'workspace-created'; tenantId: string | null; challengeToken: string | null }
  | { type: 'order-settled' }
  | { type: 'creation-finished' }
  | { type: 'answer-rejected'; rejection: Rejection }
  | { type: 'prefilled'; firstName: string; lastName: string; contactEmail: string; from: string }
  | { type: 'reset' };

const clearRejection = (state: BusinessState, ...steps: Rejection['step'][]) => (state.rejection && steps.includes(state.rejection.step) ? null : state.rejection);
const inCreation = (state: BusinessState, change: Partial<Creation>): BusinessState => ({ ...state, creation: { ...state.creation, ...change } });

export function reduce(state: BusinessState, event: BusinessEvent): BusinessState {
  switch (event.type) {
    case 'business-entered':
      // The country sets the currency, so anything priced for the old one is asked for again.
      return { ...state, businessName: event.businessName, size: event.size, country: event.country, payment: null, ...(event.country === state.country ? {} : { promo: null, address: null }) };
    case 'you-entered':
      return { ...state, firstName: event.firstName, lastName: event.lastName, contactEmail: event.contactEmail };
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
    case 'creation-started':
      return inCreation(state, { started: true });
    case 'creation-stopped':
      return state.creation.created ? state : inCreation(state, { started: false });
    case 'workspace-created':
      // The last thing the password is needed for. What signs in now is the phone check.
      return { ...inCreation(state, { created: true, tenantId: event.tenantId }), password: null, challengeToken: event.challengeToken };
    case 'order-settled':
      return inCreation(state, { settled: true });
    case 'creation-finished':
      return inCreation(state, { finished: true });
    case 'answer-rejected':
      // The workspace was not created, so the attempt is over.
      return { ...state, rejection: event.rejection, creation: initialCreation, ...(event.rejection.step === 'domain' ? { ownedDomainConfirmed: false } : {}), ...(event.rejection.step === 'find' ? { bought: null } : {}) };
    case 'prefilled':
      // Once only, and only into fields still empty: what the person typed, or cleared, is never filled again.
      if (state.prefilledFrom !== null) return state;
      return { ...state, firstName: state.firstName || event.firstName, lastName: state.lastName || event.lastName, contactEmail: state.contactEmail || event.contactEmail, prefilledFrom: event.from };
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
  /** Plans and checkout exist. Without them the workspace is created and the administrator goes on to Admin. */
  billing: boolean;
  /** This tab is signed in: after the workspace exists, only meeting the phone check does that. */
  signedIn: boolean;
}

const aboutYouAnswered = (state: BusinessState) => state.businessName !== '' && state.firstName !== '';
const hasDomain = (state: BusinessState) => (state.domainSource === 'bought' ? state.bought !== null && state.address !== null : state.ownedDomain !== '' && state.ownedDomainConfirmed);

/** Once signed in after the workspace exists: the plan, checkout and payment, in that order, until it is paid. */
function afterSignIn(step: BusinessStep, state: BusinessState, facts: BusinessFacts): BusinessStep {
  if (!facts.billing) return 'ready';
  if (state.creation.settled) return 'paid';
  switch (step) {
    case 'checkout':
      return state.planChosen ? 'checkout' : 'plan';
    case 'registrant':
      // A business that owns its domain gives its address from checkout, where the invoice needs it.
      return state.planChosen && state.domainSource === 'owned' ? 'registrant' : afterSignIn('checkout', state, facts);
    case 'gateway':
      return state.planChosen && state.address !== null ? 'gateway' : afterSignIn('checkout', state, facts);
    case 'card-code':
      return state.payment && !state.payment.authorised ? 'card-code' : afterSignIn('gateway', state, facts);
    default:
      return 'plan';
  }
}

/**
 * The step that can honestly be shown when `step` is asked for: `step` itself if everything it depends
 * on is present, otherwise the nearest step that is. This is what makes a reload, a pasted address or
 * the Forward button land somewhere that works.
 */
export function resumeStep(step: BusinessStep, state: BusinessState, facts: BusinessFacts): BusinessStep {
  // Once the workspace exists the answers are final: only what comes after can be shown. Until the phone check
  // signs the administrator in, that is Ready, which leads to it; afterwards, the plan and checkout.
  if (state.creation.created) {
    if (!state.creation.finished) return 'creating';
    return facts.signedIn ? afterSignIn(step, state, facts) : 'ready';
  }
  if (state.creation.started) return 'creating';
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
    case 'found':
      return state.domainSource === 'bought' && state.bought !== null && aboutYouAnswered(state) ? 'found' : resumeStep('find', state, facts);
    case 'registrant':
      return state.domainSource === 'bought' && state.bought !== null && aboutYouAnswered(state) ? 'registrant' : resumeStep('find', state, facts);
    case 'admin':
      if (hasDomain(state)) return 'admin';
      if (state.domainSource === 'bought') return resumeStep(state.bought ? 'registrant' : 'find', state, facts);
      return state.ownedDomain !== '' && aboutYouAnswered(state) ? resumeStep('domain-ok', state, facts) : domainStart();
    default:
      // Creating, Ready and everything after need the workspace.
      return resumeStep('admin', state, facts);
  }
}

/** Where the step's Back link leads, or `null` when there is nowhere earlier to go. */
export function backOf(step: BusinessStep, state: BusinessState, facts: BusinessFacts): BusinessStep | null {
  switch (step) {
    case 'start':
    case 'creating':
    case 'ready':
    case 'plan':
    case 'paid':
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
    case 'found':
      return 'find';
    case 'registrant':
      return state.domainSource === 'bought' && !state.creation.created ? 'found' : 'checkout';
    case 'admin':
      return state.domainSource === 'bought' ? 'registrant' : 'domain-ok';
    case 'checkout':
      return 'plan';
    case 'gateway':
      return 'checkout';
    case 'card-code':
      return 'gateway';
  }
}

/** The workspace exists: visiting the start of the flow does not begin again. */
export const hasWorkspaceUnderway = (state: BusinessState) => state.creation.created;

/** The step that follows `step` once it has been answered. `creating` means: create the workspace now. */
export function nextOf(step: Exclude<BusinessStep, 'creating' | 'ready' | 'gateway' | 'card-code' | 'paid'>, state: BusinessState, facts: BusinessFacts): BusinessStep {
  switch (step) {
    case 'start':
      return 'you';
    case 'you':
      return facts.domainsForSale ? 'domain-question' : 'domain';
    case 'domain-question':
      return state.domainSource === 'owned' ? 'domain' : 'find';
    case 'domain':
      return 'domain-ok';
    case 'find':
      return 'found';
    case 'found':
      return 'registrant';
    case 'domain-ok':
      return 'admin';
    case 'registrant':
      // For a bought domain the registrant comes before the admin sign-in; for one owned, it is asked from checkout.
      return state.creation.created ? 'checkout' : 'admin';
    case 'admin':
      return 'creating';
    case 'plan':
      return 'checkout';
    case 'checkout':
      return 'gateway';
  }
}

export type ProgressPart = 'business' | 'you' | 'domain' | 'admin' | 'plan' | 'checkout';

/** How far along the questions a step is, of how many, and which of them it belongs to. Steps outside the count have none. */
export function progressOf(step: BusinessStep, facts: Pick<BusinessFacts, 'billing'>): { current: number; total: number; part: ProgressPart } | null {
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
    case 'found':
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
