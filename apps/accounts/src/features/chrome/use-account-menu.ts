import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountDirectory, ClientAccount } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import type { AccountMenuProps } from '@yahel/ui';
import { useEffect } from 'react';
import { useStore } from 'zustand';
import { accountsQuery, forgetAccountData, kindOf, nameOf, nextSignedIn, refreshAccounts, statusOf } from '../../flow/accounts';
import { say } from '../../flow/toasts';
import { chromeMessages as m } from './messages';

/** Where the menu's actions lead. Each flow's layout says how to get there. */
export interface AccountMenuRoutes {
  /** The password step with this address filled in, or the email step, empty, for `null`. */
  signIn: (email: string | null) => void;
  /** The signed-in screen of sign-in, for the account the tab now uses. */
  done: () => void;
  /** The account chooser. */
  chooser: () => void;
}

export interface AccountMenuOptions {
  session: Session;
  directory: AccountDirectory;
  /** The account settings for the account in `slot`. */
  manageUrl: (slot: number) => string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
  go: AccountMenuRoutes;
}

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

const badgeOf = (account: ClientAccount | undefined) => {
  if (!account || account.kind === 'personal' || !account.organisation) return m.personalAccount;
  return account.role && ADMIN_ROLES.has(account.role) ? m.admin(account.organisation) : account.organisation;
};

/**
 * Everything the account menu shows and does, for whoever this tab is signed in as; `null` when nobody is.
 * Switching, signing out and adding all go through the session, which tells the other tabs; the list is
 * then read again, and what the old account's requests cached is dropped.
 */
export function useAccountMenu({ session, directory, manageUrl, privacyUrl, termsUrl, go }: AccountMenuOptions): Omit<AccountMenuProps, 'labels'> | null {
  const queryClient = useQueryClient();
  const { profile, slot, handle } = useStore(session.store);
  const signedIn = profile !== null && slot !== null;
  const accounts = useQuery({ ...accountsQuery(directory), enabled: signedIn }).data ?? [];
  const action = useMutation({ mutationFn: (run: () => Promise<void>) => run() });
  // A new account in this tab (signed in, or just created by sign-up) changes the list: the old one moves to "Other accounts".
  useEffect(() => {
    if (handle) void refreshAccounts(queryClient);
  }, [handle, queryClient]);

  if (!signedIn) return null;
  const current = accounts.find((account) => account.handle === handle);
  const others = accounts.filter((account) => account.handle !== handle);
  const byId = (id: string) => others.find((account) => account.handle === id);

  const start = (run: () => Promise<void>) => {
    if (!action.isPending) action.mutate(run);
  };

  /** Uses another signed-in account in this tab; resolves false when it turns out to be signed out after all. */
  const switchTo = async (account: ClientAccount) => {
    const switched = await session.switchTo(account.slot, account.handle);
    forgetAccountData(queryClient);
    return switched;
  };

  return {
    current: { name: current ? nameOf(current) : profile.displayName?.trim() || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email, email: profile.email, kind: 'person', initials: current?.initials, avatarUrl: current?.avatarUrl ?? profile.photo?.urls?.thumbnail ?? profile.photo?.url, badge: badgeOf(current) },
    others: others.map((account) => ({ id: account.handle, name: nameOf(account), email: account.email, kind: kindOf(account), initials: account.initials, avatarUrl: account.avatarUrl, status: statusOf(account, m), signedIn: account.signedIn })),
    manageHref: manageUrl(slot),
    privacyHref: privacyUrl,
    termsHref: termsUrl,
    isBusy: action.isPending,
    onSignOut: () =>
      start(async () => {
        const email = profile.email;
        // Signing out here always succeeds: a failed server call must not keep the account in use on this device.
        await session.signOut(slot).catch(() => undefined);
        const next = nextSignedIn(await queryClient.fetchQuery({ ...accountsQuery(directory), staleTime: 0 }).catch(() => []), handle);
        if (next && (await switchTo(next))) {
          say(m.signedOutAndSwitched(email, next.email));
          go.done();
          return;
        }
        forgetAccountData(queryClient);
        say(m.signedOutStays);
        go.chooser();
      }),
    onPick: (id) =>
      start(async () => {
        const account = byId(id);
        if (!account) return;
        if (account.signedIn && (await switchTo(account))) {
          say(m.switchedTo(account.email));
          go.done();
          return;
        }
        go.signIn(account.email);
      }),
    onSignOutOf: (id) =>
      start(async () => {
        const account = byId(id);
        if (!account) return;
        await session.signOut(account.slot).catch(() => undefined);
        await refreshAccounts(queryClient);
        say(m.signedOutOf(account.email));
      }),
    onAdd: () => go.signIn(null),
    onSignOutAll: () =>
      start(async () => {
        await session.signOutAll().catch(() => undefined);
        forgetAccountData(queryClient);
        say(m.signedOutOfAll);
        go.chooser();
      }),
  };
}
