import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AccountsApp, Session } from '@yahel/auth';
import { config } from './config';
import { routeTree } from './routeTree.gen';
import { accountsApp, session } from './session';

export interface RouterContext {
  session: Session;
  queryClient: QueryClient;
  /** Sign-in and choosing an account happen in the accounts app; these are its addresses, asking for an administrator. */
  accountsApp: AccountsApp;
  config: typeof config;
}

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

export const router = createRouter({ routeTree, context: { session, queryClient, accountsApp, config }, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
