import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import type { RouterContext } from '../router';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <header className="app-bar ws-glass">
        <Link to="/" className="app-bar__brand">
          <img src="/favicon.svg" alt="" />
          Yahel
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  ),
});
