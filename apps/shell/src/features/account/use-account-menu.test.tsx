import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ClientAccount, Profile } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { labelOf, useAccountMenu } from './use-account-menu';

describe('labelOf', () => {
  it('says admin, the organisation or work account, and personal only for a personal account', () => {
    expect(labelOf({ type: 'admin', organisation: 'Northwind Studio' }, 'Personal')).toBe('Admin · Northwind Studio');
    expect(labelOf({ type: 'member', organisation: 'Northwind Studio' }, 'Personal')).toBe('Northwind Studio');
    expect(labelOf({ type: 'work' }, 'Personal')).toBe('Work account');
    expect(labelOf({ type: 'personal' }, 'Personal')).toBe('Personal');
  });
});

describe('useAccountMenu', () => {
  const profile = { id: 'p-1', email: 'kayode@northwind.example', displayName: 'Kayode Balogun', accountType: 'business' } as Profile;
  const entry = (role: ClientAccount['role']): ClientAccount => ({ handle: 'h-0', slot: 0, displayName: 'Kayode Balogun', initials: 'KB', avatarUrl: null, email: profile.email, kind: 'business', organisation: 'Northwind Studio', role, signedIn: true });
  const menuFor = (role: ClientAccount['role'], admin: (slot: number) => string | null) => {
    const session = { store: createStore(() => ({ status: 'signed-in', profile, slot: 0, handle: 'h-0' })), accounts: vi.fn(async () => [entry(role)]) } as unknown as Session;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return renderHook(() => useAccountMenu(session, { home: vi.fn(), signIn: vi.fn(), addAccount: vi.fn(), signInTo: vi.fn(), admin }), { wrapper });
  };

  it('links an owner or admin to Admin as the same account', async () => {
    const { result } = menuFor('OWNER', (slot) => `https://admin.yahel.example/u/${slot}/`);
    await waitFor(() => expect(result.current?.adminHref).toBe('https://admin.yahel.example/u/0/'));
  });

  it('gives a member no Admin link, and nobody one while Admin has no address', async () => {
    const member = menuFor('MEMBER', (slot) => `https://admin.yahel.example/u/${slot}/`);
    await waitFor(() => expect(member.result.current?.current.badge).toBe('Northwind Studio'));
    expect(member.result.current?.adminHref).toBeNull();

    const nowhere = menuFor('OWNER', () => null);
    await waitFor(() => expect(nowhere.result.current?.current.badge).toBe('Admin · Northwind Studio'));
    expect(nowhere.result.current?.adminHref).toBeNull();
  });
});
