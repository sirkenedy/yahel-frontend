import type { QueryClient } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';
import type { AuthContext } from '@yahel/api-client';
import { keepAccountDataFor, slotOf } from '@yahel/auth';
import type { AccountsApp, Session } from '@yahel/auth';

/** The workspace this account administers in Admin, from its current context. */
export interface ConsoleWorkspace {
  tenantId: string;
  name: string;
  role: 'OWNER' | 'ADMIN';
}

/** The session's contexts, for the account in this tab. The key names the account, so another account's never answer. */
export const contextsQuery = (session: Pick<Session, 'api'>, handle: string | null) =>
  queryOptions({ queryKey: ['console', 'contexts', handle], queryFn: ({ signal }) => session.api.auth.contexts(signal), staleTime: 60_000 });

/**
 * Whether the session may use Admin: its current context is a workspace in which it is an owner or an
 * admin. A personal session, or a member, may not. The API refuses them anyway (`OrgAdminGuard`).
 */
export const workspaceOf = (contexts: readonly AuthContext[]): ConsoleWorkspace | null => {
  const current = contexts.find((context) => context.isCurrent);
  if (!current || current.type !== 'tenant' || !current.tenantId) return null;
  if (current.role !== 'OWNER' && current.role !== 'ADMIN') return null;
  return { tenantId: current.tenantId, name: current.displayName ?? '', role: current.role };
};

export type ConsoleEntry = { to: 'slot'; slot: number } | { to: 'accounts'; href: string } | { to: 'console'; workspace: ConsoleWorkspace };

export interface ConsoleEntryContext {
  session: Session;
  queryClient: QueryClient;
  accountsApp: AccountsApp;
}

/**
 * Where opening Admin as `/u/<slot>/` leads. An address without a usable slot goes to the first; an account
 * not signed in here goes to the accounts app's sign-in; one that is not an administrator goes back to the
 * accounts app's chooser, which asks for an administrator account (as Google does). Admin has no
 * access-denied page. A failure to read the contexts is thrown, for the route's error screen.
 */
export async function enterConsole({ session, queryClient, accountsApp }: ConsoleEntryContext, slotParam: string): Promise<ConsoleEntry> {
  const slot = slotOf(slotParam);
  if (slot === null) return { to: 'slot', slot: 0 };
  const { status, slot: using } = session.store.getState();
  if (!(status === 'signed-in' && using === slot)) {
    if (!(await session.switchTo(slot))) return { to: 'accounts', href: accountsApp.signIn() };
  }
  keepAccountDataFor(queryClient, session.store.getState().handle);
  const contexts = await queryClient.fetchQuery(contextsQuery(session, session.store.getState().handle));
  const workspace = workspaceOf(contexts);
  return workspace ? { to: 'console', workspace } : { to: 'accounts', href: accountsApp.signIn() };
}
