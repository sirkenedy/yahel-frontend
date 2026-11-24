import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClientAccount } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import type { AccountMenuProps } from '@yahel/ui';
import { useStore } from 'zustand';
import { accountWords as w } from './messages';

/** The accounts this browser remembers. They belong to the browser, so the key carries no account. */
export const accountsQuery = (session: Pick<Session, 'accounts'>) => queryOptions({ queryKey: ['accounts', 'on-this-device'], queryFn: ({ signal }) => session.accounts(signal), staleTime: Infinity, retry: false });

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);
const nameOf = (account: Pick<ClientAccount, 'displayName' | 'email'>) => account.displayName?.trim() || account.email;
const badgeOf = (account: ClientAccount | undefined) => {
  if (!account || account.kind === 'personal' || !account.organisation) return w.personalAccount;
  return account.role && ADMIN_ROLES.has(account.role) ? w.admin(account.organisation) : account.organisation;
};

export interface ShellMenuRoutes {
  /** The app as the account in `slot`. */
  home: (slot: number) => void;
  signIn: () => void;
}

/** The account menu in the app's header, for the account in this tab; `null` when nobody is signed in. */
export function useAccountMenu(session: Session, go: ShellMenuRoutes): Omit<AccountMenuProps, 'labels'> | null {
  const queryClient = useQueryClient();
  const { profile, slot, handle } = useStore(session.store);
  const signedIn = profile !== null && slot !== null;
  const accounts = useQuery({ ...accountsQuery(session), enabled: signedIn }).data ?? [];
  const action = useMutation({ mutationFn: (run: () => Promise<void>) => run() });
  if (!signedIn) return null;

  const current = accounts.find((account) => account.handle === handle);
  const others = accounts.filter((account) => account.handle !== handle);
  const start = (run: () => Promise<void>) => {
    if (!action.isPending) action.mutate(run);
  };
  // What one account's requests cached is never shown to another (rulebook 2.7).
  const forget = () => {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'accounts' });
    void queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey });
  };

  return {
    current: { name: current ? nameOf(current) : profile.displayName?.trim() || profile.email, email: profile.email, kind: 'person', initials: current?.initials, avatarUrl: current?.avatarUrl ?? profile.photo?.urls?.thumbnail ?? profile.photo?.url, badge: badgeOf(current) },
    others: others.map((account) => ({ id: account.handle, name: nameOf(account), email: account.email, kind: account.kind === 'business' ? 'organisation' : 'person', initials: account.initials, avatarUrl: account.avatarUrl, status: account.signedIn ? (account.organisation ?? w.personal) : w.signedOut, signedIn: account.signedIn })),
    manageHref: `/u/${slot}/account`,
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
      else go.signIn();
    },
    onSignOutOf: (id) =>
      start(async () => {
        const account = others.find((known) => known.handle === id);
        if (!account) return;
        await session.signOut(account.slot).catch(() => undefined);
        await queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey });
      }),
    onAdd: go.signIn,
    onSignOutAll: () =>
      start(async () => {
        await session.signOutAll().catch(() => undefined);
        forget();
        go.signIn();
      }),
  };
}
