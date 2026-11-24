import { useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext, useNavigate, useRouter } from '@tanstack/react-router';
import { AccountMenu } from '@yahel/ui';
import { useEffect } from 'react';
import { menuMessages } from '../features/account/messages';
import { accountsQuery, useAccountMenu } from '../features/account/use-account-menu';
import type { RouterContext } from '../router';

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root });

function Root() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const menu = useAccountMenu(session, { home: (slot) => void navigate({ to: '/u/$slot', params: { slot: String(slot) } }), signIn: () => void navigate({ to: '/sign-in' }) });

  // Another tab signed this account out, or gave its slot to another account: drop what it cached and let the guard decide.
  useEffect(
    () =>
      session.subscribe((event) => {
        if (event.type !== 'accounts-changed') queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'accounts' });
        void queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey });
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
