import type { QueryClient } from '@tanstack/react-query';
import type { AccountCapabilities } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import type { AppConfig } from '../../config';
import { resumeStep, stepPath } from './machine';
import type { AdminFacts, AdminStep, Handover } from './machine';
import { membershipQuery, phoneVerifiedQuery } from './queries';
import type { AdminStore } from './store';

export interface AdminGuardContext {
  session: Session;
  queryClient: QueryClient;
  capabilities: AccountCapabilities;
}

/**
 * Whether the administrator's first steps can be reached. They follow workspace sign-up (F-78), and they also
 * meet the phone check sign-in asks for while an administrator's phone is unverified, so a pending challenge
 * opens them in any build. Nothing here needs a stand-in: the passkey step is offered only where something saves one.
 */
export const isOffered = ({ config, admin }: { config: Pick<AppConfig, 'businessSignUp'>; admin: AdminStore }) => config.businessSignUp || admin.getState().challengeToken !== null;

/** What the step guards need to know, and whether the person signed in administers a workspace at all. Lookups are cached for the session. */
export async function loadAdminFacts({ session, queryClient, capabilities }: AdminGuardContext): Promise<AdminFacts & { administrator: boolean; organisation: string | null }> {
  const { status, profile } = session.store.getState();
  if (status !== 'signed-in' || !profile) return { signedIn: false, phoneVerified: false, hasPasskey: false, administrator: true, organisation: null };
  const [membership, phoneVerified] = await Promise.all([queryClient.ensureQueryData(membershipQuery(capabilities.adminAccess, profile.id)), queryClient.ensureQueryData(phoneVerifiedQuery(session.api, profile.id))]);
  // Where nothing can say who administers the workspace, the server is the judge of what Admin opens to.
  return { signedIn: true, phoneVerified, hasPasskey: membership?.hasPasskey ?? false, administrator: membership?.administrator ?? true, organisation: membership?.organisation ?? null };
}

/** Where a guard sends the person instead: a step of this flow, or sign-in when none of them can be shown. */
export const pathOf = (step: AdminStep | 'sign-in') => (step === 'sign-in' ? ('/signin' as const) : stepPath(step));

/** The step to show instead of `step`, or `null` when `step` itself can be shown. */
export const stepInsteadOf = (step: AdminStep, store: AdminStore, facts: AdminFacts) => {
  const honest = resumeStep(step, store.getState(), facts);
  return honest === step ? null : honest;
};

/** Takes what workspace sign-up just created, so it is not asked for again. A second arrival with the same address keeps what is underway. */
export const receiveHandover = (store: AdminStore, handover: Handover | null) => {
  if (handover && store.getState().email !== handover.email) store.dispatch({ type: 'handed-over', handover });
};

/**
 * Forgets what was underway when the flow is left, unless the administrator is signed in: workspace sign-up leaves
 * for the plan and checkout after the welcome and comes back for the passkey, which must not ask again.
 */
export const forgetAdmin = (store: AdminStore, session: Pick<Session, 'store'>) => {
  if (session.store.getState().status !== 'signed-in') store.dispatch({ type: 'reset' });
};

/** Sign-in answered with a phone challenge instead of a session: the phone step meets it. */
export const takePhoneChallenge = (store: AdminStore, email: string, challengeToken: string) => store.dispatch({ type: 'phone-required', email, challengeToken });
