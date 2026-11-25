import type { WorkspaceDomain } from '@yahel/api-client';

/** The record a pending domain needs. `host` is `null` for the domain itself (`@`); `value` is `null` when the list does not carry it. */
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

/** The record to show for a domain: a CNAME's alias and target, or the TXT value the list carries while the domain is pending. */
export function recordOf(domain: WorkspaceDomain): ShownRecord {
  if (domain.method === 'CNAME') return { type: 'CNAME', host: domain.verifyHost ? hostOf(domain.verifyHost, domain.domain) : null, value: domain.verifyTarget?.replace(/\.$/, '') ?? null };
  return { type: 'TXT', host: null, value: domain.verificationToken ?? null };
}

export const needsRecord = (domain: WorkspaceDomain) => domain.status !== 'verified' && domain.status !== 'released';
