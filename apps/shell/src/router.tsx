import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { Session } from '@yahel/auth';
import { routeTree } from './routeTree.gen';
import { session } from './session';

export interface RouterContext {
  session: Session;
  queryClient: QueryClient;
}

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

export const router = createRouter({ routeTree, context: { session, queryClient }, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
