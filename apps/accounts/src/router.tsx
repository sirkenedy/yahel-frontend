import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AccountCapabilities } from '@yahel/api-client';
import type { PasskeyClient, Session } from '@yahel/auth';
import { config } from './config';
import type { AppConfig } from './config';
import { StepRouteError } from './features/chrome/route-error';
import { createSignInStore } from './features/sign-in/store';
import type { SignInStore } from './features/sign-in/store';
import { routeTree } from './routeTree.gen';
import { session } from './session';

export interface RouterContext {
  session: Session;
  queryClient: QueryClient;
  config: AppConfig;
  capabilities: AccountCapabilities;
  passkeys: PasskeyClient | null;
  signIn: SignInStore;
}

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 }, mutations: { retry: false } } });

export const createAppRouter = (loaded: Pick<RouterContext, 'capabilities' | 'passkeys'>) =>
  createRouter({ routeTree, context: { session, queryClient, config, signIn: createSignInStore(), ...loaded }, defaultPreload: false, defaultErrorComponent: StepRouteError });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
