import type { RecoveryMethod } from '@yahel/api-client';

export const signInSteps = ['choose', 'email', 'password', 'passkey', 'code', 'confirm-email', 'recover', 'recover-code', 'new-password', 'help', 'help-sent', 'done'] as const;
export type SignInStep = (typeof signInSteps)[number];

/**
 * Everything the flow remembers between steps. It lives in memory only: a reload clears it, and nothing
 * here is ever written to the address bar or to web storage. Passwords and second-step codes go from the
 * field that collected them straight into the request, and the request keeps no copy (see
 * `flow/use-flow-request.ts`). Three short-lived secrets must outlive a step, and each is dropped the
 * moment it has been used: the challenge token, the reset code, and `provenPassword` (below).
 */
export interface SignInState {
  email: string | null;
  /** The email came from the account chooser, so Back from the password returns there. */
  fromChooser: boolean;
  /** Proof that the password was right, needed to submit the second-step code. */
  challengeToken: string | null;
  /** The person asked for the passkey prompt in this page session. */
  passkeyStarted: boolean;
  /** Where the reset code was sent. */
  recovery: { method: RecoveryMethod; destination: string } | null;
  /** The reset code, held until the new password is chosen: the backend checks both together. */
  resetCode: string | null;
  resetCodeRejected: boolean;
  /** The rejected code can never work again: only a new one will do. */
  resetCodeSpent: boolean;
  helpRequested: boolean;
  /**
   * The password this visit proved (sign-in answered that it matches and that the address is still to be
   * confirmed). It is what allows an emailed code to be submitted at all, and what finishes signing in once
   * the code is accepted. Held only while the confirm step is on screen; never handed to a step.
   */
  provenPassword: string | null;
  /** Why the person has been brought back to the password step, when it was not their own doing. */
  passwordPrompt: 'challenge-expired' | 'reset-done' | 'email-confirmed' | null;
  /** The chooser is in "Remove an account" mode. */
  removing: boolean;
}

export const initialSignInState: SignInState = {
  email: null,
  fromChooser: false,
  challengeToken: null,
  passkeyStarted: false,
  recovery: null,
  resetCode: null,
  resetCodeRejected: false,
  resetCodeSpent: false,
  helpRequested: false,
  provenPassword: null,
  passwordPrompt: null,
  removing: false,
};

export type SignInEvent =
  | { type: 'account-chosen'; email: string }
  | { type: 'email-entered'; email: string }
  | { type: 'another-account-wanted' }
  | { type: 'second-step-required'; challengeToken: string }
  | { type: 'challenge-expired' }
  | { type: 'email-unconfirmed'; password: string }
  | { type: 'email-confirmed' }
  | { type: 'proof-dropped' }
  | { type: 'passkey-started' }
  | { type: 'password-reset' }
  | { type: 'reset-code-sent'; method: RecoveryMethod; destination: string }
  | { type: 'reset-code-entered'; code: string }
  | { type: 'reset-code-rejected'; spent?: boolean }
  | { type: 'help-requested' }
  | { type: 'signed-in' }
  | { type: 'signed-out' }
  | { type: 'removing'; on: boolean };

export function reduce(state: SignInState, event: SignInEvent): SignInState {
  switch (event.type) {
    case 'account-chosen':
      return { ...initialSignInState, email: event.email, fromChooser: true };
    case 'email-entered':
      return { ...initialSignInState, email: event.email };
    case 'another-account-wanted':
    case 'signed-out':
      return initialSignInState;
    case 'second-step-required':
      return { ...state, challengeToken: event.challengeToken, passwordPrompt: null };
    case 'challenge-expired':
      return { ...state, challengeToken: null, passwordPrompt: 'challenge-expired' };
    case 'email-unconfirmed':
      return { ...state, provenPassword: event.password, passwordPrompt: null };
    case 'email-confirmed':
      // Final, whatever happens to the sign-in that follows: if that fails, the password step says the email is confirmed.
      return { ...state, provenPassword: null, passwordPrompt: 'email-confirmed' };
    case 'proof-dropped':
      return state.provenPassword === null ? state : { ...state, provenPassword: null };
    case 'password-reset':
      // The code is spent and the reset cannot be repeated: only signing in remains.
      return { ...state, recovery: null, resetCode: null, resetCodeRejected: false, resetCodeSpent: false, provenPassword: null, passwordPrompt: 'reset-done' };
    case 'passkey-started':
      return { ...state, passkeyStarted: true };
    case 'reset-code-sent':
      return { ...state, recovery: { method: event.method, destination: event.destination }, resetCode: null, resetCodeRejected: false, resetCodeSpent: false };
    case 'reset-code-entered':
      return { ...state, resetCode: event.code, resetCodeRejected: false, resetCodeSpent: false };
    case 'reset-code-rejected':
      return { ...state, resetCode: null, resetCodeRejected: true, resetCodeSpent: event.spent ?? false };
    case 'help-requested':
      return { ...state, helpRequested: true };
    case 'signed-in':
      // Keep only who signed in; every credential-like value is dropped the moment it has been used.
      return { ...initialSignInState, email: state.email };
    case 'removing':
      return { ...state, removing: event.on };
  }
}

/** What is true outside the flow's own state when a step is about to be shown. */
export interface SignInFacts {
  signedIn: boolean;
  /** How many accounts this browser remembers; `null` when the list could not be read, so the chooser says so. */
  knownAccounts: number | null;
  passkeysOffered: boolean;
  helpOffered: boolean;
}

const entryStep = (facts: SignInFacts): SignInStep => (facts.knownAccounts === 0 ? 'email' : 'choose');

/**
 * The step that can honestly be shown when `step` is asked for: `step` itself if everything it depends
 * on is present, otherwise the nearest earlier step. This is what makes a reload, a pasted address or
 * the Forward button land somewhere that works.
 */
export function resumeStep(step: SignInStep, state: SignInState, facts: SignInFacts): SignInStep {
  const entry = entryStep(facts);
  // Being signed in opens Done, and closes nothing: another account can always be added (multi-account, F-89).
  switch (step) {
    case 'done':
      return facts.signedIn ? 'done' : entry;
    case 'choose':
      return entry;
    case 'email':
      return 'email';
    case 'password':
    case 'recover':
      return state.email ? step : entry;
    case 'passkey':
      return facts.passkeysOffered && state.passkeyStarted ? 'passkey' : entry;
    case 'code':
      return state.email && state.challengeToken ? 'code' : resumeStep('password', state, facts);
    case 'confirm-email':
      // Only while the password proven in this visit is held: without it no code may be submitted (decisions F-50).
      return state.email && state.provenPassword ? 'confirm-email' : resumeStep('password', state, facts);
    case 'recover-code':
      return state.email && state.recovery ? 'recover-code' : resumeStep('recover', state, facts);
    case 'new-password':
      return state.email && state.recovery && state.resetCode ? 'new-password' : resumeStep('recover-code', state, facts);
    case 'help':
      return facts.helpOffered ? 'help' : entry;
    case 'help-sent':
      return state.helpRequested ? 'help-sent' : resumeStep('help', state, facts);
  }
}

/** Where the step's Back link leads, or `null` when there is nowhere earlier to go. */
export function backOf(step: SignInStep, state: SignInState, facts: SignInFacts): SignInStep | null {
  switch (step) {
    case 'choose':
    case 'done':
    case 'help-sent':
      return null;
    case 'email':
      return facts.knownAccounts === 0 ? null : 'choose';
    case 'password':
    case 'passkey':
      return state.fromChooser ? 'choose' : 'email';
    case 'code':
    case 'confirm-email':
    case 'recover':
      return 'password';
    case 'recover-code':
      return 'recover';
    case 'new-password':
      return 'recover-code';
    case 'help':
      return state.email ? 'recover' : 'email';
  }
}

export const stepPath = <Step extends SignInStep>(step: Step) => `/signin/${step}` as const;

export const stepOfPath = (pathname: string): SignInStep | null => signInSteps.find((step) => pathname.replace(/\/$/, '') === stepPath(step)) ?? null;

/** Whether moving between two steps goes deeper into the flow or back out of it, for the transition. */
export const directionOf = (from: SignInStep, to: SignInStep) => (signInSteps.indexOf(to) < signInSteps.indexOf(from) ? 'back' : 'forward');
