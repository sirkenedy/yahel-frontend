import { queryOptions } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';

type Api = Pick<Session, 'api'>;

// Keys start with the feature and name the workspace, so one workspace's people never answer for another's.
export const membersQuery = ({ api }: Api, tenantId: string) => queryOptions({ queryKey: ['users', tenantId, 'members'], queryFn: ({ signal }) => api.tenants.members.list(tenantId, signal) });

export const memberQuery = ({ api }: Api, tenantId: string, memberId: string) =>
  queryOptions({ queryKey: ['users', tenantId, 'member', memberId], queryFn: ({ signal }) => api.tenants.members.get(tenantId, memberId, signal) });
