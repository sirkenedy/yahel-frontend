import { Outlet, createRootRouteWithContext, retainSearchParams, useRouter } from '@tanstack/react-router';
import { DemoMarker, LinkRouter } from '@yahel/ui';
import { useCallback } from 'react';
import { NotFound } from '../features/chrome/not-found';
import { useSessionEvents } from '../features/chrome/use-session-events';
import { PageRouteError } from '../route-error';
import { chromeMessages as m } from '../features/chrome/messages';
import type { RouterContext } from '../router';

export interface RootSearch {
  /** Where to go after signing in. Checked against the allow-list before it is ever used. */
  return?: string;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: (search: Record<string, unknown>): RootSearch => (typeof search.return === 'string' ? { return: search.return } : {}),
  search: { middlewares: [retainSearchParams(['return'])] },
  component: Root,
  notFoundComponent: NotFound,
  errorComponent: PageRouteError,
});

function Root() {
  const router = useRouter();
  const { capabilities, session } = Route.useRouteContext();
  useSessionEvents(session, useCallback(() => void router.invalidate(), [router]));
  return (
    <LinkRouter navigate={(href) => void router.navigate({ href })}>
      <Outlet />
      {capabilities.standIns.length > 0 ? <DemoMarker>{m.demoData}</DemoMarker> : null}
    </LinkRouter>
  );
}
