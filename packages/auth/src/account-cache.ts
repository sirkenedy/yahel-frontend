import type { QueryClient } from '@tanstack/react-query';

/** The accounts this browser remembers belong to the browser, not to any one account, so the key carries no account. */
export const ACCOUNTS_KEY = ['accounts', 'on-this-device'] as const;

const loadedFor = new WeakMap<QueryClient, string>();

/** The list changed: read it again wherever it is shown. A read already under way is the one that answers; it is not cancelled and restarted. */
export const refreshAccounts = (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }, { cancelRefetch: false });

/**
 * The tab's account certainly changed (signed in, signed out, or another tab took its slot): nothing one
 * account's requests left in the cache may be seen by another (rulebook 2.7), and the list is read again.
 * Only for a change that happened; a route guard or an effect uses `keepAccountDataFor`.
 */
export const forgetAccountData = (queryClient: QueryClient) => {
  loadedFor.delete(queryClient);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ACCOUNTS_KEY[0] });
  void refreshAccounts(queryClient);
};

/**
 * The cache serves `handle` from now on. What it holds is dropped only when it was loaded for another
 * account, so a guard that runs more than once per change, or the tab's own first switch, cancels nothing.
 * Resolves true when it dropped something.
 */
export const keepAccountDataFor = (queryClient: QueryClient, handle: string | null) => {
  if (!handle) return false;
  const before = loadedFor.get(queryClient);
  if (before !== undefined && before !== handle) forgetAccountData(queryClient);
  loadedFor.set(queryClient, handle);
  return before !== undefined && before !== handle;
};
