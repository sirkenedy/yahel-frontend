import { QueryClient } from '@tanstack/react-query';
import type { AuthContext } from '@yahel/api-client';
import { accountsAppAddresses } from '@yahel/auth';
import type { Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { enterConsole, workspaceOf } from './access';

const personal: AuthContext = { type: 'personal', tenantId: null, displayName: null, logoUrl: null, role: null, isCurrent: true };
const workspace = (role: AuthContext['role'], isCurrent = true): AuthContext => ({ type: 'tenant', tenantId: 't-1', displayName: 'Northwind Studio', logoUrl: null, role, isCurrent });
const accountsApp = accountsAppAddresses({ accountsUrl: 'https://accounts.yahel.example/', home: 'https://admin.yahel.example/', purpose: 'admin' });
const chooser = 'https://accounts.yahel.example/signin?return=https%3A%2F%2Fadmin.yahel.example%2F&for=admin';

const sessionWith = ({ signedIn = true, slot = 0, switches = true, contexts = [workspace('OWNER')] as AuthContext[] | Error } = {}) => {
  const store = createStore(() => ({ status: signedIn ? 'signed-in' : 'signed-out', slot: signedIn ? slot : null, handle: signedIn ? `h-${slot}` : null }));
  return {
    store,
    switchTo: vi.fn(async (to: number) => {
      if (switches) store.setState({ status: 'signed-in', slot: to, handle: `h-${to}` });
      return switches;
    }),
    api: { auth: { contexts: vi.fn(async () => (contexts instanceof Error ? Promise.reject(contexts) : contexts)) } },
  } as unknown as Session & { switchTo: ReturnType<typeof vi.fn> };
};
const enter = (session: Session, slot = '0') => enterConsole({ session, queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }), accountsApp }, slot);

describe('workspaceOf', () => {
  it('lets in an owner or admin of the current workspace', () => {
    expect(workspaceOf([personal, workspace('OWNER')].map((context) => ({ ...context, isCurrent: context.type === 'tenant' })))).toEqual({ tenantId: 't-1', name: 'Northwind Studio', role: 'OWNER' });
    expect(workspaceOf([workspace('ADMIN')])).toMatchObject({ role: 'ADMIN' });
  });

  it('keeps out a personal session, a member, and a workspace that is not the current one', () => {
    expect(workspaceOf([personal])).toBeNull();
    expect(workspaceOf([workspace('MEMBER')])).toBeNull();
    expect(workspaceOf([workspace('GUEST')])).toBeNull();
    expect(workspaceOf([personal, workspace('OWNER', false)])).toBeNull();
    expect(workspaceOf([])).toBeNull();
  });
});

describe('enterConsole', () => {
  it('opens the console for an administrator signed in as the address’s account', async () => {
    await expect(enter(sessionWith())).resolves.toEqual({ to: 'console', workspace: { tenantId: 't-1', name: 'Northwind Studio', role: 'OWNER' } });
  });

  it('switches this tab to the address’s account first', async () => {
    const session = sessionWith({ slot: 0 });
    await expect(enter(session, '2')).resolves.toMatchObject({ to: 'console' });
    expect(session.switchTo).toHaveBeenCalledWith(2);
  });

  it('sends someone signed out, or whose slot is not signed in here, to sign in with an administrator account', async () => {
    await expect(enter(sessionWith({ signedIn: false, switches: false }))).resolves.toEqual({ to: 'accounts', href: chooser });
  });

  it('sends a personal account or a member back to the chooser, never to a page of its own', async () => {
    await expect(enter(sessionWith({ contexts: [personal] }))).resolves.toEqual({ to: 'accounts', href: chooser });
    await expect(enter(sessionWith({ contexts: [workspace('MEMBER')] }))).resolves.toEqual({ to: 'accounts', href: chooser });
  });

  it('puts an address without a usable slot on the first, and leaves a failed check to the error screen', async () => {
    await expect(enter(sessionWith(), 'x')).resolves.toEqual({ to: 'slot', slot: 0 });
    await expect(enter(sessionWith({ contexts: new Error('offline') }))).rejects.toThrow('offline');
  });
});

describe('enterConsole and the cache', () => {
  const setup = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tenant = vi.fn(async () => ({ id: 't-1' }));
    const load = () => queryClient.fetchQuery({ queryKey: ['tenant', 't-1'], queryFn: tenant, staleTime: 60_000 });
    const session = sessionWith({ signedIn: false });
    const enterAs = (slot: number) => enterConsole({ session, queryClient, accountsApp }, String(slot));
    return { queryClient, tenant, load, session, enterAs };
  };

  it('loads the workspace once: the tab’s own first switch, and a repeat visit, leave what was loaded alone', async () => {
    const { queryClient, tenant, load, session, enterAs } = setup();
    await enterAs(3);
    await load();
    await Promise.all([enterAs(3), enterAs(3)]);
    await load();
    expect(tenant).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(['tenant', 't-1'])).toEqual({ id: 't-1' });
    expect(session.api.auth.contexts).toHaveBeenCalledTimes(1);
  });

  it('clears the workspace data, and loads it again, when the tab’s account changes', async () => {
    const { queryClient, tenant, load, enterAs } = setup();
    await enterAs(0);
    await load();
    await enterAs(1);
    expect(queryClient.getQueryData(['tenant', 't-1'])).toBeUndefined();
    await load();
    expect(tenant).toHaveBeenCalledTimes(2);
  });

  it('keeps the accounts list when the account changes', async () => {
    const { queryClient, enterAs } = setup();
    queryClient.setQueryData(['accounts', 'on-this-device'], [{ handle: 'h-0' }]);
    await enterAs(0);
    await enterAs(1);
    expect(queryClient.getQueryData(['accounts', 'on-this-device'])).toEqual([{ handle: 'h-0' }]);
  });
});
