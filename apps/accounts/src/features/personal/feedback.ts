import { commonRows, describeFailure, hasCode, isRefusal } from '../../flow/feedback';
import type { Feedback, FeedbackMap } from '../../flow/feedback';
import { personalMessages as m } from './messages';

/** What was being attempted, because the same answer means different things at different steps. */
export type FailureContext = 'create' | 'code' | 'passkey' | 'other';
export type PersonalField = 'code' | 'year' | 'email';
/** What the personal flow can offer after a failure. `retry` is the frame's own. */
export type PersonalNext = 'retry' | 'review' | 'resend';
export type PersonalFeedback = Feedback<PersonalField, PersonalNext>;
type Rows = FeedbackMap<PersonalField, PersonalNext>;

const wrongCode = { place: 'field', field: 'code', text: m.wrongCode } as const;
const detailsRefused = { place: 'banner', tone: 'danger', title: m.detailsRefusedTitle, text: m.detailsRefused, next: 'review' } as const;
const passkeyFailed = { place: 'banner', tone: 'warning', text: m.passkeyFailed } as const;
const phoneRefused = { place: 'banner', tone: 'warning', text: m.phoneRefused } as const;

/**
 * The personal flow's rows of the feedback map. None says whether an address has an account: the answers
 * that could (a taken Yahel address, an existing email) are handled by the flow, which sends the person
 * to a step instead of showing a failure.
 */
const rows: Record<FailureContext, Rows> = {
  create: { ...commonRows, VALIDATION_ERROR: detailsRefused, REFUSED: detailsRefused },
  code: {
    ...commonRows,
    INVALID_TOKEN: wrongCode,
    REFUSED: wrongCode,
    FORBIDDEN: wrongCode,
    TOKEN_MAX_ATTEMPTS: { place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyCodes, next: 'resend' },
  },
  passkey: { ...commonRows, CLIENT_FAULT: passkeyFailed },
  other: { ...commonRows, PHONE_ALREADY_IN_USE: phoneRefused },
};

/** Describes a failure of personal sign-up for the person, from the row of the feedback map that fits what was being attempted. */
export const describePersonalFailure = (error: unknown, context: FailureContext): PersonalFeedback => describeFailure(error, rows[context]);

/** What a step tells when the server refused an answer given on it, beside the field that holds the answer. */
export const refusals = {
  underage: { place: 'field', field: 'year', text: m.tooYoungForAccount },
  'not-personal': { place: 'field', field: 'email', text: m.ownEmailNotPersonal },
} as const satisfies Record<string, PersonalFeedback>;

export { hasCode, isRefusal };
