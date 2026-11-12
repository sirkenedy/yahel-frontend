import { Outlet, createRootRoute } from '@tanstack/react-router';
import { signInUrl } from '../config';
import { NotFound } from '../features/site-chrome/not-found';
import { SiteFooter } from '../features/site-chrome/site-footer';
import { SiteHeader } from '../features/site-chrome/site-header';

export const Route = createRootRoute({
  component: () => (
    <div id="top" className="ws-site site">
      <SiteHeader signInUrl={signInUrl} />
      <main className="site__main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: NotFound,
});
