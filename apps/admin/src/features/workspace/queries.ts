import { queryOptions } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';

type Api = Pick<Session, 'api'>;

// Keys start with the feature and name the workspace, so one workspace's data never answers for another's.
export const workspaceQuery = ({ api }: Api, tenantId: string) => queryOptions({ queryKey: ['workspace', tenantId, 'details'], queryFn: ({ signal }) => api.tenants.get(tenantId, signal) });

export const domainsQuery = ({ api }: Api, tenantId: string) => queryOptions({ queryKey: ['workspace', tenantId, 'domains'], queryFn: ({ signal }) => api.tenants.domains.list(tenantId, signal) });
