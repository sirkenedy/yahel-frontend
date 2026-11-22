import { afterPasswordRows, commonRows, describeFailure, sentCodeRows } from '../../flow/feedback';
import type { Feedback, FeedbackMap } from '../../flow/feedback';
import { flowMessages as shared } from '../../flow/messages';
import { adminMessages as m } from './messages';

/** What was being attempted, because the same answer means different things at different steps. */
export type FailureContext = 'password' | 'code' | 'phone' | 'passkey' | 'other';
export type AdminField = 'password' | 'code' | 'phone';
/** What the admin flow can offer after a failure. `retry` is the frame's own. */
export type AdminNext = 'retry' | 'reset-password' | 'resend' | 'sign-in' | 'support';
export type AdminFeedback = Feedback<AdminField, AdminNext>;
type Rows = FeedbackMap<AdminField, AdminNext>;

// A wrong password reads exactly like an unknown address, so the answer never says whether an account exists.
const wrongCredentials = { place: 'field', field: 'password', text: shared.wrongCredentials } as const;
const phoneRefused = { place: 'field', field: 'phone', text: m.phoneRefused } as const;
const passkeyFailed = { place: 'banner', tone: 'warning', text: m.passkeyFailed, next: 'retry' } as const;

/**
 * The admin flow's rows of the feedback map. What sign-in says once a password has matched is said here
 * the same way; none of the rows says whether an address has an account. The emailed code and the texted
 * one are refused alike: a wrong code and an expired one are the same answer from the backend.
 */
const rows: Record<FailureContext, Rows> = {
  password: { ...commonRows, ...afterPasswordRows, INVALID_CREDENTIALS: wrongCredentials, REFUSED: wrongCredentials },
  code: { ...commonRows, ...sentCodeRows },
  phone: { ...commonRows, PHONE_ALREADY_IN_USE: phoneRefused, REFUSED: phoneRefused, VALIDATION_ERROR: phoneRefused },
  passkey: { ...commonRows, CLIENT_FAULT: passkeyFailed, REFUSED: passkeyFailed, INVALID_TOKEN: passkeyFailed },
  other: commonRows,
};

/** Describes a failure of the admin flow for the person, from the row of the feedback map that fits what was being attempted. */
export const describeAdminFailure = (error: unknown, context: FailureContext): AdminFeedback => describeFailure(error, rows[context]);

/** What the sign-in step tells when the person was brought back to it. */
export const carried = {
  'email-confirmed': { place: 'banner', tone: 'success', title: shared.emailConfirmedTitle, text: shared.emailConfirmedSignIn },
  'second-step': { place: 'banner', tone: 'info', title: m.secondStepTitle, text: m.secondStep, next: 'sign-in' },
} as const satisfies Record<string, AdminFeedback>;
