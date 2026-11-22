import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AccountCapabilities } from '@yahel/api-client';
import type { PasskeyClient, PasskeyRegistrar, Session } from '@yahel/auth';
import { config } from './config';
import type { AppConfig } from './config';
import { StepRouteError } from './route-error';
import { createAdminStore } from './features/admin/store';
import type { AdminStore } from './features/admin/store';
import { createBusinessStore } from './features/business/store';
import type { BusinessStore } from './features/business/store';
import { createPersonalStore } from './features/personal/store';
import type { PersonalStore } from './features/personal/store';
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
  registrar: PasskeyRegistrar | null;
  signIn: SignInStore;
  personal: PersonalStore;
  business: BusinessStore;
  admin: AdminStore;
}

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 }, mutations: { retry: false } } });

export const createAppRouter = (loaded: Pick<RouterContext, 'capabilities' | 'passkeys' | 'registrar'>) =>
  createRouter({ routeTree, context: { session, queryClient, config, signIn: createSignInStore(), personal: createPersonalStore(), business: createBusinessStore(), admin: createAdminStore(), ...loaded }, defaultPreload: false, defaultErrorComponent: StepRouteError });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
