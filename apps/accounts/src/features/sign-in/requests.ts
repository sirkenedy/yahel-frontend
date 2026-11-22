import type { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@yahel/api-client';
import type { AccountCapabilities, RecoveryMethod, RecoveryOption } from '@yahel/api-client';
import type { PasskeyClient, Session, SignInResult } from '@yahel/auth';
import { useFlowRequest } from '../../flow/use-flow-request';
import { say } from '../../flow/toasts';
import { describeSignInFailure, rejectedResetCode } from './feedback';
import type { FailureContext } from './feedback';
import { signInMessages as m } from './messages';
import type { SignInStep } from './machine';
import { knownAccountsQuery } from './queries';
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
  /** The destinations currently offered on the recover step, to record where a code went. */
  recoveryOptions: () => RecoveryOption[];
}

type SignInOutcome = 'signed-in' | 'second-step';

const isExpiredChallenge = (error: unknown) => isApiError(error) && error.code === 'INVALID_TOKEN';

/**
 * Every request the sign-in flow makes and where each outcome leads. Nothing here renders; the provider
 * turns these into `actions` and `meta.requests`. A new flow gets its own file of this shape.
 */
export function useSignInRequests({ visit, session, capabilities, passkeys, store, queryClient, navigate, recoveryOptions }: SignInRequestDeps) {
  const email = () => store.getState().email ?? '';
  const describe = (context: FailureContext) => (error: unknown) => describeSignInFailure(error, context);

  const rememberAccount = async (signedOut: boolean) => {
    const who = session.store.getState().profile;
    if (!who || !capabilities.directory) return;
    const name = who.displayName?.trim() || [who.firstName, who.lastName].filter(Boolean).join(' ') || who.email;
    await capabilities.directory
      .remember({ name, email: who.email, kind: 'person', signedOut })
      .then(() => queryClient.invalidateQueries({ queryKey: knownAccountsQuery(capabilities.directory).queryKey }))
      // The chooser is a convenience; failing to update it must never fail a sign-in or a sign-out.
      .catch(() => undefined);
  };

  const finish = () => {
    store.dispatch({ type: 'signed-in' });
    void rememberAccount(false);
    navigate('done', { replace: true });
  };

  // The challenge goes straight into the flow state; only the plain outcome is returned and kept.
  const settle = (result: SignInResult): SignInOutcome => {
    if (result.ok) return 'signed-in';
    store.dispatch({ type: 'second-step-required', challengeToken: result.challengeToken });
    return 'second-step';
  };
  const afterSignIn = (outcome: SignInOutcome) => (outcome === 'signed-in' ? finish() : navigate('code'));

  const password = useFlowRequest({
    visit,
    describe: describe('password'),
    run: async (value: string) => settle(await session.signIn(email(), value)),
    onDone: afterSignIn,
  });

  const passkey = useFlowRequest({
    visit,
    scope: 'flow',
    describe: describe('passkey'),
    run: async () => {
      const result = await (passkeys?.signIn(store.getState().email ?? undefined) ?? { status: 'cancelled' as const });
      if (result.status !== 'signed-in') return 'cancelled' as const;
      session.establish(result.signedIn);
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

  const removeAccount = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (address: string) => {
      await capabilities.directory?.remove(address);
      const left = await queryClient.fetchQuery({ ...knownAccountsQuery(capabilities.directory), staleTime: 0 });
      return { address, left: left.length };
    },
    onDone: ({ left }) => {
      if (left === 0) navigate('email', { replace: true });
    },
  });

  const signOut = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      await rememberAccount(true);
      // Signing out here always succeeds; a failed server call must not keep the person signed in on this device.
      await session.signOut().catch(() => undefined);
    },
    onDone: () => {
      store.dispatch({ type: 'signed-out' });
      queryClient.clear();
      navigate('choose', { replace: true });
    },
  });

  return { password, passkey, code, textCode, sendResetCode, resendResetCode, newPassword, help, removeAccount, signOut };
}

export type SignInRequests = ReturnType<typeof useSignInRequests>;
