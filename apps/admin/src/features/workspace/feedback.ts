import { isApiError } from '@yahel/api-client';
import { failureMessages as m } from './messages';

export type DomainAction = 'verify' | 'primary' | 'remove' | 'add';

/** What a failed domain request tells the person. Never what the server wrote: only the code it answered with. */
export function failureOf(error: unknown, action: DomainAction, domain: string): string {
  if (!isApiError(error)) return m.server;
  if (error.status === 0) return m.offline;
  switch (error.code) {
    case 'DOMAIN_NOT_VERIFIED':
      return action === 'verify' ? m.notFoundYet(domain) : m.notVerified;
    case 'SERVICE_UNAVAILABLE':
      return m.dnsUnavailable;
    case 'PRIMARY_DOMAIN_LOCKED':
      return m.primaryLocked;
    case 'DOMAIN_CONFLICT':
    case 'DOMAIN_ALREADY_CLAIMED':
      return m.conflict;
    case 'FORBIDDEN':
      return m.forbidden;
    case 'RESOURCE_NOT_FOUND':
      return m.gone;
    case 'TOO_MANY_REQUESTS':
      return m.rateLimited;
    default:
      return m.server;
  }
}
