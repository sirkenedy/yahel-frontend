import { queryOptions } from '@tanstack/react-query';
import type { AddressAvailability } from '@yahel/api-client';
import type { PasskeyRegistrar } from '@yahel/auth';
import { addressProblem } from './validation';

// These run before the account exists, so the keys carry the feature and no account context.

/** Whether a name is free. Asked only for a name that could be an address; a superseded question is cancelled. */
export const addressCheckQuery = (addresses: AddressAvailability | null, name: string) =>
  queryOptions({
    queryKey: ['personal', 'address-check', name],
    queryFn: ({ signal }) => addresses!.check(name, signal),
    enabled: addresses !== null && addressProblem(name) === null,
    staleTime: 60_000,
    retry: false,
  });

// The server keeps a challenge 60 seconds: a fresh one is fetched before that while the step is open.
const CHALLENGE_LIFETIME = 50_000;

/** Asks the server for a passkey challenge ahead of the press, and is fetching until one is ready. The challenge itself stays inside the registrar. */
export const passkeyChallengeQuery = (registrar: PasskeyRegistrar | null) =>
  queryOptions({
    queryKey: ['personal', 'passkey-challenge'],
    queryFn: async () => {
      await registrar?.prepare();
      return true;
    },
    staleTime: CHALLENGE_LIFETIME,
    refetchInterval: CHALLENGE_LIFETIME,
    gcTime: 0,
  });
