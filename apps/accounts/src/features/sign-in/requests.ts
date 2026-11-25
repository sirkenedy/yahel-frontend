import type { QueryClient } from '@tanstack/react-query';
import { currentAccountOf, isApiError, isWorkspaceAdmin } from '@yahel/api-client';
import type { AccountCapabilities, RecoveryMethod, RecoveryOption } from '@yahel/api-client';
import { forgetAccountData } from '@yahel/auth';
import type { PasskeyClient, Session, SignInResult } from '@yahel/auth';
import { accountsQuery } from '../../flow/accounts';
import { confirmAndSignIn, resendConfirmation, signInOrConfirm } from '../../flow/email-confirmation';
import { useFlowRequest } from '../../flow/use-flow-request';
import { say } from '../../flow/toasts';
import { describeSignInFailure, rejectedResetCode } from './feedback';
import type { FailureContext } from './feedback';
import { signInMessages as m } from './messages';
import type { SignInStep } from './machine';
import type { SignInStore } from './store';

export interface SignInRequestDeps {
  /** Counts the steps shown so far; see `useFlowRequest`. */
  visit: number;
  session: Session;
  capabilities: AccountCapabilities;
  passkeys: PasskeyClient | null;
  store: SignInStore;
  queryClient: QueryClient;
  navigate: (step: SignInStep, options?: { replace?: boolean }) => void;
  /** The address bar shows this step, even while a navigation away from it is still loading. */
  isShown: (step: SignInStep) => boolean;
  /** Where to go at once when signed in, for someone sent here to sign in; `null` shows Done. */
  leave?: (() => void) | null;
  /** Sent by Admin: an account that is not an administrator goes back to the chooser instead of leaving. */
  adminOnly?: boolean;
  /** Hands a phone challenge sign-in answered with to the phone step, which signs in once it is met. */
  checkPhone: (email: string, challengeToken: string) => void;
  /** The destinations currently offered on the recover step, to record where a code went. */
  recoveryOptions: () => RecoveryOption[];
}

type SignInOutcome = 'signed-in' | 'second-step' | 'phone-check';

const isExpiredChallenge = (error: unknown) => isApiError(error) && error.code === 'INVALID_TOKEN';

/**
 * Every request the sign-in flow makes and where each outcome leads. Nothing here renders; the provider
 * turns these into `actions` and `meta.requests`. A new flow gets its own file of this shape.
 */
export function useSignInRequests({ visit, session, capabilities, passkeys, store, queryClient, navigate, isShown, leave = null, adminOnly = false, checkPhone, recoveryOptions }: SignInRequestDeps) {
  const email = () => store.getState().email ?? '';
  const describe = (context: FailureContext) => (error: unknown) => describeSignInFailure(error, context);

  const accountsNow = () => queryClient.fetchQuery({ ...accountsQuery(capabilities.directory), staleTime: 0 });

  /**
   * For Admin, only an administrator leaves: anyone else, now signed in here too, is back on the chooser with
   * the reason beside their row. The list's entry decides; without one, Admin's own check does.
   */
  const leaveAsAdmin = async (go: () => void) => {
    const { handle, slot } = session.store.getState();
    const account = currentAccountOf(await accountsNow().catch(() => []), handle, slot);
    if (!account || isWorkspaceAdmin(account)) {
      go();
      return;
    }
    store.dispatch({ type: 'not-admin', email: account.email });
    navigate('choose', { replace: true });
  };

  // A new account in this tab: nothing the last one's requests cached may be seen, and the chooser reads its list again.
  const finish = () => {
    store.dispatch({ type: 'signed-in' });
    forgetAccountData(queryClient);
    if (leave && adminOnly) void leaveAsAdmin(leave);
    else if (leave) leave();
    else navigate('done', { replace: true });
  };

  // The challenge goes straight into the flow state; only the plain outcome is returned and kept.
  const settle = (result: SignInResult): SignInOutcome => {
    if (result.ok) return 'signed-in';
    // No session until the phone is checked: the challenge goes straight to the phone step, never into this flow's state.
    if (result.reason === 'phone-required') {
      checkPhone(email(), result.challengeToken);
      return 'phone-check';
    }
    store.dispatch({ type: 'second-step-required', challengeToken: result.challengeToken });
    return 'second-step';
  };
  const afterSignIn = (outcome: SignInOutcome) => {
    if (outcome === 'signed-in') finish();
    else if (outcome === 'second-step') navigate('code');
  };

  const password = useFlowRequest({
    visit,
    describe: describe('password'),
    run: async (value: string, { isCurrent }) => {
      const result = await signInOrConfirm(session, email(), value);
      if (result.ok || result.reason !== 'unconfirmed') return settle(result);
      // The proof is held only for the confirm step, and only if the person is still where they asked for it:
      // not left, and not on the way somewhere else while that page loads.
      if (!isCurrent() || !isShown('password')) return 'left' as const;
      store.dispatch({ type: 'email-unconfirmed', password: value });
      return 'confirm-email' as const;
    },
    onDone: (outcome) => {
      if (outcome === 'confirm-email') navigate('confirm-email');
      else if (outcome !== 'left') afterSignIn(outcome);
    },
  });

  const confirmEmail = useFlowRequest({
    visit,
    describe: describe('email-code'),
    run: async (value: string) => {
      const result = await confirmAndSignIn(session, email(), value, store.getState().provenPassword, () => store.dispatch({ type: 'email-confirmed' }));
      return result.ok || result.reason !== 'sign-in-failed' ? settle(result) : ('sign-in-failed' as const);
    },
    onDone: (outcome) => (outcome === 'sign-in-failed' ? navigate('password', { replace: true }) : afterSignIn(outcome)),
  });

  const resendEmailCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: () => resendConfirmation(session, email(), store.getState().provenPassword),
    onDone: () => say(m.newCodeSent),
  });

  const passkey = useFlowRequest({
    visit,
    scope: 'flow',
    describe: describe('passkey'),
    run: async () => {
      const result = await (passkeys?.signIn(store.getState().email ?? undefined) ?? { status: 'cancelled' as const });
      if (result.status === 'phone-required') {
        checkPhone(email(), result.challengeToken);
        return 'phone-check' as const;
      }
      if (result.status !== 'signed-in') return 'cancelled' as const;
      await session.establish(result.tokens);
      return 'signed-in' as const;
    },
    onDone: (outcome) => {
      if (outcome === 'signed-in') finish();
    },
  });

  const code = useFlowRequest({
    visit,
    describe: describe('code'),
    run: (value: string) => session.completeSecondStep(store.getState().challengeToken ?? '', value),
    onDone: finish,
    onFailed: (error) => {
      // The challenge has a short life. Once it is gone no code can work, so the person signs in again.
      if (!isExpiredChallenge(error)) return;
      store.dispatch({ type: 'challenge-expired' });
      navigate('password', { replace: true });
    },
  });

  const textCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      if (!capabilities.textCodes) throw new Error('Text codes are not offered');
      return (await capabilities.textCodes.send(store.getState().challengeToken ?? '')).destination;
    },
  });

  const sendResetCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (method: RecoveryMethod) => {
      await capabilities.recovery.send(email(), method);
      store.dispatch({ type: 'reset-code-sent', method, destination: recoveryOptions().find((option) => option.method === method)?.destination ?? '' });
    },
    onDone: () => navigate('recover-code'),
  });

  const resendResetCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      await capabilities.recovery.send(email(), store.getState().recovery?.method ?? 'email');
      return 'sent' as const;
    },
    onDone: () => say(m.newCodeSent),
  });

  const newPassword = useFlowRequest({
    visit,
    describe: describe('reset'),
    run: async (value: string) => {
      await session.api.auth.resetPassword({ email: email(), token: store.getState().resetCode ?? '', password: value });
      // From here the reset is final and the code is spent, whatever happens to the sign-in that follows.
      store.dispatch({ type: 'password-reset' });
      try {
        return settle(await session.signIn(email(), value));
      } catch {
        return 'sign-in-failed' as const;
      }
    },
    onDone: (outcome) => (outcome === 'sign-in-failed' ? navigate('password', { replace: true }) : afterSignIn(outcome)),
    onFailed: (error) => {
      const rejected = rejectedResetCode(error);
      if (!rejected) return;
      store.dispatch({ type: 'reset-code-rejected', spent: rejected === 'spent' });
      navigate('recover-code', { replace: true });
    },
  });

  const help = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (contact: string) => {
      if (!capabilities.helpDesk) throw new Error('Account help is not offered');
      await capabilities.helpDesk.request({ contact });
    },
    onDone: () => {
      store.dispatch({ type: 'help-requested' });
      navigate('help-sent');
    },
  });

  // A signed-in account opens without a password. One that turns out to be signed out after all asks for it.
  const switchAccount = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (handle: string) => {
      const account = (await accountsNow()).find((known) => known.handle === handle);
      if (!account) return { to: 'gone' as const };
      if (!account.signedIn || !(await session.switchTo(account.slot, account.handle))) return { to: 'password' as const, email: account.email };
      forgetAccountData(queryClient);
      return { to: 'done' as const, email: account.email };
    },
    onDone: (outcome) => {
      if (outcome.to === 'gone') return;
      if (outcome.to === 'password') {
        store.dispatch({ type: 'account-chosen', email: outcome.email });
        navigate('password');
        return;
      }
      store.dispatch({ type: 'account-chosen', email: outcome.email });
      store.dispatch({ type: 'signed-in' });
      if (leave) {
        leave();
        return;
      }
      say(m.switchedTo(outcome.email));
      navigate('done');
    },
  });

  const removeAccount = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async ({ handle, email: address }: { handle: string; email: string }) => {
      await session.removeAccount(handle);
      const left = await accountsNow().catch(() => []);
      return { address, left: left.length };
    },
    onDone: ({ address, left }) => {
      say(m.removed(address));
      if (left > 0) return;
      store.dispatch({ type: 'removing', on: false });
      navigate('email', { replace: true });
    },
  });

  return { password, confirmEmail, resendEmailCode, passkey, code, textCode, sendResetCode, resendResetCode, newPassword, help, switchAccount, removeAccount };
}

export type SignInRequests = ReturnType<typeof useSignInRequests>;
