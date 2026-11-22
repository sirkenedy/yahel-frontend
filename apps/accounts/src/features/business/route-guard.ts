import type { AccountCapabilities } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { hasWorkspaceUnderway, resumeStep } from './machine';
import type { BusinessFacts, BusinessStep } from './machine';
import type { BusinessStore } from './store';

export interface BusinessGuardContext {
  session: Session;
  capabilities: AccountCapabilities;
  business: BusinessStore;
}

/** What the step guards need to know about this build: which parts of the designed flow something can answer. */
export const businessFacts = ({ capabilities }: Pick<BusinessGuardContext, 'capabilities'>): BusinessFacts => ({
  // A domain bought here is paid for at checkout, so it is offered only where there is one.
  domainsForSale: capabilities.domainMarket !== null && capabilities.workspaceBilling !== null,
  billing: capabilities.workspaceBilling !== null,
});

/** Someone already signed in has nothing to do in this flow, which creates a workspace for someone who has no account. */
export const isSignedIn = ({ session }: Pick<BusinessGuardContext, 'session'>) => session.store.getState().status === 'signed-in';

/** The step to show instead of `step`, or `null` when `step` itself can be shown. */
export const stepInsteadOf = (step: BusinessStep, store: BusinessStore, facts: BusinessFacts) => {
  const honest = resumeStep(step, store.getState(), facts);
  return honest === step ? null : honest;
};

/**
 * Forgets every answer, the password with them. Called when the flow is left, started again, or stopped by
 * a screen that failed. `unlessUnderway` spares a visit whose workspace exists: what remains needs its answers.
 */
export const forgetWorkspace = (store: BusinessStore, { unlessUnderway = false } = {}) => {
  if (unlessUnderway && hasWorkspaceUnderway(store.getState())) return;
  store.dispatch({ type: 'reset' });
};

/** Reaching checkout ends any change that was being made from it, however it was reached. */
export const arriveAtCheckout = (store: BusinessStore) => {
  if (store.getState().editing) store.dispatch({ type: 'edit-finished' });
};
