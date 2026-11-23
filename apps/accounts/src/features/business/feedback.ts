import { commonRows, describeFailure } from '../../flow/feedback';
import type { Feedback, FeedbackMap } from '../../flow/feedback';
import type { Rejection } from './machine';
import { businessMessages as m } from './messages';

/** What was being attempted, because the same answer means different things at different steps. */
export type FailureContext = 'create' | 'other';
export type BusinessField = 'domain' | 'username' | 'year' | 'code' | 'promo';
/** What the flow can offer after a failure. `retry` is the frame's own. */
export type BusinessNext = 'retry' | 'resend' | 'answers' | 'sign-in' | 'reset-password' | 'support';
export type BusinessFeedback = Feedback<BusinessField, BusinessNext>;
type Rows = FeedbackMap<BusinessField, BusinessNext>;

/** Why something was refused by a part of the flow that has no server code for it yet: the checkout and promo stand-ins answer in outcomes. */
export type RefusalReason = 'card-declined' | 'wrong-code' | 'expired-code' | 'code-spent' | 'promo-invalid';

/** A refusal with a reason and nothing else: it never carries what was typed. */
export class Refused extends Error {
  constructor(readonly reason: RefusalReason) {
    super(reason);
    this.name = 'Refused';
  }
}

const refused: Record<RefusalReason, BusinessFeedback> = {
  'card-declined': { place: 'banner', tone: 'danger', title: m.cardDeclinedTitle, text: m.cardDeclined },
  'wrong-code': { place: 'field', field: 'code', text: m.bankCodeWrong },
  'expired-code': { place: 'field', field: 'code', text: m.bankCodeExpired },
  'code-spent': { place: 'banner', tone: 'danger', title: m.bankCodeDeadTitle, text: m.bankCodeDead, next: 'resend' },
  'promo-invalid': { place: 'field', field: 'promo', text: m.promoInvalid },
};

const detailsRefused = { place: 'banner', tone: 'danger', title: m.detailsRefusedTitle, text: m.detailsRefused, next: 'answers' } as const;

/**
 * The workspace flow's rows of the feedback map. The answers that send the person back to a step (a
 * claimed or public domain, a taken address, an age the country does not allow) are handled by the flow
 * and told on that step (`refusals`), not here.
 */
const rows: Record<FailureContext, Rows> = {
  create: { ...commonRows, VALIDATION_ERROR: detailsRefused, REFUSED: detailsRefused, ALREADY_IN_ORG_CONTEXT: { place: 'banner', tone: 'warning', title: m.alreadyRunTitle, text: m.alreadyRun, next: 'sign-in' } },
  other: commonRows,
};

/** Describes a failure of workspace sign-up for the person, from the row of the feedback map that fits what was being attempted. */
export const describeBusinessFailure = (error: unknown, context: FailureContext): BusinessFeedback => (error instanceof Refused ? refused[error.reason] : describeFailure(error, rows[context]));

/** What a step tells when an answer given on it was refused, beside the field that holds the answer. */
export const refusals = {
  claimed: { place: 'field', field: 'domain', text: m.domainClaimed },
  public: { place: 'field', field: 'domain', text: m.domainPublic },
  taken: { place: 'field', field: 'username', text: m.usernameTaken },
  underage: { place: 'field', field: 'year', text: m.tooYoungForWorkspace },
} as const satisfies Record<string, BusinessFeedback>;

const told = new WeakMap<Rejection, BusinessFeedback>();

/**
 * What a step tells about its own rejected answer, or `null` when the rejection is another step's. Each
 * rejection gets one object of its own, so a field can tell a new refusal from one it has already shown
 * even when the words are the same.
 */
export function refusalFor(rejection: Rejection | null, step: Rejection['step']): BusinessFeedback | null {
  if (!rejection || rejection.step !== step) return null;
  const known = told.get(rejection) ?? { ...refusals[rejection.reason] };
  told.set(rejection, known);
  return known;
}

/** Shown above the domain field with `refusals.claimed`: what someone whose domain is already claimed can do. */
export const domainClaimedBanner = { place: 'banner', tone: 'danger', title: m.domainClaimedTitle, text: m.domainClaimedText, next: 'reset-password', also: 'support' } as const satisfies BusinessFeedback;
