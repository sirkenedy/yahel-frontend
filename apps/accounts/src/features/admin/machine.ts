export const adminSteps = ['phone', 'code', 'welcome', 'add-passkey', 'passkey'] as const;
export type AdminStep = (typeof adminSteps)[number];

export interface PhoneNumber {
  country: string;
  number: string;
}

/**
 * What workspace sign-up hands over from its Ready screen: the address it created, the business's name, the
 * phone challenge registration answered with (no session exists until it is met), a number to start from,
 * and whether the plan and checkout follow the welcome. Never the password.
 */
export interface Handover {
  email: string;
  organisation: string;
  challengeToken: string | null;
  phone: PhoneNumber | null;
  continueToPlan: boolean;
}

/**
 * Everything an administrator's first steps remember, in memory only: a reload clears it, and nothing here is
 * ever in the address bar or web storage. One short-lived secret is held: the phone challenge, until the texted
 * code meets it. Codes are never here.
 */
export interface AdminState {
  /** The address being set up: handed over by workspace sign-up, or the one sign-in was asked for. */
  email: string | null;
  /** The address came from workspace sign-up. */
  handedOver: boolean;
  /** The business's name as workspace sign-up knew it, for the welcome. */
  organisation: string | null;
  /** The phone challenge to meet before any session exists (registration, or a sign-in while the phone is unverified). */
  challengeToken: string | null;
  /** A number to start the phone step with: the business phone given for a bought domain. */
  suggestedPhone: PhoneNumber | null;
  /** The number a code was texted to, until it is confirmed. */
  phone: PhoneNumber | null;
  phoneVerified: boolean;
  /** "I understand" was pressed on the welcome. */
  welcomed: boolean;
  /** Workspace sign-up continues with the plan and checkout once the welcome is read. */
  continueToPlan: boolean;
  /** The person asked for the passkey prompt in this visit. */
  passkeyStarted: boolean;
  passkeySaved: boolean;
}

export const initialAdminState: AdminState = {
  email: null,
  handedOver: false,
  organisation: null,
  challengeToken: null,
  suggestedPhone: null,
  phone: null,
  phoneVerified: false,
  welcomed: false,
  continueToPlan: false,
  passkeyStarted: false,
  passkeySaved: false,
};

export type AdminEvent =
  | { type: 'handed-over'; handover: Handover }
  /** Sign-in answered with a phone challenge for this address instead of a session. */
  | { type: 'phone-required'; email: string; challengeToken: string }
  | { type: 'phone-code-sent'; country: string; number: string }
  | { type: 'phone-verified' }
  /** The challenge can no longer be met (expired, used, too many tries): only signing in again gives a new one. */
  | { type: 'challenge-lost' }
  | { type: 'welcomed' }
  | { type: 'passkey-started' }
  | { type: 'passkey-saved' }
  | { type: 'reset' };

export function reduce(state: AdminState, event: AdminEvent): AdminState {
  switch (event.type) {
    case 'handed-over': {
      const { email, organisation, challengeToken, phone, continueToPlan } = event.handover;
      return { ...initialAdminState, email, organisation, challengeToken, suggestedPhone: phone, continueToPlan, handedOver: true };
    }
    case 'phone-required':
      return { ...initialAdminState, email: event.email, challengeToken: event.challengeToken };
    case 'phone-code-sent':
      return { ...state, phone: { country: event.country, number: event.number } };
    case 'phone-verified':
      // The challenge is spent the moment it is met.
      return { ...state, phone: null, phoneVerified: true, challengeToken: null };
    case 'challenge-lost':
      return { ...state, challengeToken: null, phone: null };
    case 'welcomed':
      return { ...state, welcomed: true };
    case 'passkey-started':
      return { ...state, passkeyStarted: true };
    case 'passkey-saved':
      return { ...state, passkeySaved: true };
    case 'reset':
      return initialAdminState;
  }
}

/** What the server says about the person signed in, when someone is. */
export interface AdminFacts {
  signedIn: boolean;
  /** A confirmed phone is on the account. */
  phoneVerified: boolean;
  hasPasskey: boolean;
}

const phoneDone = (state: AdminState, facts: AdminFacts) => state.phoneVerified || facts.phoneVerified;
export const hasPasskey = (state: AdminState, facts: AdminFacts) => state.passkeySaved || facts.hasPasskey;

/** The first step a signed-in administrator still has to do. Admin itself is never a step: it opens from the passkey step. */
const firstUndone = (state: AdminState, facts: AdminFacts): AdminStep => (!phoneDone(state, facts) ? 'phone' : !state.welcomed ? 'welcome' : 'add-passkey');

/**
 * The step that can honestly be shown when `step` is asked for, or `sign-in` when nothing here can be: with no
 * session and no phone challenge to meet, the person signs in first. Before the session only the phone and its
 * code can be shown; after it, the steps the account still needs, so none can be reached around the one before.
 */
export function resumeStep(step: AdminStep, state: AdminState, facts: AdminFacts): AdminStep | 'sign-in' {
  if (!facts.signedIn) {
    if (!state.challengeToken) return 'sign-in';
    return step === 'code' && state.phone ? 'code' : 'phone';
  }
  const first = firstUndone(state, facts);
  switch (step) {
    case 'phone':
      return phoneDone(state, facts) ? first : 'phone';
    case 'code':
      return !phoneDone(state, facts) && state.phone ? 'code' : first;
    case 'welcome':
      return phoneDone(state, facts) ? 'welcome' : first;
    case 'add-passkey':
      return first;
    case 'passkey':
      return first === 'add-passkey' && state.passkeyStarted && !hasPasskey(state, facts) ? 'passkey' : first;
  }
}

/** Where the step's Back link leads, or `null` when there is nowhere earlier to go. */
export function backOf(step: AdminStep): AdminStep | null {
  switch (step) {
    case 'code':
      return 'phone';
    case 'passkey':
      return 'add-passkey';
    default:
      return null;
  }
}

export const stepPath = <Step extends AdminStep>(step: Step) => `/admin/${step}` as const;

export const stepOfPath = (pathname: string): AdminStep | null => adminSteps.find((step) => pathname.replace(/\/$/, '') === stepPath(step)) ?? null;

/** Whether moving between two steps goes deeper into the flow or back out of it, for the transition. */
export const directionOf = (from: AdminStep, to: AdminStep) => (adminSteps.indexOf(to) < adminSteps.indexOf(from) ? 'back' : 'forward');
