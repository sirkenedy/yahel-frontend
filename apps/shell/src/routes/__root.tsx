import { useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext, useNavigate, useRouter } from '@tanstack/react-router';
import { AccountMenu } from '@yahel/ui';
import { useEffect } from 'react';
import { menuMessages } from '../features/account/messages';
import { accountsQuery, useAccountMenu } from '../features/account/use-account-menu';
import { config } from '../config';
import type { RouterContext } from '../router';

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root });

function Root() {
  const { session, accountsApp } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const menu = useAccountMenu(session, {
    home: (slot) => void navigate({ to: '/u/$slot', params: { slot: String(slot) } }),
    // Signing in happens in the accounts app, a full page away.
    signIn: () => window.location.assign(accountsApp.signIn()),
    addAccount: () => window.location.assign(accountsApp.addAccount()),
    signInTo: (handle) => window.location.assign(accountsApp.signInTo(handle)),
    admin: config.adminHome,
  });

  // Another tab signed this account out, or gave its slot to another account: drop what it cached and let the guard decide.
  useEffect(
    () =>
      session.subscribe((event) => {
        if (event.type !== 'accounts-changed') queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'accounts' });
        void queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey }, { cancelRefetch: false });
        if (event.type !== 'accounts-changed') void router.invalidate();
      }),
    [session, queryClient, router],
  );

  return (
    <>
      <header className="app-bar ws-glass">
        <Link to="/" className="app-bar__brand">
          <img src="/favicon.svg" alt="" />
          Yahel
        </Link>
        {menu ? <AccountMenu {...menu} labels={menuMessages} /> : null}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
