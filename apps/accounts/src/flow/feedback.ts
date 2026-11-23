import { isApiError } from '@yahel/api-client';
import type { FlowTone } from '@yahel/ui';
import { flowMessages as m } from './messages';

/** The whole-screen states. Several share one drawn screen: the two links and the two sessions are "Expired". */
export type ScreenKind = 'locked' | 'suspended' | 'org-paused' | 'link-expired' | 'link-used' | 'session-ended' | 'signed-out-everywhere' | 'maintenance';

/**
 * A failure, described for the person: which state shows it, where, in which words, and what they can do
 * next. `field` sits beside the field it names, `banner` above the form, `screen` takes the step's place.
 */
export type Feedback<Field extends string = string, Next extends string = string> =
  | { place: 'field'; field: Field; text: string; next?: Next }
  | { place: 'banner'; tone: FlowTone; title?: string; text: string; next?: Next; /** A second thing the person can do, after `next`. */ also?: Next; reference?: string; retryAt?: number }
  | { place: 'screen'; screen: ScreenKind; reference?: string; retryAt?: number };

/** One row of the map: a feedback before the facts of a particular failure are added. */
export type FeedbackRow<Field extends string = string, Next extends string = string> = Feedback<Field, Next>;

/**
 * A server answer, by the name the feedback map knows it by: the backend's code where the map names one,
 * otherwise what the status or the connection says. `REFUSED` is a 400, 401 or 404 with no code of its own.
 */
export type Answer = (typeof named)[number] | 'OFFLINE' | 'UNREACHABLE' | 'REFUSED' | 'FORBIDDEN' | 'CLIENT_FAULT' | 'UNKNOWN';

const named = [
  'INTERNAL_ERROR', 'SERVICE_UNAVAILABLE', 'TOO_MANY_REQUESTS',
  'INVALID_CREDENTIALS', 'EMAIL_NOT_VERIFIED', 'MFA_INVALID', 'INVALID_MFA_CODE', 'MFA_MAX_ATTEMPTS', 'TOKEN_MAX_ATTEMPTS', 'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED', 'SSO_REQUIRED', 'ACCOUNT_SUSPENDED', 'TENANT_SUSPENDED',
  'SESSION_EXPIRED', 'INVALID_TOKEN', 'TOKEN_REUSE_DETECTED',
  'VALIDATION_ERROR', 'DUPLICATE_RECORD', 'EMAIL_ALREADY_EXISTS', 'PERSONAL_SIGNUP_REQUIRES_PUBLIC_EMAIL', 'USER_UNDERAGE', 'PHONE_ALREADY_IN_USE',
  'PUBLIC_EMAIL_NOT_ALLOWED', 'DOMAIN_CONFLICT', 'DOMAIN_ALREADY_CLAIMED', 'ALREADY_IN_ORG_CONTEXT', 'INVITE_EXPIRED', 'INVITE_ALREADY_USED', 'INVITE_ALREADY_ACCEPTED',
] as const; // prettier-ignore

const isNamed = (code: string): code is (typeof named)[number] => (named as readonly string[]).includes(code);

/** Names a failure. The browser's own word on the connection separates the person being offline from the service not answering. */
export function answerOf(error: unknown, online: boolean = navigator.onLine): Answer {
  if (!isApiError(error)) return 'CLIENT_FAULT';
  if (error.isNetwork) return online ? 'UNREACHABLE' : 'OFFLINE';
  if (isNamed(error.code)) return error.code;
  // The backend's rate limiter answers 429 under a general code, so the status names it.
  if (error.status === 429) return 'TOO_MANY_REQUESTS';
  if (error.status === 503) return 'SERVICE_UNAVAILABLE';
  if (error.status >= 500) return 'INTERNAL_ERROR';
  if (error.status === 403) return 'FORBIDDEN';
  if (error.status === 422) return 'VALIDATION_ERROR';
  return error.status === 400 || error.status === 401 || error.status === 404 ? 'REFUSED' : 'UNKNOWN';
}

export type FeedbackMap<Field extends string = string, Next extends string = string> = Partial<Record<Answer, FeedbackRow<Field, Next>>> & { UNKNOWN: FeedbackRow<Field, Next> };

const serverError = { place: 'banner', tone: 'danger', title: m.serverErrorTitle, text: m.serverErrorText, next: 'retry' } as const;

/**
 * The rows that read the same in every flow: the connection, the server, the session and a spent link.
 * An account's or an organisation's standing is not here: it is told only where a password has been proven (sign-in's rows).
 */
export const commonRows = {
  OFFLINE: { place: 'banner', tone: 'offline', title: m.offlineTitle, text: m.offlineText, next: 'retry' },
  // A request that got no answer is told on the step, where what was typed still is; only a declared outage takes the step's place.
  UNREACHABLE: { place: 'banner', tone: 'offline', title: m.unreachableTitle, text: m.unreachableText, next: 'retry' },
  SERVICE_UNAVAILABLE: { place: 'screen', screen: 'maintenance' },
  TOO_MANY_REQUESTS: { place: 'banner', tone: 'warning', title: m.tooManyTitle, text: m.tooManyText },
  INTERNAL_ERROR: serverError,
  CLIENT_FAULT: serverError,
  UNKNOWN: serverError,
  SESSION_EXPIRED: { place: 'screen', screen: 'session-ended' },
  TOKEN_REUSE_DETECTED: { place: 'screen', screen: 'signed-out-everywhere' },
  INVITE_EXPIRED: { place: 'screen', screen: 'link-expired' },
  INVITE_ALREADY_USED: { place: 'screen', screen: 'link-used' },
  INVITE_ALREADY_ACCEPTED: { place: 'screen', screen: 'link-used' },
} as const satisfies FeedbackMap<never, 'retry'>;

// A reference is shown to the person, so it is only ever an id: letters, digits and dashes of a sane length.
const referenceOf = (error: unknown) => (isApiError(error) && error.requestId && error.requestId !== 'unknown' && /^[\w-]{3,64}$/.test(error.requestId) ? error.requestId : undefined);

/**
 * The one mapping from a failure to what the person sees. Nothing the server wrote is passed on: the
 * words are the row's, and only an id to quote and how long to wait are taken from the answer.
 */
export function describeFailure<Field extends string, Next extends string>(error: unknown, rows: FeedbackMap<Field, Next>, now: number = Date.now()): Feedback<Field, Next> {
  const row = rows[answerOf(error)] ?? rows.UNKNOWN;
  if (row.place === 'field') return { ...row };
  const retryAfter = isApiError(error) ? error.retryAfter : undefined;
  const retryAt = retryAfter ? now + retryAfter * 1000 : undefined;
  const reference = row.place === 'screen' || row.tone === 'danger' ? referenceOf(error) : undefined;
  return { ...row, ...(retryAt ? { retryAt } : {}), ...(reference ? { reference } : {}) };
}

/** The feedback, when it belongs beside the named field. */
export const forField = <Field extends string, Next extends string>(feedback: Feedback<Field, Next> | null | undefined, field: Field) => (feedback?.place === 'field' && feedback.field === field ? feedback : null);

/** Whether a failure is the server answering with one of these codes. */
export const hasCode = (error: unknown, ...codes: string[]) => isApiError(error) && codes.includes(error.code);

/** A refusal the server will repeat however often it is asked, as opposed to a connection that dropped or a server that fell over. */
export const isRefusal = (error: unknown) => isApiError(error) && error.status >= 400 && error.status < 500 && error.status !== 429 && error.code !== 'SESSION_EXPIRED' && error.code !== 'TOKEN_REUSE_DETECTED';

