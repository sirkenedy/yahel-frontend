import { Outlet, createRootRouteWithContext, useRouter } from '@tanstack/react-router';
import { LinkRouter } from '@yahel/ui';
import type { RouterContext } from '../router';

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root });

// Links drawn by @yahel/ui go through the router, so moving between pages does not reload Admin.
function Root() {
  const router = useRouter();
  return (
    <LinkRouter navigate={(href) => void router.navigate({ href })}>
      <Outlet />
    </LinkRouter>
  );
}
