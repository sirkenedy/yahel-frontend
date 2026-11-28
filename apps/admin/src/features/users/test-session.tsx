import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@yahel/api-client';
import type { Profile, WorkspaceMember } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { LinkRouter } from '@yahel/ui';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { createStore } from 'zustand';

export const me: Profile = { id: 'g-me', globalId: 'G1', email: 'amara@northwind.example', firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null, accountType: 'business' };

export const member = (over: Partial<WorkspaceMember>): WorkspaceMember => ({ _id: 'm-1', globalIdentityId: 'g-1', tenantId: 't-1', role: 'MEMBER', type: 'internal', status: 'active', createdAt: '2026-11-03T10:00:00Z', ...over });

export const owner = member({ _id: 'm-me', globalIdentityId: 'g-me', role: 'OWNER', lastActiveAt: '2026-11-20T09:41:00Z' });
export const invited = member({ _id: 'm-2', globalIdentityId: 'g-2', status: 'invited', inviteExpiresAt: '2026-12-01T00:00:00Z' });
export const admin = member({ _id: 'm-3', globalIdentityId: 'g-3', role: 'ADMIN' });
export const suspended = member({ _id: 'm-4', globalIdentityId: 'g-4', status: 'suspended', suspendedAt: '2026-11-10T00:00:00Z' });

/** A session whose API answers from `members`, as an owner signed in as `me`; and a wrapper with a query client and links that go nowhere. */
export function testSession(members: WorkspaceMember[], overrides: Record<string, unknown> = {}) {
  let listed = members;
  const api = {
    tenants: {
      members: {
        list: vi.fn(async () => listed),
        get: vi.fn(async (_tenant: string, id: string) => {
          const found = listed.find((one) => one._id === id);
          if (!found) throw new ApiError({ status: 404, code: 'RESOURCE_NOT_FOUND', message: 'gone' });
          return found;
        }),
        ...overrides,
      },
    },
  };
  const session = { api, store: createStore(() => ({ status: 'signed-in', profile: me, slot: 0, handle: 'h' })) } as unknown as Session;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const navigate = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <LinkRouter navigate={navigate}>{children}</LinkRouter>
    </QueryClientProvider>
  );
  return { api, session, wrapper, navigate, client, setMembers: (next: WorkspaceMember[]) => (listed = next) };
}
