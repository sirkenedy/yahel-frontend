import type { AccountCapabilities } from '@yahel/api-client';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { hasAccountUnderway, resumeStep } from './machine';
import type { PersonalFacts, PersonalStep } from './machine';
import type { PersonalStore } from './store';

export interface PersonalGuardContext {
  session: Session;
  capabilities: AccountCapabilities;
  registrar: PasskeyRegistrar | null;
  personal: PersonalStore;
}

/** What the step guards need to know about this browser and this build. */
export const personalFacts = ({ capabilities, registrar }: Pick<PersonalGuardContext, 'capabilities' | 'registrar'>): PersonalFacts => ({
  passkeysOffered: registrar?.isSupported() ?? false,
  contactOffered: capabilities.trustedContacts !== null,
});

/**
 * Someone already signed in who did not just create the account here has nothing to do in this flow:
 * they belong on the signed-in screen of sign-in.
 */
export const isSignedInElsewhere = ({ session, personal }: Pick<PersonalGuardContext, 'session' | 'personal'>) => session.store.getState().status === 'signed-in' && !personal.getState().creation.signedIn;

/** The step to show instead of `step`, or `null` when `step` itself can be shown. */
export const stepInsteadOf = (step: PersonalStep, store: PersonalStore, facts: PersonalFacts) => {
  const honest = resumeStep(step, store.getState(), facts);
  return honest === step ? null : honest;
};

/**
 * Forgets every answer, the password and the passkey with them. Called when the flow is left, started
 * again, or stopped by a screen that failed. `unlessUnderway` spares a visit whose account exists or may:
 * its answers are final, and what remains needs them to finish.
 */
export const forgetSignUp = (store: PersonalStore, { unlessUnderway = false } = {}) => {
  if (unlessUnderway && hasAccountUnderway(store.getState())) return;
  store.dispatch({ type: 'reset' });
};

/** Reaching the review ends any change that was being made from it, however it was reached. */
export const arriveAtReview = (store: PersonalStore) => {
  if (store.getState().editing) store.dispatch({ type: 'edit-finished' });
};
