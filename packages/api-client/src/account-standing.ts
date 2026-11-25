import type { ClientAccount, Profile } from './types';

/** How an account is labelled: whose it is, and for a work account, which organisation and in what role. */
export type AccountStanding = { type: 'admin'; organisation: string } | { type: 'member'; organisation: string } | { type: 'work' } | { type: 'personal' };

const ADMIN_ROLES = new Set<ClientAccount['role']>(['OWNER', 'ADMIN']);

/** Whether the browser's list says this account administers a workspace: what lets it into Admin (the API still decides). */
export const isWorkspaceAdmin = (account: Pick<ClientAccount, 'kind' | 'role'>) => account.kind === 'business' && ADMIN_ROLES.has(account.role);

/**
 * This tab's entry in the browser's account list: by its handle, or, for a session made before handles
 * existed, by its slot when exactly one entry holds that slot.
 */
export const currentAccountOf = (accounts: readonly ClientAccount[], handle: string | null, slot: number | null): ClientAccount | undefined => {
  if (handle) return accounts.find((account) => account.handle === handle);
  const inSlot = accounts.filter((account) => account.slot === slot);
  return inSlot.length === 1 ? inSlot[0] : undefined;
};

/**
 * The list's entry decides whether this is a work account; without one, the profile's account type does.
 * A work account is never called personal, even when its organisation is not known.
 */
export const standingOf = (account: ClientAccount | undefined, profile: Pick<Profile, 'accountType'>): AccountStanding => {
  const work = account ? account.kind === 'business' : profile.accountType !== 'personal';
  if (!work) return { type: 'personal' };
  const organisation = account?.organisation;
  if (!organisation) return { type: 'work' };
  return ADMIN_ROLES.has(account.role) ? { type: 'admin', organisation } : { type: 'member', organisation };
};
