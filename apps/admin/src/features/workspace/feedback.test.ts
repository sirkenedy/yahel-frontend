import { ApiError } from '@yahel/api-client';
import { describe, expect, it } from 'vitest';
import { failureOf } from './feedback';
import { failureMessages as m } from './messages';

const refused = (status: number, code: string) => new ApiError({ status, code, message: 'what the server wrote' });

describe('failureOf', () => {
  it('says a record was not found yet, or that DNS could not be read, for a verify', () => {
    expect(failureOf(refused(422, 'DOMAIN_NOT_VERIFIED'), 'verify', 'northwind.example')).toBe(m.notFoundYet('northwind.example'));
    expect(failureOf(refused(503, 'SERVICE_UNAVAILABLE'), 'verify', 'northwind.example')).toBe(m.dnsUnavailable);
  });

  it('explains the other refusals in plain words and never repeats the server', () => {
    expect(failureOf(refused(422, 'DOMAIN_NOT_VERIFIED'), 'primary', 'northwind.example')).toBe(m.notVerified);
    expect(failureOf(refused(422, 'PRIMARY_DOMAIN_LOCKED'), 'remove', 'northwind.example')).toBe(m.primaryLocked);
    expect(failureOf(refused(409, 'DOMAIN_CONFLICT'), 'add', 'northwind.example')).toBe(m.conflict);
    expect(failureOf(refused(403, 'FORBIDDEN'), 'verify', 'northwind.example')).toBe(m.forbidden);
    expect(failureOf(refused(0, 'NETWORK_ERROR'), 'verify', 'northwind.example')).toBe(m.offline);
    expect(failureOf(refused(500, 'INTERNAL'), 'verify', 'northwind.example')).toBe(m.server);
    expect(failureOf(new Error('x'), 'verify', 'northwind.example')).not.toContain('what the server wrote');
  });
});
