import type { DomainVerificationRecord, WorkspaceDomain } from '@yahel/api-client';

/** The record a pending domain needs. `host` is `null` for the domain itself (`@`); `value` is `null` when it cannot be known. */
export interface ShownRecord {
  type: 'TXT' | 'CNAME';
  host: string | null;
  value: string | null;
}

const hostOf = (host: string, domain: string) => {
  const name = host.replace(/\.$/, '').toLowerCase();
  if (name === '@' || name === domain) return null;
  return name.endsWith(`.${domain}`) ? name.slice(0, -(domain.length + 1)) : name;
};

/**
 * The record to show for a domain. The record issued when it was added (kept for this page session) wins;
 * otherwise a CNAME's alias and target are listed, and a TXT value cannot be (it is stored hashed).
 */
export function recordOf(domain: WorkspaceDomain, issued: DomainVerificationRecord | undefined): ShownRecord {
  if (issued) return { type: issued.method, host: hostOf(issued.host, domain.domain), value: issued.value };
  if (domain.method === 'CNAME') return { type: 'CNAME', host: domain.verifyHost ? hostOf(domain.verifyHost, domain.domain) : null, value: domain.verifyTarget?.replace(/\.$/, '') ?? null };
  return { type: 'TXT', host: null, value: null };
}

export const needsRecord = (domain: WorkspaceDomain) => domain.status !== 'verified' && domain.status !== 'released';
