import type { WorkspaceDomain } from '@yahel/api-client';
import { describe, expect, it } from 'vitest';
import { needsRecord, recordOf } from './domain-record';

const domain = (overrides: Partial<WorkspaceDomain> = {}): WorkspaceDomain => ({ _id: 'd-1', domain: 'northwind.example', method: 'TXT', status: 'pending', isPrimary: false, ...overrides });

describe('recordOf', () => {
  it('shows the TXT value the list carries, on the domain itself', () => {
    expect(recordOf(domain({ verificationToken: 'worksync-site-verification=abc' }))).toEqual({ type: 'TXT', host: null, value: 'worksync-site-verification=abc' });
  });

  it('has no value when the list carries none', () => {
    expect(recordOf(domain())).toEqual({ type: 'TXT', host: null, value: null });
  });

  it('shows a CNAME’s alias and target from the list, without the domain or the final dot', () => {
    expect(recordOf(domain({ method: 'CNAME', verifyHost: 'abcdef123456.northwind.example', verifyTarget: 'wv-abc.domainverify.worksync.app.' }))).toEqual({ type: 'CNAME', host: 'abcdef123456', value: 'wv-abc.domainverify.worksync.app' });
  });
});

describe('needsRecord', () => {
  it('asks for a record until the domain is verified', () => {
    expect(needsRecord(domain())).toBe(true);
    expect(needsRecord(domain({ status: 'failed' }))).toBe(true);
    expect(needsRecord(domain({ status: 'reverification_required' }))).toBe(true);
    expect(needsRecord(domain({ status: 'verified' }))).toBe(false);
  });
});
