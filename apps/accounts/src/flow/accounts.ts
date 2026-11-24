import { queryOptions } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { AccountDirectory, ClientAccount } from '@yahel/api-client';
import type { AccountKind } from '@yahel/ui';

// The accounts this browser remembers belong to the browser, not to any one account, so the key carries
// no account. Everything an account's own requests put in the cache is cleared when the tab's account changes.
const ACCOUNTS_KEY = ['accounts', 'on-this-device'] as const;

export const accountsQuery = (directory: AccountDirectory) =>
  queryOptions({
    queryKey: ACCOUNTS_KEY,
    queryFn: ({ signal }) => directory.list(signal),
    staleTime: Infinity,
    retry: false,
    // A list that could not be read stays unread until the person asks again: the chooser says so and offers to.
    retryOnMount: false,
  });

/** The list changed: read it again wherever it is shown. */
export const refreshAccounts = (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });

/** The tab's account changed: nothing one account's requests left in the cache may be seen by another (rulebook 2.7). */
export const forgetAccountData = (queryClient: QueryClient) => {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ACCOUNTS_KEY[0] });
  void refreshAccounts(queryClient);
};

export const nameOf = (account: Pick<ClientAccount, 'displayName' | 'email'>) => account.displayName?.trim() || account.email;

export const kindOf = (account: Pick<ClientAccount, 'kind'>): AccountKind => (account.kind === 'business' ? 'organisation' : 'person');

/** Under an account's address: its organisation or "Personal" while signed in, "Signed out" when not. */
export const statusOf = (account: Pick<ClientAccount, 'signedIn' | 'organisation'>, words: { personal: string; signedOut: string }) => (account.signedIn ? (account.organisation ?? words.personal) : words.signedOut);

/** The first account other than `handle` that is still signed in. */
export const nextSignedIn = (accounts: readonly ClientAccount[], handle: string | null) => accounts.find((account) => account.signedIn && account.handle !== handle) ?? null;
