import type { QueryClient } from '@tanstack/react-query';
import type { AccountCapabilities } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import type { AppConfig } from '../../config';
import { resumeStep } from './machine';
import type { AdminFacts, AdminStep, Handover } from './machine';
import { membershipQuery, phoneVerifiedQuery } from './queries';
import type { AdminStore } from './store';

export interface AdminGuardContext {
  session: Session;
  queryClient: QueryClient;
  capabilities: AccountCapabilities;
}

/**
 * Whether this build offers an administrator's first sign-in. It follows workspace sign-up (F-78), which is
 * the only way to arrive, and needs what only a server can answer: who administers the workspace, and a
 * place to save the passkey Admin requires. Where it is not offered, a new administrator signs in through
 * sign-in, which takes the emailed code just the same.
 */
export const isOffered = ({ config, capabilities }: { config: Pick<AppConfig, 'businessSignUp'>; capabilities: Pick<AccountCapabilities, 'adminAccess' | 'passkeyRegistration'> }) =>
  config.businessSignUp && capabilities.adminAccess !== null && capabilities.passkeyRegistration !== null;

/** What the step guards need to know, and whether the person signed in administers a workspace at all. Lookups are cached for the session. */
export async function loadAdminFacts({ session, queryClient, capabilities }: AdminGuardContext): Promise<AdminFacts & { administrator: boolean; organisation: string | null; passkeyRequired: boolean }> {
  const { status, profile } = session.store.getState();
  if (status !== 'signed-in' || !profile) return { signedIn: false, phoneVerified: false, hasPasskey: false, administrator: true, organisation: null, passkeyRequired: false };
  const [membership, phoneVerified] = await Promise.all([queryClient.ensureQueryData(membershipQuery(capabilities.adminAccess, profile.id)), queryClient.ensureQueryData(phoneVerifiedQuery(session.api, profile.id))]);
  return { signedIn: true, phoneVerified, hasPasskey: membership?.hasPasskey ?? false, administrator: membership?.administrator ?? false, organisation: membership?.organisation ?? null, passkeyRequired: membership?.passkeyRequired === true };
}

/** The step to show instead of `step`, or `null` when `step` itself can be shown. */
export const stepInsteadOf = (step: AdminStep, store: AdminStore, facts: AdminFacts) => {
  const honest = resumeStep(step, store.getState(), facts);
  return honest === step ? null : honest;
};

/** Takes the address workspace sign-up just created, so it is not asked for again. A second arrival with the same address keeps what is underway. */
export const receiveHandover = (store: AdminStore, handover: Handover | null) => {
  if (handover && store.getState().email !== handover.email) store.dispatch({ type: 'handed-over', handover });
};

/** Forgets the password held for the confirm step. Called when that step is left, however it is left. */
export const dropProof = (store: AdminStore) => store.dispatch({ type: 'proof-dropped' });

/** Forgets everything: when the flow is left, at its entry address and on sign-out. */
export const forgetAdmin = (store: AdminStore) => store.dispatch({ type: 'reset' });
