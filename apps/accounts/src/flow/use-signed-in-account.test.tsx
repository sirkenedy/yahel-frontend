import type { Profile } from '@yahel/api-client';
import type { SessionState } from '@yahel/auth';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { useSignedInAccount } from './use-signed-in-account';

const profile = { email: 'amara.okafor@yahel.example', firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor' } as Profile;
const sessionWith = (state: SessionState) => ({ store: createStore<SessionState>(() => state) });

describe('useSignedInAccount', () => {
  it('names nobody while nobody is signed in', () => {
    const { result } = renderHook(() => useSignedInAccount(sessionWith({ status: 'signed-out', profile: null })));

    expect(result.current).toBeNull();
  });

  it('names the signed-in account, and stops the moment the session ends', () => {
    const session = sessionWith({ status: 'signed-in', profile });
    const { result } = renderHook(() => useSignedInAccount(session));
    expect(result.current).toEqual({ name: 'Amara Okafor', email: 'amara.okafor@yahel.example' });

    act(() => session.store.setState({ status: 'signed-out', profile: null }));
    expect(result.current).toBeNull();
  });

  it('falls back to the first and last name, then to the address', () => {
    const named = renderHook(() => useSignedInAccount(sessionWith({ status: 'signed-in', profile: { ...profile, displayName: ' ' } })));
    expect(named.result.current?.name).toBe('Amara Okafor');

    const bare = renderHook(() => useSignedInAccount(sessionWith({ status: 'signed-in', profile: { ...profile, displayName: '', firstName: '', lastName: '' } })));
    expect(bare.result.current?.name).toBe('amara.okafor@yahel.example');
  });
});
