export const adminSteps = ['signin', 'confirm-email', 'phone', 'code', 'welcome', 'add-passkey', 'passkey'] as const;
export type AdminStep = (typeof adminSteps)[number];

/** What workspace sign-up hands over when its Ready screen leads here: the address to sign in with, and the business's name. */
export interface Handover {
  email: string;
  organisation: string;
}

/**
 * Everything an administrator's first sign-in remembers between steps, in memory only: a reload clears it,
 * and nothing here is ever in the address bar or web storage. One secret outlives a step: `provenPassword`,
 * the password sign-in has just matched for an address still to be confirmed. It is held only while the
 * confirm step is on screen (decisions F-50, F-68) and never handed to a step. Codes are never here.
 */
export interface AdminState {
  /** The address being signed in to: handed over by workspace sign-up, or typed. */
  email: string | null;
  /** The address came from workspace sign-up, so it is shown, not asked for. */
  handedOver: boolean;
  /** The business's name as workspace sign-up knew it, for the welcome. */
  organisation: string | null;
  provenPassword: string | null;
  /** Why the person is back at the sign-in step, when it was not their own doing. */
  signInPrompt: 'email-confirmed' | 'second-step' | null;
  /** The number a code was texted to, until it is confirmed. */
  phone: { country: string; number: string } | null;
  phoneVerified: boolean;
  /** "I understand" was pressed on the welcome. */
  welcomed: boolean;
  /** The person asked for the passkey prompt in this visit. */
  passkeyStarted: boolean;
  passkeySaved: boolean;
}

export const initialAdminState: AdminState = {
  email: null,
  handedOver: false,
  organisation: null,
  provenPassword: null,
  signInPrompt: null,
  phone: null,
  phoneVerified: false,
  welcomed: false,
  passkeyStarted: false,
  passkeySaved: false,
};

export type AdminEvent =
  | { type: 'handed-over'; handover: Handover }
  | { type: 'email-entered'; email: string }
  | { type: 'email-unconfirmed'; password: string }
  | { type: 'email-confirmed' }
  | { type: 'proof-dropped' }
  | { type: 'second-step-required' }
  | { type: 'signed-in' }
  | { type: 'phone-code-sent'; country: string; number: string }
  | { type: 'phone-verified' }
  | { type: 'welcomed' }
  | { type: 'passkey-started' }
  | { type: 'passkey-saved' }
  | { type: 'reset' };

export function reduce(state: AdminState, event: AdminEvent): AdminState {
  switch (event.type) {
    case 'handed-over':
      return { ...initialAdminState, email: event.handover.email, organisation: event.handover.organisation, handedOver: true };
    case 'email-entered':
      return state.handedOver || state.email === event.email ? state : { ...initialAdminState, email: event.email };
    case 'email-unconfirmed':
      return { ...state, provenPassword: event.password, signInPrompt: null };
    case 'email-confirmed':
      // Final, whatever happens to the sign-in that follows: if that fails, the sign-in step says the email is confirmed.
      return { ...state, provenPassword: null, signInPrompt: 'email-confirmed' };
    case 'proof-dropped':
      return state.provenPassword === null ? state : { ...state, provenPassword: null };
    case 'second-step-required':
      return { ...state, provenPassword: null, signInPrompt: 'second-step' };
    case 'signed-in':
      return { ...state, provenPassword: null, signInPrompt: null };
    case 'phone-code-sent':
      return { ...state, phone: { country: event.country, number: event.number } };
    case 'phone-verified':
      return { ...state, phone: null, phoneVerified: true };
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
  /** A confirmed recovery phone is on the account. */
  phoneVerified: boolean;
  hasPasskey: boolean;
}

const phoneDone = (state: AdminState, facts: AdminFacts) => state.phoneVerified || facts.phoneVerified;
export const hasPasskey = (state: AdminState, facts: AdminFacts) => state.passkeySaved || facts.hasPasskey;

/** The first step a signed-in administrator still has to do. Admin itself is never a step: it opens only from the passkey step, once a passkey exists. */
const firstUndone = (state: AdminState, facts: AdminFacts): AdminStep => (!phoneDone(state, facts) ? 'phone' : !state.welcomed ? 'welcome' : 'add-passkey');

/**
 * The step that can honestly be shown when `step` is asked for: `step` itself if what it depends on is
 * present, otherwise the nearest step that is. Steps before signing in need no session and steps after
 * need one, so a reload, a pasted address or the Forward button always lands somewhere that works, and
 * no step can be reached around the one before it.
 */
export function resumeStep(step: AdminStep, state: AdminState, facts: AdminFacts): AdminStep {
  if (!facts.signedIn) return step === 'confirm-email' && state.email && state.provenPassword ? 'confirm-email' : 'signin';
  const first = firstUndone(state, facts);
  switch (step) {
    case 'signin':
    case 'confirm-email':
      return first;
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
    case 'confirm-email':
      return 'signin';
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
