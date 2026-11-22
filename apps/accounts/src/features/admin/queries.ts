import { queryOptions } from '@tanstack/react-query';
import type { AdminAccess, ApiClient } from '@yahel/api-client';
import type { PasskeyRegistrar } from '@yahel/auth';

// Each key carries the signed-in account, so what one person's session said is never read for another's.

/** The workspace the session is in, and whether its administrator has a passkey yet. */
export const membershipQuery = (access: AdminAccess | null, account: string) =>
  queryOptions({ queryKey: ['admin', account, 'membership'], queryFn: async () => (await access?.membership()) ?? null, staleTime: 0 });

/** Whether a confirmed recovery phone is already on the account, as the server tells it. */
export const phoneVerifiedQuery = (api: Pick<ApiClient, 'me'>, account: string) =>
  queryOptions({
    queryKey: ['admin', account, 'phone-verified'],
    queryFn: async ({ signal }) => {
      const { phone } = await api.me.recovery.get(signal);
      return (phone.configured && phone.verified) || phone.pending?.verified === true;
    },
    staleTime: 0,
  });

const CHALLENGE_LIFETIME = 4 * 60_000;

/** Asks the server for a passkey challenge ahead of the press. The challenge itself stays inside the registrar. */
export const passkeyChallengeQuery = (registrar: PasskeyRegistrar | null) =>
  queryOptions({
    queryKey: ['admin', 'passkey-challenge'],
    queryFn: () => {
      registrar?.prepare();
      return true;
    },
    staleTime: CHALLENGE_LIFETIME,
    gcTime: 0,
  });
