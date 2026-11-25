import type { QueryClient } from '@tanstack/react-query';
import type { AccountCapabilities, ClientAccount } from '@yahel/api-client';
import type { Session, SessionState } from '@yahel/auth';
import { accountsQuery, isSignedInAs } from '../../flow/accounts';
import type { AppConfig } from '../../config';
import { adminAddressOf, hasWorkspaceUnderway, resumeStep } from './machine';
import type { BusinessFacts, BusinessStep } from './machine';
import type { BusinessStore } from './store';

export interface BusinessGuardContext {
  session: Session;
  queryClient: QueryClient;
  capabilities: AccountCapabilities;
  business: BusinessStore;
}

/**
 * What the step guards need to know: which parts of the designed flow this build can answer, and whether this tab is
 * signed in. Once the workspace exists, only as its administrator counts (F-109): a personal account in this tab is not it.
 */
export const businessFacts = ({ capabilities, session, business }: Pick<BusinessGuardContext, 'capabilities' | 'session' | 'business'>): BusinessFacts => ({
  // A domain bought here is paid for at checkout, so it is offered only where there is one.
  domainsForSale: capabilities.domainMarket !== null && capabilities.workspaceBilling !== null,
  billing: capabilities.workspaceBilling !== null,
  signedIn: isSignedInAs(session.store.getState(), business.getState().creation.created ? adminAddressOf(business.getState()) : null),
});

/** Whether this build offers workspace sign-up at all (F-78). Where it does not, the flow's addresses lead to the personal sign-up. */
export const isOffered = ({ config }: { config: Pick<AppConfig, 'businessSignUp'> }) => config.businessSignUp;

/**
 * What a workspace's sign-up may take from the account this tab is using: only a personal account's name and
 * address, and only when this browser's list says it is personal. A business account, nobody, or a list that
 * cannot be read gives nothing. Never the date of birth or a phone.
 */
export const prefillOf = ({ profile, handle }: Pick<SessionState, 'profile' | 'handle'>, accounts: readonly ClientAccount[] | null) => {
  const current = handle ? accounts?.find((account) => account.handle === handle) : undefined;
  if (!profile || !current || current.kind !== 'personal') return null;
  return { firstName: profile.firstName?.trim() ?? '', lastName: profile.lastName?.trim() ?? '', contactEmail: current.email, from: current.email };
};

/** Fills the empty name and address fields from the personal account in use, the first time the flow is entered. */
export const prefillFromAccount = async ({ session, queryClient, capabilities, business }: BusinessGuardContext) => {
  if (business.getState().prefilledFrom !== null || session.store.getState().status !== 'signed-in') return;
  const accounts = await queryClient.ensureQueryData(accountsQuery(capabilities.directory)).catch(() => null);
  const prefill = prefillOf(session.store.getState(), accounts);
  if (prefill) business.dispatch({ type: 'prefilled', ...prefill });
};

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

/**
 * What a created workspace hands to the administrator's first steps: the address to set up, the business's name,
 * the phone check registration answered with, the business phone to start from (given for a bought domain), and
 * whether the plan and checkout follow. Never the password.
 */
export const handoverOf = (store: BusinessStore, billing: boolean) => {
  const state = store.getState();
  if (!state.creation.finished) return null;
  const phone = state.domainSource === 'bought' && state.address?.phone ? { country: state.address.phoneCountry, number: state.address.phone } : null;
  return { email: adminAddressOf(state), organisation: state.businessName, challengeToken: state.challengeToken, phone, continueToPlan: billing && !state.creation.settled };
};
