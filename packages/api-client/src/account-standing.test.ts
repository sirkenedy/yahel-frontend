import { describe, expect, it } from 'vitest';
import { currentAccountOf, standingOf } from './account-standing';
import type { ClientAccount } from './types';

const entry = (overrides: Partial<ClientAccount> = {}): ClientAccount => ({ handle: 'h-0', slot: 0, displayName: 'Amara Okafor', initials: 'AO', avatarUrl: null, email: 'amara@northwind.example', kind: 'personal', organisation: null, role: null, signedIn: true, ...overrides });

describe('currentAccountOf', () => {
  it('finds the entry by handle', () => {
    expect(currentAccountOf([entry(), entry({ handle: 'h-1', slot: 1 })], 'h-1', 1)?.slot).toBe(1);
    expect(currentAccountOf([entry()], 'h-9', 0)).toBeUndefined();
  });

  it('falls back to the slot for a session without a handle, only when one entry holds it', () => {
    expect(currentAccountOf([entry(), entry({ handle: 'h-1', slot: 1 })], null, 1)?.handle).toBe('h-1');
    expect(currentAccountOf([entry(), entry({ handle: 'h-1', slot: 0 })], null, 0)).toBeUndefined();
    expect(currentAccountOf([entry()], null, null)).toBeUndefined();
  });
});

describe('standingOf', () => {
  it('names the organisation, and the administrator role', () => {
    expect(standingOf(entry({ kind: 'business', organisation: 'Northwind Studio', role: 'OWNER' }), { accountType: 'personal' })).toEqual({ type: 'admin', organisation: 'Northwind Studio' });
    expect(standingOf(entry({ kind: 'business', organisation: 'Northwind Studio', role: 'ADMIN' }), { accountType: 'business' })).toEqual({ type: 'admin', organisation: 'Northwind Studio' });
    expect(standingOf(entry({ kind: 'business', organisation: 'Northwind Studio', role: 'MEMBER' }), { accountType: 'managed' })).toEqual({ type: 'member', organisation: 'Northwind Studio' });
  });

  it('calls a work account without an organisation a work account, never personal', () => {
    expect(standingOf(entry({ kind: 'business', role: 'OWNER' }), { accountType: 'business' })).toEqual({ type: 'work' });
  });

  it('is personal only for a known personal account', () => {
    expect(standingOf(entry(), { accountType: 'business' })).toEqual({ type: 'personal' });
  });

  it('uses the profile when the list has no entry for this tab', () => {
    expect(standingOf(undefined, { accountType: 'personal' })).toEqual({ type: 'personal' });
    expect(standingOf(undefined, { accountType: 'business' })).toEqual({ type: 'work' });
    expect(standingOf(undefined, { accountType: 'managed' })).toEqual({ type: 'work' });
  });
});
