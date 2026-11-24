import type { QueryClient } from '@tanstack/react-query';
import type { AccountCapabilities } from '@yahel/api-client';
import type { PasskeyClient, Session } from '@yahel/auth';
import { resumeStep } from './machine';
import type { SignInFacts, SignInStep } from './machine';
import { accountsQuery } from '../../flow/accounts';
import type { SignInStore } from './store';

export interface SignInGuardContext {
  session: Session;
  queryClient: QueryClient;
  capabilities: AccountCapabilities;
  passkeys: PasskeyClient | null;
  signIn: SignInStore;
}

/** A handle names an account in this browser only, so only its shape is checked; anything else is ignored, never shown. */
const HANDLE = /^[A-Za-z0-9_-]{8,64}$/;

/** Who an app may ask for. Anything else is ignored, never shown. */
const PURPOSES = ['admin'] as const;
export type SignInPurpose = (typeof PURPOSES)[number];

export interface SignInSearch {
  /** One of this browser's accounts, by its handle, for which the app asks the password step. */
  account?: string;
  /** `admin`: Admin sent the person here, and only an administrator account may go back to it. */
  for?: SignInPurpose;
}

const purposeOf = (value: unknown) => PURPOSES.find((purpose) => purpose === value);

export const validateSignInSearch = (search: Record<string, unknown>): SignInSearch => {
  const account = typeof search.account === 'string' && HANDLE.test(search.account) ? search.account : undefined;
  const purpose = purposeOf(search.for);
  return { ...(account ? { account } : {}), ...(purpose ? { for: purpose } : {}) };
};

/**
 * Prepares the password step for the account a handle names, when it is one this browser remembers and it is
 * signed out. The address comes from the browser's own list, never from the link. Resolves whether it did.
 */
export const chooseByHandle = ({ queryClient, capabilities, signIn }: Pick<SignInGuardContext, 'queryClient' | 'capabilities' | 'signIn'>, handle: string | undefined) => {
  if (!handle) return false;
  const account = queryClient.getQueryData(accountsQuery(capabilities.directory).queryKey)?.find((known) => known.handle === handle);
  if (!account || account.signedIn) return false;
  signIn.dispatch({ type: 'account-chosen', email: account.email });
  return true;
};

/** Gathers what the step guards need to know. The lookup is cached, so later steps do not wait. A list that cannot be read is the chooser's to explain. */
export async function loadSignInFacts({ session, queryClient, capabilities, passkeys }: SignInGuardContext): Promise<SignInFacts> {
  const accounts = await queryClient.ensureQueryData(accountsQuery(capabilities.directory)).catch(() => null);
  return { signedIn: session.store.getState().status === 'signed-in', knownAccounts: accounts ? accounts.length : null, passkeysOffered: passkeys?.isSupported() ?? false, helpOffered: capabilities.helpDesk !== null };
}

/** The step to show instead of `step`, or `null` when `step` itself can be shown. */
export const stepInsteadOf = (step: SignInStep, store: SignInStore, facts: SignInFacts) => {
  const honest = resumeStep(step, store.getState(), facts);
  return honest === step ? null : honest;
};

/** Forgets the password held for the confirm step. Called when that step is left, however it is left. */
export const dropProof = (store: SignInStore) => store.dispatch({ type: 'proof-dropped' });
