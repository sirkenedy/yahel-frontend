import { queryOptions } from '@tanstack/react-query';
import type { AccountDirectory, AccountStanding, ClientAccount } from '@yahel/api-client';
import { ACCOUNTS_KEY } from '@yahel/auth';
import type { SessionState } from '@yahel/auth';
import type { AccountKind } from '@yahel/ui';

export const accountsQuery = (directory: AccountDirectory) =>
  queryOptions({
    queryKey: ACCOUNTS_KEY,
    queryFn: ({ signal }) => directory.list(signal),
    staleTime: Infinity,
    retry: false,
    // A list that could not be read stays unread until the person asks again: the chooser says so and offers to.
    retryOnMount: false,
  });

/**
 * Whether this tab is signed in as `email`: a flow setting up one account counts nobody else's session as its own
 * (F-109). With no address to set up, any session counts.
 */
export const isSignedInAs = ({ status, profile }: Pick<SessionState, 'status' | 'profile'>, email: string | null) =>
  status === 'signed-in' && profile !== null && (email === null || profile.email.toLowerCase() === email.toLowerCase());

export const nameOf = (account: Pick<ClientAccount, 'displayName' | 'email'>) => account.displayName?.trim() || account.email;

export const kindOf = (account: Pick<ClientAccount, 'kind'>): AccountKind => (account.kind === 'business' ? 'organisation' : 'person');

/** Under an account's address: its organisation, else "Work account" or "Personal" by kind, while signed in; "Signed out" when not. */
export const statusOf = (account: Pick<ClientAccount, 'signedIn' | 'organisation' | 'kind'>, words: { personal: string; work: string; signedOut: string }) => {
  if (!account.signedIn) return words.signedOut;
  return account.organisation ?? (account.kind === 'business' ? words.work : words.personal);
};

/** The face for an account whose standing is known: an organisation square for any work account. */
export const kindOfStanding = (standing: AccountStanding | null): AccountKind => (standing && standing.type !== 'personal' ? 'organisation' : 'person');

/** The line under the account in use: "Admin · {organisation}", the organisation, "Work account" or "Personal account". */
export const badgeOf = (standing: AccountStanding, words: { personalAccount: string; workAccount: string; admin: (organisation: string) => string }) => {
  if (standing.type === 'admin') return words.admin(standing.organisation);
  if (standing.type === 'member') return standing.organisation;
  return standing.type === 'work' ? words.workAccount : words.personalAccount;
};

/** The first account other than `handle` that is still signed in. */
export const nextSignedIn = (accounts: readonly ClientAccount[], handle: string | null) => accounts.find((account) => account.signedIn && account.handle !== handle) ?? null;
