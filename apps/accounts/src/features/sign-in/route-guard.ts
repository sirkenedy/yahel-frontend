import type { QueryClient } from '@tanstack/react-query';
import type { AccountCapabilities } from '@yahel/api-client';
import type { PasskeyClient, Session } from '@yahel/auth';
import { resumeStep } from './machine';
import type { SignInFacts, SignInStep } from './machine';
import { knownAccountsQuery } from './queries';
import type { SignInStore } from './store';

export interface SignInGuardContext {
  session: Session;
  queryClient: QueryClient;
  capabilities: AccountCapabilities;
  passkeys: PasskeyClient | null;
  signIn: SignInStore;
}

/** Gathers what the step guards need to know. The lookup is cached, so later steps do not wait. */
export async function loadSignInFacts({ session, queryClient, capabilities, passkeys }: SignInGuardContext): Promise<SignInFacts> {
  const accounts = await queryClient.ensureQueryData(knownAccountsQuery(capabilities.directory));
  return { signedIn: session.store.getState().status === 'signed-in', knownAccounts: accounts.length, passkeysOffered: passkeys?.isSupported() ?? false, helpOffered: capabilities.helpDesk !== null };
}

/** The step to show instead of `step`, or `null` when `step` itself can be shown. */
export const stepInsteadOf = (step: SignInStep, store: SignInStore, facts: SignInFacts) => {
  const honest = resumeStep(step, store.getState(), facts);
  return honest === step ? null : honest;
};

/** Forgets the password held for the confirm step. Called when that step is left, however it is left. */
export const dropProof = (store: SignInStore) => store.dispatch({ type: 'proof-dropped' });
