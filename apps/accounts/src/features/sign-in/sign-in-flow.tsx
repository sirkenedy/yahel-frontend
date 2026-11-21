import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountCapabilities, KnownAccount, Profile, RecoveryMethod, RecoveryOption } from '@yahel/api-client';
import type { PasskeyClient, Session } from '@yahel/auth';
import type { FlowDirection } from '@yahel/ui';
import { createContext, use, useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { describeFailure } from './failure';
import { backOf, directionOf, stepPath } from './machine';
import type { SignInState, SignInStep } from './machine';
import { knownAccountsQuery, passkeyChallengeQuery, recoveryOptionsQuery } from './queries';
import { useSignInRequests } from './requests';
import type { SignInRequests } from './requests';
import type { SignInStore } from './store';
import type { FlowRequest } from './use-flow-request';

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
    requests: Record<keyof SignInRequests | 'recoveryOptions', FlowRequest>;
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
  store: SignInStore;
  navigate: (step: SignInStep, options?: { replace?: boolean }) => void;
  /** Sends the browser to the validated return address. */
  leave: () => void;
  children: ReactNode;
}

const status = ({ isPending, failure }: FlowRequest): FlowRequest => ({ isPending, failure });

/**
 * Gives the sign-in steps one thing to read: `{ state, actions, meta }`. The state comes from the store
 * (`machine.ts`), the requests from `requests.ts`; this component only joins them. Steps know nothing
 * about the session, the API or the router.
 */
export function SignInFlowProvider({ step, session, capabilities, passkeys, store, navigate, leave, children }: SignInFlowProviderProps) {
  const queryClient = useQueryClient();
  const flow = useStore(store);
  const profile = useStore(session.store, (snapshot) => snapshot.profile);
  const passkeyOffered = passkeys?.isSupported() ?? false;
  const accounts = useQuery(knownAccountsQuery(capabilities.directory)).data ?? [];
  const recoveryOptions = useQuery({ ...recoveryOptionsQuery(capabilities.recovery, flow.email), enabled: step === 'recover' && flow.email !== null });
  // Fetched before the press so the browser's prompt can open inside it.
  useQuery({ ...passkeyChallengeQuery(passkeys, flow.email), enabled: passkeyOffered && (step === 'email' || step === 'password') });

  // Derived during render when the step changes: which way the person moved, and how many steps they have seen.
  const [travel, setTravel] = useState<{ step: SignInStep; direction: FlowDirection; visit: number }>({ step, direction: 'forward', visit: 0 });
  if (travel.step !== step) setTravel({ step, direction: directionOf(travel.step, step), visit: travel.visit + 1 });

  const requests = useSignInRequests({ visit: travel.visit, session, capabilities, passkeys, store, queryClient, navigate, recoveryOptions: () => recoveryOptions.data ?? [] });

  const facts = { signedIn: profile !== null, knownAccounts: accounts.length, passkeysOffered: passkeyOffered, helpOffered: capabilities.helpDesk !== null };
  const back = backOf(step, flow, facts);

  const value: SignInFlowValue = {
    state: {
      ...flow,
      step,
      profile,
      accounts,
      recoveryOptions: recoveryOptions.data ?? null,
      textedTo: requests.textCode.outcome ?? null,
      passkeyCancelled: requests.passkey.outcome === 'cancelled',
      resetCodeResent: requests.resendResetCode.outcome === 'sent',
      removedAccount: requests.removeAccount.outcome?.address ?? null,
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
      removeAccount: requests.removeAccount.start,
      signInWithPassword: requests.password.start,
      startPasskey: () => {
        if (!requests.passkey.start()) return;
        store.dispatch({ type: 'passkey-started' });
        navigate('passkey');
      },
      verifyCode: requests.code.start,
      sendTextCode: requests.textCode.start,
      sendResetCode: requests.sendResetCode.start,
      resendResetCode: requests.resendResetCode.start,
      enterResetCode: (code) => {
        store.dispatch({ type: 'reset-code-entered', code });
        navigate('new-password');
      },
      saveNewPassword: requests.newPassword.start,
      requestHelp: requests.help.start,
      signOut: requests.signOut.start,
      continueToApp: leave,
    },
    meta: {
      direction: travel.direction,
      backHref: back ? stepPath(back) : null,
      offers: { passkey: passkeyOffered, textCode: capabilities.textCodes !== null, help: capabilities.helpDesk !== null },
      requests: {
        password: status(requests.password),
        passkey: status(requests.passkey),
        code: status(requests.code),
        textCode: status(requests.textCode),
        sendResetCode: status(requests.sendResetCode),
        resendResetCode: status(requests.resendResetCode),
        newPassword: status(requests.newPassword),
        help: status(requests.help),
        removeAccount: status(requests.removeAccount),
        signOut: status(requests.signOut),
        recoveryOptions: { isPending: recoveryOptions.isPending, failure: recoveryOptions.error ? describeFailure(recoveryOptions.error, 'other') : null },
      },
    },
  };

  return <SignInFlowContext value={value}>{children}</SignInFlowContext>;
}
