import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountCapabilities, KnownAccount, Profile, RecoveryMethod, RecoveryOption } from '@yahel/api-client';
import type { PasskeyClient, Session } from '@yahel/auth';
import type { FlowDirection } from '@yahel/ui';
import { createContext, use, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { describeFailure, isRejectedResetCode } from './failure';
import type { FailureContext } from './failure';
import { backOf, directionOf, stepPath } from './machine';
import type { SignInState, SignInStep } from './machine';
import { knownAccountsQuery, recoveryOptionsQuery } from './queries';
import type { SignInStore } from './store';
import { useSingleFlight } from './use-single-flight';

/** One request the flow can make: whether it is running, and what went wrong last time in plain words. */
export interface FlowRequest {
  isPending: boolean;
  failure: string | null;
}

export interface SignInFlowValue {
  state: SignInState & {
    step: SignInStep;
    profile: Profile | null;
    accounts: KnownAccount[];
    recoveryOptions: RecoveryOption[] | null;
    /** The masked number a second-step code was texted to, once one has been. */
    textedTo: string | null;
    passkeyCancelled: boolean;
    resetCodeResent: boolean;
    removedAccount: string | null;
  };
  actions: {
    chooseAccount: (email: string) => void;
    enterEmail: (email: string) => void;
    useAnotherAccount: () => void;
    removeAccount: (email: string) => void;
    signInWithPassword: (password: string) => void;
    /** Must be called from a press handler: the browser shows the passkey prompt only for a user action. */
    startPasskey: () => void;
    verifyCode: (code: string) => void;
    sendTextCode: () => void;
    sendResetCode: (method: RecoveryMethod) => void;
    resendResetCode: () => void;
    enterResetCode: (code: string) => void;
    saveNewPassword: (password: string) => void;
    requestHelp: (contact: string) => void;
    signOut: () => void;
    /** Leaves for the address the person was heading to before they were asked to sign in. */
    continueToApp: () => void;
  };
  meta: {
    direction: FlowDirection;
    /** Address of the step before this one, or `null` on a first step. */
    backHref: string | null;
    offers: { passkey: boolean; textCode: boolean; help: boolean };
    requests: Record<'password' | 'passkey' | 'code' | 'textCode' | 'sendResetCode' | 'resendResetCode' | 'newPassword' | 'help' | 'removeAccount' | 'signOut' | 'recoveryOptions', FlowRequest>;
  };
}

export const SignInFlowContext = createContext<SignInFlowValue | null>(null);

export const useSignInFlow = () => {
  const value = use(SignInFlowContext);
  if (!value) throw new Error('Sign-in steps must be rendered inside <SignInFlowProvider>.');
  return value;
};

export interface SignInFlowProviderProps {
  step: SignInStep;
  session: Session;
  capabilities: AccountCapabilities;
  passkeys: PasskeyClient | null;
  passkeyOffered: boolean;
  store: SignInStore;
  navigate: (step: SignInStep, options?: { replace?: boolean }) => void;
  /** Sends the browser to the validated return address. */
  leave: () => void;
  children: ReactNode;
}

const request = (mutation: { isPending: boolean; error: unknown }, context: FailureContext = 'other'): FlowRequest => ({
  isPending: mutation.isPending,
  failure: mutation.error ? describeFailure(mutation.error, context) : null,
});

/**
 * Owns the sign-in flow: its state, every request it makes and where each outcome leads. Steps read
 * `{ state, actions, meta }` from context and know nothing about the session, the API or the router.
 */
export function SignInFlowProvider({ step, session, capabilities, passkeys, passkeyOffered, store, navigate, leave, children }: SignInFlowProviderProps) {
  const queryClient = useQueryClient();
  const flow = useStore(store);
  const profile = useStore(session.store, (snapshot) => snapshot.profile);
  const accounts = useQuery(knownAccountsQuery(capabilities.directory)).data ?? [];
  const recoveryOptions = useQuery({ ...recoveryOptionsQuery(capabilities.recovery, flow.email), enabled: step === 'recover' && flow.email !== null });

  const [travel, setTravel] = useState<{ step: SignInStep; direction: FlowDirection }>({ step, direction: 'forward' });
  if (travel.step !== step) setTravel({ step, direction: directionOf(travel.step, step) });

  const rememberAccount = (signedOut: boolean) => {
    const who = session.store.getState().profile;
    if (!who || !capabilities.directory) return;
    const name = who.displayName?.trim() || [who.firstName, who.lastName].filter(Boolean).join(' ') || who.email;
    void capabilities.directory
      .remember({ name, email: who.email, kind: 'person', signedOut })
      .then(() => queryClient.invalidateQueries({ queryKey: knownAccountsQuery(capabilities.directory).queryKey }))
      .catch(() => undefined);
  };

  const finish = () => {
    store.dispatch({ type: 'signed-in' });
    rememberAccount(false);
    navigate('done', { replace: true });
  };

  const afterPassword = (result: Awaited<ReturnType<Session['signIn']>>) => {
    if (result.ok) return finish();
    store.dispatch({ type: 'second-step-required', challengeToken: result.challengeToken });
    navigate('code');
  };

  const email = () => store.getState().email ?? '';

  const password = useMutation({ mutationFn: (value: string) => session.signIn(email(), value), onSuccess: afterPassword });

  const passkey = useMutation({
    mutationFn: async () => {
      if (!passkeys) return { status: 'cancelled' as const };
      return passkeys.signIn(store.getState().email ?? undefined);
    },
    onSuccess: (result) => {
      if (result.status !== 'signed-in') return;
      session.establish(result.signedIn);
      finish();
    },
  });

  const code = useMutation({ mutationFn: (value: string) => session.completeSecondStep(store.getState().challengeToken ?? '', value), onSuccess: finish });

  const textCode = useMutation({
    mutationFn: async () => {
      if (!capabilities.textCodes) throw new Error('Text codes are not offered');
      return capabilities.textCodes.send(store.getState().challengeToken ?? '');
    },
  });

  const sendReset = async (method: RecoveryMethod) => {
    await capabilities.recovery.send(email(), method);
    return method;
  };
  const sendResetCode = useMutation({
    mutationFn: sendReset,
    onSuccess: (method) => {
      const destination = recoveryOptions.data?.find((option) => option.method === method)?.destination ?? '';
      store.dispatch({ type: 'reset-code-sent', method, destination });
      navigate('recover-code');
    },
  });
  const resendResetCode = useMutation({ mutationFn: () => sendReset(store.getState().recovery?.method ?? 'email') });

  const newPassword = useMutation({
    mutationFn: async (value: string) => {
      await session.api.auth.resetPassword({ email: email(), token: store.getState().resetCode ?? '', password: value });
      return session.signIn(email(), value);
    },
    onSuccess: afterPassword,
    onError: (error) => {
      if (!isRejectedResetCode(error)) return;
      store.dispatch({ type: 'reset-code-rejected' });
      navigate('recover-code', { replace: true });
    },
  });

  const help = useMutation({
    mutationFn: async (contact: string) => {
      if (!capabilities.helpDesk) throw new Error('Account help is not offered');
      await capabilities.helpDesk.request({ contact });
    },
    onSuccess: () => {
      store.dispatch({ type: 'help-requested' });
      navigate('help-sent');
    },
  });

  const removeAccount = useMutation({
    mutationFn: async (address: string) => {
      await capabilities.directory?.remove(address);
      const left = await queryClient.fetchQuery({ ...knownAccountsQuery(capabilities.directory), staleTime: 0 });
      return { address, left: left.length };
    },
    onSuccess: ({ left }) => {
      if (left === 0) navigate('email', { replace: true });
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      rememberAccount(true);
      // Signing out locally always succeeds; a failed server call must not keep the person signed in here.
      await session.signOut().catch(() => undefined);
    },
    onSettled: () => {
      store.dispatch({ type: 'signed-out' });
      queryClient.clear();
      navigate('choose', { replace: true });
    },
  });

  const run = {
    password: useSingleFlight(password.mutate),
    passkey: useSingleFlight(passkey.mutate),
    code: useSingleFlight(code.mutate),
    textCode: useSingleFlight(textCode.mutate),
    sendResetCode: useSingleFlight(sendResetCode.mutate),
    resendResetCode: useSingleFlight(resendResetCode.mutate),
    newPassword: useSingleFlight(newPassword.mutate),
    help: useSingleFlight(help.mutate),
    removeAccount: useSingleFlight(removeAccount.mutate),
    signOut: useSingleFlight(signOut.mutate),
  };

  // A failure belongs to the step it happened on. Clearing it when that step is left means coming back
  // later starts clean. The passkey request is left alone: it is started on one step and awaited on the next.
  const { reset: resetPassword } = password;
  const { reset: resetCode } = code;
  const { reset: resetTextCode } = textCode;
  const { reset: resetSendResetCode } = sendResetCode;
  const { reset: resetResend } = resendResetCode;
  const { reset: resetNewPassword } = newPassword;
  const { reset: resetHelp } = help;
  const { reset: resetRemove } = removeAccount;
  useEffect(() => {
    const leaving: Partial<Record<SignInStep, () => void>> = {
      password: resetPassword,
      code: () => {
        resetCode();
        resetTextCode();
      },
      recover: resetSendResetCode,
      'recover-code': resetResend,
      'new-password': resetNewPassword,
      help: resetHelp,
      choose: resetRemove,
    };
    return leaving[step];
  }, [step, resetPassword, resetCode, resetTextCode, resetSendResetCode, resetResend, resetNewPassword, resetHelp, resetRemove]);

  const facts = { signedIn: profile !== null, knownAccounts: accounts.length, passkeysOffered: passkeyOffered, helpOffered: capabilities.helpDesk !== null };
  const back = backOf(step, flow, facts);

  const value: SignInFlowValue = {
    state: {
      ...flow,
      step,
      profile,
      accounts,
      recoveryOptions: recoveryOptions.data ?? null,
      textedTo: textCode.data?.destination ?? null,
      passkeyCancelled: passkey.data?.status === 'cancelled',
      resetCodeResent: resendResetCode.isSuccess,
      removedAccount: removeAccount.data?.address ?? null,
    },
    actions: {
      chooseAccount: (address) => {
        store.dispatch({ type: 'account-chosen', email: address });
        navigate('password');
      },
      enterEmail: (address) => {
        store.dispatch({ type: 'email-entered', email: address });
        navigate('password');
      },
      useAnotherAccount: () => {
        store.dispatch({ type: 'another-account-wanted' });
        navigate('email');
      },
      removeAccount: run.removeAccount,
      signInWithPassword: run.password,
      startPasskey: () => {
        if (!run.passkey()) return;
        store.dispatch({ type: 'passkey-started' });
        navigate('passkey');
      },
      verifyCode: run.code,
      sendTextCode: run.textCode,
      sendResetCode: run.sendResetCode,
      resendResetCode: run.resendResetCode,
      enterResetCode: (value) => {
        store.dispatch({ type: 'reset-code-entered', code: value });
        navigate('new-password');
      },
      saveNewPassword: run.newPassword,
      requestHelp: run.help,
      signOut: run.signOut,
      continueToApp: leave,
    },
    meta: {
      direction: travel.direction,
      backHref: back ? stepPath(back) : null,
      offers: { passkey: passkeyOffered, textCode: capabilities.textCodes !== null, help: capabilities.helpDesk !== null },
      requests: {
        password: request(password, 'password'),
        passkey: request(passkey, 'passkey'),
        code: request(code, 'code'),
        textCode: request(textCode),
        sendResetCode: request(sendResetCode),
        resendResetCode: request(resendResetCode),
        newPassword: request(newPassword, 'reset'),
        help: request(help),
        removeAccount: request(removeAccount),
        signOut: request(signOut),
        recoveryOptions: { isPending: recoveryOptions.isPending, failure: recoveryOptions.error ? describeFailure(recoveryOptions.error, 'other') : null },
      },
    },
  };

  return <SignInFlowContext value={value}>{children}</SignInFlowContext>;
}
