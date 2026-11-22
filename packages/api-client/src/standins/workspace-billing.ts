// STAND-IN, AND NOT A PAYMENT IMPLEMENTATION. Missing endpoints: GET /v1/billing/plans?country=,
// POST /v1/billing/promo-codes/check, POST /v1/billing/quotes, and a checkout (start, the bank's one-time
// code, completion, release). Nothing here touches the network, takes money or registers a domain.
//
// THE PLAN NAME AND EVERY PRICE ARE PLACEHOLDERS copied from the design boards for the business to
// confirm: "Yahel Business" at ₦5,000 a person a month, ₦4,200 when paid by the year ("Save 16%"), a
// 14-day free trial for teams of up to 10, 7.5% VAT not included, and the code LAUNCH for 20% off for 3
// months. The sums follow the design prototype.
//
// What it pretends: the card 4000 0000 0000 0002 is declined; any other card asks for the bank's code;
// the code 000000 is wrong (five wrong tries spend the payment), 999999 has expired, any other six digits
// are right.
//
// A REAL IMPLEMENTATION MUST NOT LOOK LIKE THIS. Card number, expiry, security code and the bank's
// one-time code must never reach this app's JavaScript or Yahel's servers: the card form has to be a
// payment provider's hosted fields or a redirect to the provider, and the bank's challenge (3-D Secure)
// the provider's own page. `pay` and `confirm` then disappear from this interface; what remains is
// "start a checkout session for this order" and "what became of it". The screens built on this stand-in
// are the design, not a payment flow.
//
// What the real flow must guarantee: prices and the amount due are computed by the server from the order,
// never trusted from the client; the payment is authorised first and money is taken only once the
// workspace exists; creating the workspace and capturing the payment are one server-side operation keyed
// by the checkout session (an idempotency key), so a retry or a lost answer can neither create a second
// workspace nor charge twice; an authorisation whose workspace was refused is released by the server
// without the client having to ask; and the outcome is read from the server (a webhook from the provider,
// then a status endpoint), never inferred by the browser.
import type { BillingPeriod, Money, OrderQuote, OrderRequest, PaymentConfirmation, PromoCode, ScheduledCharge, WorkspaceBilling, WorkspacePlan } from '../capabilities';
import { ApiError } from '../errors';
import type { Delay } from './timing';

const CURRENCY = 'NGN';
const naira = (amount: number): Money => ({ amount: amount * 100, currency: CURRENCY });
const SEAT: Record<BillingPeriod, number> = { monthly: 5000, yearly: 4200 };
const DOMAIN_YEARLY: Record<string, number> = { '.com': 18_500, '.ng': 9_000, '.africa': 22_000 };
const LAUNCH: PromoCode = { code: 'LAUNCH', percent: 20, months: 3 };
const DECLINED_CARD = '4000000000000002';
const WRONG_CODE = '000000';
const EXPIRED_CODE = '999999';
const MAX_WRONG_CODES = 5;

const plan: WorkspacePlan = {
  id: 'business',
  name: 'Yahel Business',
  features: ['Mail on your own domain', '30 GB storage per person', 'Calendar, Drive, Docs and Meet', 'Meetings for up to 100 people', 'Passkeys and an audit log', 'Data kept in Africa'],
  seatPrice: { monthly: naira(SEAT.monthly), yearly: naira(SEAT.yearly) },
  yearlySaving: 16,
  trial: { days: 14, maxSeats: 10 },
  taxRate: 7.5,
  enterpriseFrom: 300,
};

const promoFor = (code: string | null) => (code?.trim().toUpperCase() === LAUNCH.code ? LAUNCH : null);

const dayAfter = (now: number, change: { days?: number; months?: number; years?: number }) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + (change.days ?? 0));
  date.setUTCMonth(date.getUTCMonth() + (change.months ?? 0));
  date.setUTCFullYear(date.getUTCFullYear() + (change.years ?? 0));
  return date.toISOString().slice(0, 10);
};

const charge = (from: string | null, kind: ScheduledCharge['kind'], amount: number, more: Partial<ScheduledCharge> = {}): ScheduledCharge => ({ from, kind, amount: naira(amount), per: null, discount: null, billedYearly: null, ...more });

/** The prototype's sums: a trial for small teams, the first period today for larger ones, and a promo that shortens the first three months. */
export function quoteFor(order: OrderRequest, now: number): OrderQuote {
  const seats = Math.max(1, Math.floor(order.seats));
  const yearly = order.period === 'yearly';
  const seat = SEAT[order.period];
  const promo = promoFor(order.promoCode);
  const reduced = promo ? Math.round(seat * (1 - promo.percent / 100)) : seat;
  const trial = seats <= plan.trial.maxSeats;
  const planToday = yearly ? seat * 12 * seats : reduced * seats;
  const regular = charge(null, 'plan', seat * seats, { per: 'month', billedYearly: yearly ? naira(seat * 12 * seats) : null });
  const trialEnd = dayAfter(now, { days: plan.trial.days });

  const schedule: ScheduledCharge[] = trial
    ? [
        charge(null, 'trial', 0),
        ...(promo
          ? [charge(trialEnd, 'discount', reduced * seats, { per: 'month', discount: { percent: promo.percent, months: promo.months } }), { ...regular, from: dayAfter(now, { days: plan.trial.days, months: promo.months }) }]
          : [{ ...regular, from: trialEnd }]),
      ]
    : yearly
      ? [charge(null, 'first-period', planToday, { per: 'year' }), charge(dayAfter(now, { years: 1 }), 'renewal', planToday, { per: 'year' })]
      : promo
        ? [
            charge(null, 'first-period', planToday, { per: 'month', discount: { percent: promo.percent, months: 1 } }),
            charge(dayAfter(now, { months: 1 }), 'discount', reduced * seats, { per: 'month', discount: { percent: promo.percent, months: promo.months - 1 } }),
            { ...regular, from: dayAfter(now, { months: promo.months }) },
          ]
        : [charge(null, 'first-period', planToday, { per: 'month' }), { ...regular, from: dayAfter(now, { months: 1 }) }];

  const domainYearly = order.domain ? (DOMAIN_YEARLY[order.domain.slice(order.domain.lastIndexOf('.'))] ?? 0) : 0;
  return {
    period: order.period,
    seats,
    trial,
    promo,
    planToday: naira(planToday),
    schedule,
    domain: order.domain ? { name: order.domain, yearly: naira(domainYearly) } : null,
    dueToday: naira((trial ? 0 : planToday) + domainYearly),
    taxRate: plan.taxRate,
  };
}

// A bank says where it sent its code in its own masked form. The stand-in makes one from the business phone.
const maskedPhone = (phone: string | undefined) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 7 ? `••• ••• ••${digits.slice(-2)}` : null;
};

const unknownPayment = () => new ApiError({ status: 404, code: 'NOT_FOUND', message: 'No such payment' });

export const createWorkspaceBillingStandIn = (delay: Delay, now: () => number = Date.now): WorkspaceBilling => {
  // What a provider would hold. No card detail is kept: only how many codes have been refused, and what became of the payment.
  const payments = new Map<string, { wrongCodes: number; state: 'code-needed' | 'authorised' | 'completed' | 'released' }>();
  let issued = 0;
  const payment = (id: string) => {
    const found = payments.get(id);
    if (!found) throw unknownPayment();
    return found;
  };

  return {
    async plan() {
      await delay(250);
      return plan;
    },
    async promo(code) {
      await delay(400);
      return promoFor(code);
    },
    async quote(order) {
      await delay(200);
      return quoteFor(order, now());
    },
    async pay(_order, card, contact) {
      await delay(1400);
      if (card.number.replace(/\D/g, '') === DECLINED_CARD) return { status: 'declined' };
      issued += 1;
      const paymentId = `pay_demo_${issued}`;
      payments.set(paymentId, { wrongCodes: 0, state: 'code-needed' });
      return { status: 'code-needed', paymentId, sentTo: maskedPhone(contact.address?.phone) };
    },
    async resendCode(paymentId) {
      await delay(400);
      payment(paymentId).wrongCodes = 0;
    },
    async confirm(paymentId, code): Promise<PaymentConfirmation> {
      await delay(600);
      const held = payment(paymentId);
      if (held.state !== 'code-needed') return held.state === 'released' ? 'spent' : 'authorised';
      if (held.wrongCodes >= MAX_WRONG_CODES) return 'spent';
      if (code === EXPIRED_CODE) return 'expired-code';
      if (code === WRONG_CODE || !/^\d{6}$/.test(code)) {
        held.wrongCodes += 1;
        return held.wrongCodes >= MAX_WRONG_CODES ? 'spent' : 'wrong-code';
      }
      held.state = 'authorised';
      return 'authorised';
    },
    async complete(paymentId) {
      await delay(300);
      const held = payment(paymentId);
      if (held.state === 'authorised' || held.state === 'completed') held.state = 'completed';
      else throw new ApiError({ status: 409, code: 'CONFLICT', message: 'This payment was not authorised' });
    },
    async release(paymentId) {
      await delay(200);
      const held = payments.get(paymentId);
      if (held && held.state !== 'completed') held.state = 'released';
    },
  };
};
