import { commonRows, describeFailure, sentCodeRows } from '../../flow/feedback';
import type { Feedback, FeedbackMap } from '../../flow/feedback';
import { adminMessages as m } from './messages';

/** What was being attempted, because the same answer means different things at different steps. */
export type FailureContext = 'code' | 'phone' | 'passkey' | 'other';
export type AdminField = 'code' | 'phone';
/** What the admin flow can offer after a failure. `retry` is the frame's own. */
export type AdminNext = 'retry' | 'reset-password' | 'resend' | 'sign-in' | 'support';
export type AdminFeedback = Feedback<AdminField, AdminNext>;
type Rows = FeedbackMap<AdminField, AdminNext>;

// A phone check that can no longer be met: only signing in again starts a new one.
const challengeLost = { place: 'banner', tone: 'warning', title: m.challengeLostTitle, text: m.challengeLost, next: 'sign-in' } as const;
const phoneRefused = { place: 'field', field: 'phone', text: m.phoneRefused } as const;
const passkeyFailed = { place: 'banner', tone: 'warning', text: m.passkeyFailed, next: 'retry' } as const;

/**
 * The admin flow's rows of the feedback map; none says whether an address has an account. A wrong texted code
 * and an expired one are the same answer from the backend. Too many wrong codes spend the phone check itself.
 */
const rows: Record<FailureContext, Rows> = {
  code: { ...commonRows, ...sentCodeRows, TOKEN_MAX_ATTEMPTS: challengeLost },
  phone: { ...commonRows, PHONE_ALREADY_IN_USE: phoneRefused, REFUSED: phoneRefused, VALIDATION_ERROR: phoneRefused, INVALID_TOKEN: challengeLost },
  passkey: { ...commonRows, CLIENT_FAULT: passkeyFailed, REFUSED: passkeyFailed, INVALID_TOKEN: passkeyFailed },
  other: commonRows,
};

/** Describes a failure of the admin flow for the person, from the row of the feedback map that fits what was being attempted. */
export const describeAdminFailure = (error: unknown, context: FailureContext): AdminFeedback => describeFailure(error, rows[context]);

