import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { currentAccountOf, standingOf } from '@yahel/api-client';
import type { AccountStanding, ClientAccount } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import type { AccountMenuProps } from '@yahel/ui';
import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { accountWords as w } from './messages';

/** The accounts this browser remembers. They belong to the browser, so the key carries no account. */
export const accountsQuery = (session: Pick<Session, 'accounts'>) => queryOptions({ queryKey: ['accounts', 'on-this-device'], queryFn: ({ signal }) => session.accounts(signal), staleTime: Infinity, retry: false });

const nameOf = (account: Pick<ClientAccount, 'displayName' | 'email'>) => account.displayName?.trim() || account.email;

/** "Admin · {organisation}", the organisation, "Work account", or `personal` for a personal account. */
export const labelOf = (standing: AccountStanding, personal: string) => {
  if (standing.type === 'admin') return w.admin(standing.organisation);
  if (standing.type === 'member') return standing.organisation;
  return standing.type === 'work' ? w.workAccount : personal;
};

/**
 * The browser's accounts, this tab's entry among them, and what kind of account it is: `null` until the
 * list has answered, so nothing is labelled wrongly. The list is read again when the tab's account changes.
 */
export function useCurrentAccount(session: Session) {
  const queryClient = useQueryClient();
  const { profile, slot, handle } = useStore(session.store);
  const signedIn = profile !== null && slot !== null;
  const list = useQuery({ ...accountsQuery(session), enabled: signedIn });
  const shownFor = useRef(handle);
  useEffect(() => {
    if (shownFor.current === handle) return;
    shownFor.current = handle;
    if (handle) void queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey }, { cancelRefetch: false });
  }, [handle, queryClient, session]);
  const accounts = list.data ?? [];
  const current = currentAccountOf(accounts, handle, slot);
  const standing = profile && !list.isPending ? standingOf(current, profile) : null;
  return { accounts, current, standing };
}

export interface ShellMenuRoutes {
  /** The app as the account in `slot`. */
  home: (slot: number) => void;
  /** The accounts app's sign-in, when no account is left to use. */
  signIn: () => void;
  /** The accounts app's email step, empty. */
  addAccount: () => void;
  /** The accounts app's password step for a signed-out account of this browser, named by its handle. */
  signInTo: (handle: string) => void;
  /** Admin as the account in `slot`, or `null` where there is no Admin to go to. */
  admin?: (slot: number) => string | null;
}

/** The account menu in the app's header, for the account in this tab; `null` when nobody is signed in. */
export function useAccountMenu(session: Session, go: ShellMenuRoutes): Omit<AccountMenuProps, 'labels'> | null {
  const queryClient = useQueryClient();
  const { profile, slot } = useStore(session.store);
  const { accounts, current, standing } = useCurrentAccount(session);
  const action = useMutation({ mutationFn: (run: () => Promise<void>) => run() });
  if (profile === null || slot === null) return null;

  const others = accounts.filter((account) => account !== current);
  const start = (run: () => Promise<void>) => {
    if (!action.isPending) action.mutate(run);
  };
  // What one account's requests cached is never shown to another (rulebook 2.7).
  const forget = () => {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'accounts' });
    void queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey }, { cancelRefetch: false });
  };

  return {
    current: { name: current ? nameOf(current) : profile.displayName?.trim() || profile.email, email: profile.email, kind: standing && standing.type !== 'personal' ? 'organisation' : 'person', initials: current?.initials, avatarUrl: current?.avatarUrl ?? profile.photo?.urls?.thumbnail ?? profile.photo?.url, badge: standing && labelOf(standing, w.personalAccount) },
    others: others.map((account) => ({ id: account.handle, name: nameOf(account), email: account.email, kind: account.kind === 'business' ? 'organisation' : 'person', initials: account.initials, avatarUrl: account.avatarUrl, signedIn: account.signedIn })),
    manageHref: `/u/${slot}/account`,
    // As in Google's account menu: an administrator of the workspace gets a way into Admin. Admin checks again.
    adminHref: standing?.type === 'admin' ? (go.admin?.(slot) ?? null) : null,
    isBusy: action.isPending,
    onSignOut: () =>
      start(async () => {
        await session.signOut(slot).catch(() => undefined);
        forget();
        const next = others.find((account) => account.signedIn);
        if (next) go.home(next.slot);
        else go.signIn();
      }),
    onPick: (id) => {
      const account = others.find((known) => known.handle === id);
      if (!account) return;
      if (account.signedIn) go.home(account.slot);
      else go.signInTo(account.handle);
    },
    onSignOutOf: (id) =>
      start(async () => {
        const account = others.find((known) => known.handle === id);
        if (!account) return;
        await session.signOut(account.slot).catch(() => undefined);
        await queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey }, { cancelRefetch: false });
      }),
    onAdd: go.addAccount,
    onSignOutAll: () =>
      start(async () => {
        await session.signOutAll().catch(() => undefined);
        forget();
        go.signIn();
      }),
  };
}
