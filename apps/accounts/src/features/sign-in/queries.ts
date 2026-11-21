import { queryOptions } from '@tanstack/react-query';
import type { AccountDirectory, RecoveryChannels } from '@yahel/api-client';
import type { PasskeyClient } from '@yahel/auth';

// These run before anyone is signed in, so the keys carry the feature and no account context;
// they are cleared with everything else on sign-out.

export const knownAccountsQuery = (directory: AccountDirectory | null) =>
  queryOptions({
    queryKey: ['sign-in', 'known-accounts'],
    // The chooser is a convenience: if the list cannot be read, sign-in starts from the email step.
    queryFn: () => (directory ? directory.list().catch(() => []) : []),
    staleTime: Infinity,
  });

export const passkeyOfferedQuery = (passkeys: PasskeyClient | null) =>
  queryOptions({
    queryKey: ['sign-in', 'passkey-offered'],
    queryFn: () => (passkeys ? passkeys.isAvailable() : false),
    staleTime: Infinity,
  });

export const recoveryOptionsQuery = (recovery: RecoveryChannels, email: string | null) =>
  queryOptions({
    queryKey: ['sign-in', 'recovery-options', email],
    queryFn: () => recovery.options(email ?? ''),
    enabled: email !== null,
    staleTime: Infinity,
  });
