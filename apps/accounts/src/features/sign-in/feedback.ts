import { isApiError } from '@yahel/api-client';
import { commonRows, describeFailure } from '../../flow/feedback';
import type { Feedback, FeedbackMap } from '../../flow/feedback';
import { signInMessages as m } from './messages';

/** What was being attempted, because the same answer means different things at different steps. */
export type FailureContext = 'password' | 'passkey' | 'code' | 'reset' | 'other';
export type SignInField = 'password' | 'code';
/** What sign-in can offer after a failure. `retry` is the frame's own. */
export type SignInNext = 'retry' | 'reset-password' | 'sign-in-again' | 'resend' | 'support';
export type SignInFeedback = Feedback<SignInField, SignInNext>;
type Rows = FeedbackMap<SignInField, SignInNext>;

// A wrong password reads exactly like an unknown address, so the answer never says whether an account exists.
const wrongCredentials = { place: 'field', field: 'password', text: m.wrongCredentials } as const;
const wrongCode = { place: 'field', field: 'code', text: m.wrongCode } as const;
const passkeyFailed = { place: 'banner', tone: 'danger', text: m.passkeyFailed } as const;
const refusedPassword = { place: 'field', field: 'password', text: m.passwordRefused } as const;

// What the server says only once the password has matched: none of it reveals more than signing in would.
const afterPassword = {
  TOO_MANY_REQUESTS: { place: 'screen', screen: 'locked' },
  // A bare 403 is also an inactive membership, so it says only what is known: this account cannot sign in now.
  FORBIDDEN: { place: 'banner', tone: 'danger', title: m.cannotSignInTitle, text: m.cannotSignIn, next: 'support' },
  EMAIL_NOT_VERIFIED: { place: 'banner', tone: 'info', title: m.confirmEmailTitle, text: m.emailNotConfirmed },
  SSO_REQUIRED: { place: 'banner', tone: 'info', title: m.singleSignOnTitle, text: m.singleSignOnRequired },
  FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED: { place: 'banner', tone: 'warning', title: m.newPasswordNeededTitle, text: m.newPasswordNeeded, next: 'reset-password' },
} as const satisfies Partial<Rows>;

const rows: Record<FailureContext, Rows> = {
  password: { ...commonRows, ...afterPassword, INVALID_CREDENTIALS: wrongCredentials, REFUSED: wrongCredentials },
  passkey: { ...commonRows, ...afterPassword, INVALID_CREDENTIALS: passkeyFailed, REFUSED: passkeyFailed, CLIENT_FAULT: passkeyFailed },
  code: {
    ...commonRows,
    MFA_INVALID: wrongCode,
    INVALID_MFA_CODE: wrongCode,
    INVALID_TOKEN: wrongCode,
    REFUSED: wrongCode,
    MFA_MAX_ATTEMPTS: { place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyCodes, next: 'sign-in-again' },
    TOKEN_MAX_ATTEMPTS: { place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyCodes, next: 'sign-in-again' },
  },
  reset: { ...commonRows, VALIDATION_ERROR: refusedPassword, REFUSED: refusedPassword },
  other: commonRows,
};

/** Describes a failure of sign-in for the person, from the row of the feedback map that fits what was being attempted. */
export const describeSignInFailure = (error: unknown, context: FailureContext): SignInFeedback => describeFailure(error, rows[context]);

/** A reset that failed because of the code, not the password: the person has to go back one step. `spent` when no further try will work. */
export const rejectedResetCode = (error: unknown): 'wrong' | 'spent' | null => (!isApiError(error) ? null : error.code === 'TOKEN_MAX_ATTEMPTS' ? 'spent' : error.code === 'INVALID_TOKEN' ? 'wrong' : null);

/** What a step tells that came from another step: the reason the person was sent back to it. */
export const carried = {
  'challenge-expired': { place: 'banner', tone: 'warning', title: m.challengeExpiredTitle, text: m.challengeExpired },
  'reset-done': { place: 'banner', tone: 'warning', title: m.resetDoneTitle, text: m.resetDoneSignInFailed },
  wrong: { place: 'field', field: 'code', text: m.recoverCodeRejected },
  spent: { place: 'banner', tone: 'danger', title: m.codeDeadTitle, text: m.tooManyResetCodes, next: 'resend' },
} as const satisfies Record<string, SignInFeedback>;
