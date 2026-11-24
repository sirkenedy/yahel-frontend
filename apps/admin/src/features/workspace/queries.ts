import { queryOptions } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { DomainVerificationRecord } from '@yahel/api-client';
import type { Session } from '@yahel/auth';

type Api = Pick<Session, 'api'>;

// Keys start with the feature and name the workspace, so one workspace's data never answers for another's.
export const workspaceQuery = ({ api }: Api, tenantId: string) => queryOptions({ queryKey: ['workspace', tenantId, 'details'], queryFn: ({ signal }) => api.tenants.get(tenantId, signal) });

export const domainsQuery = ({ api }: Api, tenantId: string) => queryOptions({ queryKey: ['workspace', tenantId, 'domains'], queryFn: ({ signal }) => api.tenants.domains.list(tenantId, signal) });

/**
 * The records issued when domains were added in this page session, by domain id: a TXT value is never listed
 * again. Kept with the other server data, and cleared with it on sign-out or a switch of account.
 */
export const issuedRecordsQuery = (tenantId: string) =>
  queryOptions<Record<string, DomainVerificationRecord>>({ queryKey: ['workspace', tenantId, 'issued-records'], queryFn: () => ({}), initialData: {}, staleTime: Infinity, gcTime: Infinity });

export const keepIssuedRecord = (queryClient: QueryClient, tenantId: string, domainId: string, record: DomainVerificationRecord) =>
  queryClient.setQueryData(issuedRecordsQuery(tenantId).queryKey, (known) => ({ ...known, [domainId]: record }));
