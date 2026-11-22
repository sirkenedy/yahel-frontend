import type { Session } from '@yahel/auth';
import { useStore } from 'zustand';

/**
 * Whose account the header names. It follows the session itself, never a flow's own record of having
 * signed in, so it is gone the moment the session is: a screen that says the session has ended must not
 * also say "Signed in as".
 */
export function useSignedInAccount(session: Pick<Session, 'store'>) {
  const profile = useStore(session.store, (snapshot) => snapshot.profile);
  if (!profile) return null;
  return { name: profile.displayName?.trim() || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email, email: profile.email };
}
