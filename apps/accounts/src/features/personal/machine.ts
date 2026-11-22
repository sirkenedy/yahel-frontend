import type { PasskeyAttestation } from '@yahel/api-client';

export const personalSteps = ['type', 'name', 'birth', 'address', 'own-email', 'password', 'add-passkey', 'passkey', 'recovery', 'review', 'creating', 'own-code', 'code', 'ready', 'contact'] as const;
export type PersonalStep = (typeof personalSteps)[number];

export type Gender = 'unspecified' | 'woman' | 'man' | 'another';

export interface BirthDate {
  day: number;
  /** 1 for January. */
  month: number;
  year: number;
}

/** The parts of an account that are set up after it exists. Each is settled once: saved, or given up on. */
export type SetupPart = 'recoveryEmail' | 'preferences' | 'passkey' | 'phone';

/** An answer the server refused, and the step that has to be answered again. */
export type Rejection = { step: 'address'; reason: 'taken' } | { step: 'birth'; reason: 'underage' } | { step: 'own-email'; reason: 'not-personal' };

/**
 * How far creating the account has got. Every part is recorded as it happens, so a second attempt (after
 * a failure, or a second press) picks up where the first stopped and nothing is ever asked of the server twice.
 */
export interface Creation {
  /** "Agree and create account" has been pressed. */
  started: boolean;
  /** What is happening now, for the creating screen. */
  stage: 'account' | 'signing-in' | 'finishing';
  /** The account exists and is this person's. */
  created: boolean;
  /** The server said the address already has an account; whose it is is not yet known. */
  conflicted: boolean;
  /** An existing email has to be confirmed with a code before the account can be signed in to. */
  emailCode: 'not-needed' | 'awaited' | 'confirmed';
  signedIn: boolean;
  /** What has been settled, and of that, what could not be saved (the person is told on the last screen). */
  settled: readonly SetupPart[];
  unsaved: readonly SetupPart[];
  /** A code has been texted to the recovery phone and not yet entered or skipped. */
  phoneCodeAwaited: boolean;
  finished: boolean;
}

/**
 * Everything the flow remembers between steps. It lives in memory only: a reload clears it, and nothing
 * here is ever written to the address bar or to web storage. The password is the one secret that has to be
 * kept across steps, because the account is not created until the last of them; it is dropped the moment
 * the new account has been signed in to. Codes are never here: they go from the field straight into the
 * request, which keeps no copy (see `flow/use-flow-request.ts`). The passkey held here is its public half.
 */
export interface PersonalState {
  firstName: string;
  lastName: string;
  birth: BirthDate | null;
  gender: Gender;
  /** A new Yahel address, or an email the person already has. */
  addressKind: 'yahel' | 'own';
  /** The part before the @ of the Yahel address. */
  username: string;
  ownEmail: string;
  password: string | null;
  passkey: PasskeyAttestation | null;
  /** The person asked for the passkey prompt in this page session. */
  passkeyStarted: boolean;
  recovery: { country: string; phone: string; email: string };
  /** The recovery step was answered or skipped, so the review can be shown. */
  recoveryAnswered: boolean;
  preferences: { productNews: boolean; activityHistory: boolean };
  /** The person came back from the review to change one answer, and returns there afterwards. */
  editing: boolean;
  rejection: Rejection | null;
  creation: Creation;
  /** The trusted contact an invitation was sent to. */
  contactInvited: string | null;
}

const initialCreation: Creation = { started: false, stage: 'account', created: false, conflicted: false, emailCode: 'not-needed', signedIn: false, settled: [], unsaved: [], phoneCodeAwaited: false, finished: false };

export const DEFAULT_PHONE_COUNTRY = 'NG';

export const initialPersonalState: PersonalState = {
  firstName: '',
  lastName: '',
  birth: null,
  gender: 'unspecified',
  addressKind: 'yahel',
  username: '',
  ownEmail: '',
  password: null,
  passkey: null,
  passkeyStarted: false,
  recovery: { country: DEFAULT_PHONE_COUNTRY, phone: '', email: '' },
  recoveryAnswered: false,
  preferences: { productNews: false, activityHistory: false },
  editing: false,
  rejection: null,
  creation: initialCreation,
  contactInvited: null,
};

export type PersonalEvent =
  | { type: 'name-entered'; firstName: string; lastName: string }
  | { type: 'birth-entered'; birth: BirthDate; gender: Gender }
  | { type: 'address-chosen'; username: string }
  | { type: 'own-email-chosen'; email: string }
  | { type: 'address-kind-chosen'; kind: PersonalState['addressKind'] }
  | { type: 'password-chosen'; password: string }
  | { type: 'passkey-started' }
  | { type: 'passkey-created'; attestation: PasskeyAttestation }
  | { type: 'recovery-entered'; country: string; phone: string; email: string }
  | { type: 'recovery-skipped' }
  | { type: 'preferences-changed'; preferences: PersonalState['preferences'] }
  | { type: 'edit-started' }
  | { type: 'edit-finished' }
  | { type: 'creation-started' }
  | { type: 'creation-stage'; stage: Creation['stage'] }
  | { type: 'account-created' }
  | { type: 'account-conflicted' }
  | { type: 'email-code-needed' }
  | { type: 'email-confirmed' }
  | { type: 'signed-in' }
  | { type: 'setup-settled'; part: SetupPart; saved: boolean }
  | { type: 'phone-code-sent' }
  | { type: 'creation-finished' }
  | { type: 'answer-rejected'; rejection: Rejection }
  | { type: 'contact-invited'; email: string };

const clearRejection = (state: PersonalState, step: Rejection['step']) => (state.rejection?.step === step ? null : state.rejection);
const inCreation = (state: PersonalState, change: Partial<Creation>): PersonalState => ({ ...state, creation: { ...state.creation, ...change } });

export function reduce(state: PersonalState, event: PersonalEvent): PersonalState {
  switch (event.type) {
    case 'name-entered':
      return { ...state, firstName: event.firstName, lastName: event.lastName };
    case 'birth-entered':
      return { ...state, birth: event.birth, gender: event.gender, rejection: clearRejection(state, 'birth') };
    case 'address-chosen':
      return { ...state, addressKind: 'yahel', username: event.username, rejection: clearRejection(state, 'address') };
    case 'own-email-chosen':
      return { ...state, addressKind: 'own', ownEmail: event.email, rejection: clearRejection(state, 'own-email') };
    case 'address-kind-chosen':
      return { ...state, addressKind: event.kind };
    case 'password-chosen':
      return { ...state, password: event.password };
    case 'passkey-started':
      return { ...state, passkeyStarted: true };
    case 'passkey-created':
      return { ...state, passkey: event.attestation };
    case 'recovery-entered':
      return { ...state, recovery: { country: event.country, phone: event.phone, email: event.email }, recoveryAnswered: true };
    case 'recovery-skipped':
      return { ...state, recovery: { ...state.recovery, phone: '', email: '' }, recoveryAnswered: true };
    case 'preferences-changed':
      return { ...state, preferences: event.preferences };
    case 'edit-started':
      return { ...state, editing: true };
    case 'edit-finished':
      return { ...state, editing: false };
    case 'creation-started':
      return inCreation(state, { started: true });
    case 'creation-stage':
      return inCreation(state, { stage: event.stage });
    case 'account-created':
      return inCreation(state, { created: true, conflicted: false });
    case 'account-conflicted':
      return inCreation(state, { conflicted: true });
    case 'email-code-needed':
      return inCreation(state, { emailCode: 'awaited' });
    case 'email-confirmed':
      return inCreation(state, { emailCode: 'confirmed' });
    case 'signed-in':
      // Signing in proves the account is this person's, and is the last thing the password is needed for.
      return { ...inCreation(state, { created: true, conflicted: false, signedIn: true }), password: null };
    case 'setup-settled':
      return inCreation(state, {
        settled: [...state.creation.settled, event.part],
        unsaved: event.saved ? state.creation.unsaved : [...state.creation.unsaved, event.part],
        phoneCodeAwaited: event.part === 'phone' ? false : state.creation.phoneCodeAwaited,
      });
    case 'phone-code-sent':
      return inCreation(state, { phoneCodeAwaited: true });
    case 'creation-finished':
      return inCreation(state, { finished: true });
    case 'answer-rejected':
      // The account was not created, so the attempt is over. Everything else is answered: once this is put right, back to the review.
      return { ...state, rejection: event.rejection, editing: true, creation: initialCreation };
    case 'contact-invited':
      return { ...state, contactInvited: event.email };
  }
}

/** The address the person will sign in with. */
export const addressOf = (state: PersonalState, mailDomain: string) => (state.addressKind === 'own' ? state.ownEmail : `${state.username}@${mailDomain}`);

/** What is true outside the flow's own state when a step is about to be shown. */
export interface PersonalFacts {
  passkeysOffered: boolean;
  contactOffered: boolean;
}

const hasAddress = (state: PersonalState) => (state.addressKind === 'own' ? state.ownEmail !== '' : state.username !== '');

/** Once the account exists (or may), the answers are final: only what comes after can be shown. */
const stepAfterCreation = ({ creation }: PersonalState): PersonalStep | null => {
  if (creation.emailCode === 'awaited') return 'own-code';
  if (!creation.created) return null;
  if (!creation.signedIn) return 'creating';
  if (creation.phoneCodeAwaited) return 'code';
  return creation.finished ? 'ready' : 'creating';
};

/**
 * The step that can honestly be shown when `step` is asked for: `step` itself if everything it depends
 * on is present, otherwise the nearest earlier step. This is what makes a reload, a pasted address or
 * the Forward button land somewhere that works.
 */
export function resumeStep(step: PersonalStep, state: PersonalState, facts: PersonalFacts): PersonalStep {
  const after = stepAfterCreation(state);
  if (after) return step === 'contact' && after === 'ready' && facts.contactOffered ? 'contact' : after;
  switch (step) {
    case 'type':
    case 'name':
      return step;
    case 'birth':
      return state.firstName ? 'birth' : 'name';
    case 'address':
    case 'own-email':
      return state.birth ? step : resumeStep('birth', state, facts);
    case 'password':
      return hasAddress(state) ? 'password' : resumeStep(state.addressKind === 'own' ? 'own-email' : 'address', state, facts);
    case 'add-passkey':
      if (!state.password) return resumeStep('password', state, facts);
      return facts.passkeysOffered ? 'add-passkey' : 'recovery';
    case 'passkey':
      return state.password && state.passkeyStarted && facts.passkeysOffered ? 'passkey' : resumeStep('add-passkey', state, facts);
    case 'recovery':
      return state.password ? 'recovery' : resumeStep('password', state, facts);
    case 'review':
      return state.password && state.recoveryAnswered ? 'review' : resumeStep('recovery', state, facts);
    case 'creating':
      return state.creation.started ? 'creating' : resumeStep('review', state, facts);
    case 'own-code':
    case 'code':
    case 'ready':
    case 'contact':
      return resumeStep('creating', state, facts);
  }
}

const editable: readonly PersonalStep[] = ['name', 'birth', 'address', 'own-email', 'password', 'recovery'];

/** Where the step's Back link leads, or `null` when there is nowhere earlier to go. */
export function backOf(step: PersonalStep, state: PersonalState, facts: PersonalFacts): PersonalStep | null {
  if (state.editing && editable.includes(step)) return 'review';
  switch (step) {
    case 'type':
    case 'creating':
    case 'own-code':
    case 'code':
    case 'ready':
      return null;
    case 'name':
      return 'type';
    case 'birth':
      return 'name';
    case 'address':
      return 'birth';
    case 'own-email':
      return 'address';
    case 'password':
      return state.addressKind === 'own' ? 'own-email' : 'address';
    case 'add-passkey':
      return 'password';
    case 'passkey':
      return 'add-passkey';
    case 'recovery':
      return facts.passkeysOffered ? 'add-passkey' : 'password';
    case 'review':
      return 'recovery';
    case 'contact':
      return 'ready';
  }
}

/** The step that follows `step` once it has been answered. An answer changed from the review returns there. */
export function nextOf(step: 'type' | 'name' | 'birth' | 'address' | 'own-email' | 'password' | 'add-passkey' | 'passkey' | 'recovery', state: PersonalState, facts: PersonalFacts): PersonalStep {
  const onward = (next: PersonalStep) => (state.editing ? 'review' : next);
  switch (step) {
    case 'type':
      return 'name';
    case 'name':
      return onward('birth');
    case 'birth':
      return onward('address');
    case 'address':
    case 'own-email':
      return onward('password');
    case 'password':
      // A passkey made earlier in this visit is kept; it is not offered twice.
      return facts.passkeysOffered && !state.passkey ? 'add-passkey' : onward('recovery');
    case 'add-passkey':
    case 'passkey':
      return onward('recovery');
    case 'recovery':
      return 'review';
  }
}

export const PROGRESS_TOTAL = 6;

/** How far along the six questions a step is, and which of them it belongs to. Steps outside the count have none. */
export function progressOf(step: PersonalStep): { current: number; part: 'name' | 'basics' | 'address' | 'password' | 'sign-in' | 'recovery' | 'review' } | null {
  switch (step) {
    case 'name':
      return { current: 1, part: 'name' };
    case 'birth':
      return { current: 2, part: 'basics' };
    case 'address':
    case 'own-email':
      return { current: 3, part: 'address' };
    case 'password':
    case 'add-passkey':
      return { current: 4, part: 'password' };
    case 'passkey':
      return { current: 4, part: 'sign-in' };
    case 'recovery':
      return { current: 5, part: 'recovery' };
    case 'review':
      return { current: 6, part: 'review' };
    default:
      return null;
  }
}

export const stepPath = <Step extends PersonalStep>(step: Step) => `/personal/${step}` as const;

export const stepOfPath = (pathname: string): PersonalStep | null => personalSteps.find((step) => pathname.replace(/\/$/, '') === stepPath(step)) ?? null;

/** Whether moving between two steps goes deeper into the flow or back out of it, for the transition. */
export const directionOf = (from: PersonalStep, to: PersonalStep) => (personalSteps.indexOf(to) < personalSteps.indexOf(from) ? 'back' : 'forward');
