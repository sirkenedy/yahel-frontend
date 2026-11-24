import type { AccountCapabilities, BillingContact, CardDetails, OrderRequest, PostalAddress, RegisterBusinessBody } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { internationalNumber } from '../../flow/countries';
import { hasCode } from '../../flow/feedback';
import { say } from '../../flow/toasts';
import { useFlowRequest } from '../../flow/use-flow-request';
import { brandOf, cardDigits } from './card';
import { countryRecord } from './countries';
import { Refused, describeBusinessFailure } from './feedback';
import type { FailureContext } from './feedback';
import { adminAddressOf, domainOf, seatsOf, smallestTeam } from './machine';
import type { BusinessState, BusinessStep, Rejection } from './machine';
import { businessMessages as m } from './messages';
import type { BusinessStore } from './store';
import { slugOf, slugOfDomain } from './validation';

export interface BusinessRequestDeps {
  /** Counts the steps shown so far; see `useFlowRequest`. */
  visit: number;
  session: Session;
  capabilities: AccountCapabilities;
  store: BusinessStore;
  navigate: (step: BusinessStep, options?: { replace?: boolean }) => void;
  /** The plan on sale, once it is known. An order cannot be priced or paid for without it. */
  planId: () => string | null;
}

export type CreateOutcome = 'ready' | 'rejected';

/** What is being ordered, from the answers. */
export const orderOf = (state: BusinessState, planId: string): OrderRequest => ({
  planId,
  period: state.period,
  seats: seatsOf(state),
  promoCode: state.promo?.code ?? null,
  domain: state.domainSource === 'bought' ? (state.bought?.domain ?? null) : null,
});

const postalAddressOf = ({ address, country }: BusinessState): PostalAddress | null =>
  address ? { street: address.street, street2: address.street2, city: address.city, state: address.state, localArea: address.localArea, postalCode: address.postalCode, country, phone: internationalNumber(address.phoneCountry, address.phone) } : null;

const contactOf = (state: BusinessState): BillingContact => ({ businessName: state.businessName, email: state.contactEmail, address: postalAddressOf(state) });

/**
 * What the design collects, as the backend's register-business endpoint takes it. `email` is the
 * administrator's new address: it is what they will sign in with. `contactEmail` is a mailbox they can open
 * today, for reset links and setup updates. No date of birth is asked for a business (F-100). `slug` is made
 * here because the design never asks for one; `employeeCount` is the smallest team of the size chosen.
 */
export const registrationOf = (state: BusinessState, slug: string): RegisterBusinessBody => ({
  email: adminAddressOf(state),
  password: state.password ?? '',
  firstName: state.firstName,
  lastName: state.lastName,
  businessName: state.businessName,
  slug,
  country: countryRecord(state.country),
  employeeCount: smallestTeam[state.size],
  domain: domainOf(state),
  ...(state.contactEmail ? { contactEmail: state.contactEmail } : {}),
});

/**
 * Every request the workspace flow makes and where each outcome leads. Nothing here renders; the provider
 * turns these into `actions` and `meta.requests`.
 */
export function useBusinessRequests({ visit, session, capabilities, store, navigate, planId }: BusinessRequestDeps) {
  const state = () => store.getState();
  const describe = (context: FailureContext) => (error: unknown) => describeBusinessFailure(error, context);
  const billing = capabilities.workspaceBilling;

  /** Asks whether the domain can be claimed. Either way the domain is kept; a refusal is told on the step. */
  const checkDomain = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (domain: string) => {
      const standing = await capabilities.domainClaims.check(domain);
      store.dispatch({ type: 'owned-domain-entered', domain });
      if (standing === 'free') return 'free' as const;
      store.dispatch({ type: 'domain-refused', reason: standing });
      return 'refused' as const;
    },
    onDone: (outcome) => {
      if (outcome === 'free') navigate('domain-ok');
    },
  });

  const applyPromo = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (code: string) => {
      const promo = billing ? await billing.promo(code) : null;
      if (!promo) throw new Refused('promo-invalid');
      store.dispatch({ type: 'promo-changed', promo });
      return promo;
    },
    onDone: (promo) => say(m.promoSaid(promo.percent, promo.months)),
  });

  const reject = (rejection: Rejection): CreateOutcome => {
    store.dispatch({ type: 'answer-rejected', rejection });
    return 'rejected';
  };

  /**
   * The address already has a sign-in. If the password just chosen answers with a phone check, it is this person's
   * administrator, made by an attempt whose answer was lost or on an earlier visit, still waiting for its phone:
   * the check is theirs to meet. Anything else (a session, a second step, a wrong password) is someone's existing
   * account, and the username is refused. Resolves the phone check, or `null`.
   */
  const claimExisting = async () => {
    // A sign-in that opens a session for that address is closed again, and the account this tab was using, if any,
    // is used again: the other accounts in this browser are never signed out.
    const before = { slot: session.slotInUse(), handle: session.store.getState().handle };
    try {
      const result = await session.signIn(adminAddressOf(state()), state().password ?? '');
      return !result.ok && result.reason === 'phone-required' ? result.challengeToken : null;
    } catch (error) {
      if (hasCode(error, 'INVALID_CREDENTIALS')) return null;
      throw error;
    } finally {
      const opened = session.slotInUse();
      if (opened !== null && opened !== before.slot) await session.signOut(opened).catch(() => undefined);
      if (before.slot !== null && session.slotInUse() !== before.slot) await session.switchTo(before.slot, before.handle ?? undefined);
    }
  };

  const register = async (): Promise<CreateOutcome | null> => {
    const answers = state();
    const slugs = [...new Set([slugOf(answers.businessName, domainOf(answers)), slugOfDomain(domainOf(answers))])];
    for (const [attempt, slug] of slugs.entries()) {
      try {
        const made = await session.registerBusiness(registrationOf(answers, slug));
        store.dispatch({ type: 'workspace-created', tenantId: made.tenant.id, challengeToken: made.challengeToken });
        return null;
      } catch (error) {
        // Two businesses can share a name; only the short name made from it collided, so the one made from the domain is tried.
        if (hasCode(error, 'DUPLICATE_RECORD') && attempt < slugs.length - 1) continue;
        if (hasCode(error, 'PUBLIC_EMAIL_NOT_ALLOWED')) return reject(answers.domainSource === 'bought' ? { step: 'find', reason: 'claimed' } : { step: 'domain', reason: 'public' });
        if (hasCode(error, 'DOMAIN_CONFLICT', 'DOMAIN_ALREADY_CLAIMED')) return reject({ step: answers.domainSource === 'bought' ? 'find' : 'domain', reason: 'claimed' });
        if (!hasCode(error, 'EMAIL_ALREADY_EXISTS')) throw error;
        const challengeToken = await claimExisting();
        if (!challengeToken) return reject({ step: 'admin', reason: 'taken' });
        store.dispatch({ type: 'workspace-created', tenantId: null, challengeToken });
        return null;
      }
    }
    return null;
  };

  /**
   * Creates the workspace, recording that it is done. Started again after a failure it skips what is recorded,
   * so the workspace is created once however often it is retried. Nothing is paid yet: that comes after the
   * administrator's phone is checked and they are signed in.
   */
  const create = useFlowRequest({
    visit,
    scope: 'flow',
    describe: describe('create'),
    run: async (): Promise<CreateOutcome> => {
      const stopped = state().creation.created ? null : await register();
      if (stopped) return stopped;
      store.dispatch({ type: 'creation-finished' });
      return 'ready';
    },
    onDone: (outcome) => navigate(outcome === 'ready' ? 'ready' : (state().rejection?.step ?? 'start'), { replace: true }),
    onFailed: () => store.dispatch({ type: 'creation-stopped' }),
  });

  const startCreating = (options?: { replace?: boolean }) => {
    if (!create.start()) return;
    store.dispatch({ type: 'creation-started' });
    navigate('creating', options);
  };

  /** Ties the authorised payment to the workspace, once: this is when a real checkout takes money and registers a bought domain. */
  const settleOrder = async () => {
    const { payment, creation, marketing } = state();
    if (!billing || !payment?.authorised || creation.settled) return;
    // A workspace whose creating answer was lost is named by the session's own tenant on the server; the stand-in takes none.
    await billing.complete(payment.id, { tenantId: creation.tenantId ?? '', domain: domainOf(state()), marketing });
    store.dispatch({ type: 'order-settled' });
  };

  /**
   * Asks the bank to authorise the order. The card is the request's input: it is read once, handed to the
   * checkout and never kept, and of it only the network and last four digits reach the flow's state.
   */
  const pay = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (card: CardDetails) => {
      const plan = planId();
      if (!billing || !plan) throw new Error('Checkout is not offered');
      // A card typed again replaces the payment before it: that one is let go, never left held.
      const previous = state().payment;
      if (previous) {
        store.dispatch({ type: 'payment-dropped' });
        void billing.release(previous.id).catch(() => undefined);
      }
      const started = await billing.pay(orderOf(state(), plan), card, contactOf(state()));
      if (started.status === 'declined') throw new Refused('card-declined');
      store.dispatch({ type: 'payment-started', payment: { id: started.paymentId, card: { brand: brandOf(card.number), lastFour: cardDigits(card.number).slice(-4) }, sentTo: started.sentTo } });
      return 'code-needed' as const;
    },
    onDone: () => navigate('card-code'),
  });

  const confirmCard = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (code: string) => {
      const payment = state().payment;
      if (!billing || !payment) throw new Error('No payment is waiting for a code');
      const outcome = await billing.confirm(payment.id, code);
      if (outcome !== 'authorised') throw new Refused(outcome === 'spent' ? 'code-spent' : outcome);
      store.dispatch({ type: 'payment-authorised' });
      await settleOrder();
    },
    onDone: () => navigate('paid', { replace: true }),
  });

  const resendCardCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      const payment = state().payment;
      if (!billing || !payment) throw new Error('No payment is waiting for a code');
      await billing.resendCode(payment.id);
    },
    onDone: () => say(m.bankResent),
  });

  /** Gives up on the card being confirmed and returns to the payment page, where another can be typed. */
  const changeCard = () => {
    const payment = state().payment;
    if (payment && billing) void billing.release(payment.id).catch(() => undefined);
    store.dispatch({ type: 'payment-dropped' });
    navigate('gateway', { replace: true });
  };

  return { checkDomain, applyPromo, create, pay, confirmCard, resendCardCode, startCreating, changeCard };
}

export type BusinessRequests = ReturnType<typeof useBusinessRequests>;
