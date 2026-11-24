import { queryOptions } from '@tanstack/react-query';
import type { AdminAccess, ApiClient } from '@yahel/api-client';
import type { PasskeyRegistrar } from '@yahel/auth';

// Each key carries the signed-in account, so what one person's session said is never read for another's.
// The guards read these with `ensureQueryData`, so an answer is kept until the session is cleared; what the
// flow does itself in between (a phone confirmed, a passkey saved) is in its own state.

/** The workspace the session is in, and whether its administrator has a passkey yet. */
export const membershipQuery = (access: AdminAccess, account: string) => queryOptions({ queryKey: ['admin', account, 'membership'], queryFn: () => access.membership() });

/** Whether a confirmed recovery phone is already on the account, as the server tells it. */
export const phoneVerifiedQuery = (api: Pick<ApiClient, 'me'>, account: string) =>
  queryOptions({
    queryKey: ['admin', account, 'phone-verified'],
    queryFn: async ({ signal }) => {
      const { phone } = await api.me.recovery.get(signal);
      return (phone.configured && phone.verified) || phone.pending?.verified === true;
    },
  });

// The server keeps a challenge 60 seconds: a fresh one is fetched before that while the step is open.
const CHALLENGE_LIFETIME = 50_000;

/** Asks the server for a passkey challenge ahead of the press, and is fetching until one is ready. The challenge itself stays inside the registrar. */
export const passkeyChallengeQuery = (registrar: PasskeyRegistrar | null) =>
  queryOptions({
    queryKey: ['admin', 'passkey-challenge'],
    queryFn: async () => {
      await registrar?.prepare();
      return true;
    },
    staleTime: CHALLENGE_LIFETIME,
    refetchInterval: CHALLENGE_LIFETIME,
    gcTime: 0,
  });
