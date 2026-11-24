import { queryOptions } from '@tanstack/react-query';
import type { RecoveryChannels } from '@yahel/api-client';
import type { PasskeyClient } from '@yahel/auth';

// These run before anyone is signed in, so the keys carry the feature and no account context;
// they are cleared with everything else on sign-out.

const CHALLENGE_LIFETIME = 4 * 60_000;

/** Asks the server for a passkey challenge ahead of the press. The challenge itself stays inside the passkey client. */
export const passkeyChallengeQuery = (passkeys: PasskeyClient | null, email: string | null) =>
  queryOptions({
    queryKey: ['sign-in', 'passkey-challenge', email],
    queryFn: () => {
      passkeys?.prepare(email ?? undefined);
      return true;
    },
    staleTime: CHALLENGE_LIFETIME,
    gcTime: 0,
  });

export const recoveryOptionsQuery = (recovery: RecoveryChannels, email: string | null) =>
  queryOptions({
    queryKey: ['sign-in', 'recovery-options', email],
    queryFn: () => recovery.options(email ?? ''),
    enabled: email !== null,
    staleTime: Infinity,
  });
