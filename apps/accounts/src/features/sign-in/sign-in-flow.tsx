import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountCapabilities, ClientAccount, Profile, RecoveryMethod, RecoveryOption } from '@yahel/api-client';
import type { PasskeyClient, Session } from '@yahel/auth';
import type { FlowDirection } from '@yahel/ui';
import { createContext, use } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { requestStatus as status } from '../../flow/use-flow-request';
import type { FlowRequest } from '../../flow/use-flow-request';
import { useStepTravel } from '../../flow/use-step-travel';
import { describeSignInFailure } from './feedback';
import type { SignInField, SignInNext } from './feedback';
import type { ScreenFacts } from '../../flow/step-frame';
import { backOf, directionOf, stepPath } from './machine';
import type { SignInState, SignInStep } from './machine';
import { accountsQuery } from '../../flow/accounts';
import { passkeyChallengeQuery, recoveryOptionsQuery } from './queries';
import { useSignInRequests } from './requests';
import type { SignInRequests } from './requests';
import type { SignInStore } from './store';

export interface SignInFlowValue {
  /** The flow state, without the password held for the confirm step: no step is ever handed it. */
  state: Omit<SignInState, 'provenPassword'> & {
    step: SignInStep;
    profile: Profile | null;
    accounts: ClientAccount[];
    /** Whether the list of this browser's accounts is still coming, could not be read, or is here. */
    accountsStatus: 'pending' | 'error' | 'success';
    recoveryOptions: RecoveryOption[] | null;
    /** The masked number a second-step code was texted to, once one has been. */
    textedTo: string | null;
    passkeyCancelled: boolean;
    resetCodeResent: boolean;
  };
  actions: {
    /** Opens an account from the chooser: at once when it is signed in, at the password when not. */
    chooseAccount: (account: ClientAccount) => void;
    enterEmail: (email: string) => void;
    useAnotherAccount: () => void;
    /** Shows the chooser again, keeping this tab's account signed in. */
    showChooser: () => void;
    setRemoving: (on: boolean) => void;
    /** The chooser, ready to remove an account: the way out when this browser has no room for another. */
    openRemoval: () => void;
    removeAccount: (account: ClientAccount) => void;
    reloadAccounts: () => void;
    signInWithPassword: (password: string) => void;
    /** Submits the emailed code that confirms the address, then finishes signing in. */
    confirmEmail: (code: string) => void;
    resendEmailCode: () => void;
    /** Must be called from a press handler: the browser shows the passkey prompt only for a user action. */
    startPasskey: () => void;
    verifyCode: (code: string) => void;
    sendTextCode: () => void;
    sendResetCode: (method: RecoveryMethod) => void;
    resendResetCode: () => void;
    enterResetCode: (code: string) => void;
    saveNewPassword: (password: string) => void;
    requestHelp: (contact: string) => void;
    /** Leaves for the address the person was heading to before they were asked to sign in. */
    continueToApp: () => void;
  };
  meta: {
    direction: FlowDirection;
    /** Address of the step before this one, or `null` on a first step. */
    backHref: string | null;
    offers: { passkey: boolean; textCode: boolean; help: boolean };
    requests: Record<keyof SignInRequests | 'recoveryOptions', FlowRequest<SignInField, SignInNext>>;
    /** What a whole-screen state needs: whose account, and where its ways out lead. */
    screens: ScreenFacts;
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
  /** Whether the address bar shows this step: a navigation away may still be loading while the step is on screen. */
  isShown: (step: SignInStep) => boolean;
  /** Sends the browser to the validated return address. */
  leave: () => void;
  /** Someone sent here to sign in goes back as soon as they are, instead of seeing Done. */
  returning?: boolean;
  /** Takes a phone check sign-in answered with (an administrator whose phone is unverified) to the phone step. */
  checkPhone?: (email: string, challengeToken: string) => void;
  /** Addresses outside the flow that a whole-screen state can lead to. */
  links?: { signUp?: string | null; help?: string | null };
  children: ReactNode;
}

/**
 * Gives the sign-in steps one thing to read: `{ state, actions, meta }`. The state comes from the store
 * (`machine.ts`), the requests from `requests.ts`; this component only joins them. Steps know nothing
 * about the session, the API or the router.
 */
export function SignInFlowProvider({ step, session, capabilities, passkeys, store, navigate, isShown, leave, returning = false, checkPhone = () => undefined, links, children }: SignInFlowProviderProps) {
  const queryClient = useQueryClient();
  const { provenPassword, ...flow } = useStore(store);
  const profile = useStore(session.store, (snapshot) => snapshot.profile);
  const passkeyOffered = passkeys?.isSupported() ?? false;
  const accountList = useQuery(accountsQuery(capabilities.directory));
  const accounts = accountList.data ?? [];
  const recoveryOptions = useQuery({ ...recoveryOptionsQuery(capabilities.recovery, flow.email), enabled: step === 'recover' && flow.email !== null });
  // Fetched before the press so the browser's prompt can open inside it.
  useQuery({ ...passkeyChallengeQuery(passkeys, flow.email), enabled: passkeyOffered && (step === 'email' || step === 'password') });

  const travel = useStepTravel(step, directionOf);

  const requests = useSignInRequests({ visit: travel.visit, session, capabilities, passkeys, store, queryClient, navigate, isShown, leave: returning ? leave : null, checkPhone, recoveryOptions: () => recoveryOptions.data ?? [] });

  const facts = { signedIn: profile !== null, knownAccounts: accountList.isError ? null : accounts.length, passkeysOffered: passkeyOffered, helpOffered: capabilities.helpDesk !== null };
  const back = backOf(step, { ...flow, provenPassword }, facts);

  const value: SignInFlowValue = {
    state: {
      ...flow,
      step,
      profile,
      accounts,
      accountsStatus: accountList.status,
      recoveryOptions: recoveryOptions.data ?? null,
      textedTo: requests.textCode.outcome ?? null,
      passkeyCancelled: requests.passkey.outcome === 'cancelled',
      resetCodeResent: requests.resendResetCode.outcome === 'sent',
    },
    actions: {
      chooseAccount: (account) => {
        if (account.signedIn) {
          requests.switchAccount.start(account.handle);
          return;
        }
        store.dispatch({ type: 'account-chosen', email: account.email });
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
      showChooser: () => {
        store.dispatch({ type: 'another-account-wanted' });
        navigate('choose');
      },
      setRemoving: (on) => store.dispatch({ type: 'removing', on }),
      openRemoval: () => {
        store.dispatch({ type: 'another-account-wanted' });
        store.dispatch({ type: 'removing', on: true });
        navigate('choose');
      },
      removeAccount: ({ handle, email }) => requests.removeAccount.start({ handle, email }),
      reloadAccounts: () => void accountList.refetch(),
      signInWithPassword: requests.password.start,
      confirmEmail: requests.confirmEmail.start,
      resendEmailCode: requests.resendEmailCode.start,
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
      continueToApp: leave,
    },
    meta: {
      direction: travel.direction,
      backHref: back ? stepPath(back) : null,
      offers: { passkey: passkeyOffered, textCode: capabilities.textCodes !== null, help: capabilities.helpDesk !== null },
      requests: {
        password: status(requests.password),
        confirmEmail: status(requests.confirmEmail),
        resendEmailCode: status(requests.resendEmailCode, requests.resendEmailCode.start),
        passkey: status(requests.passkey, requests.passkey.start),
        code: status(requests.code),
        textCode: status(requests.textCode, requests.textCode.start),
        sendResetCode: status(requests.sendResetCode),
        resendResetCode: status(requests.resendResetCode, requests.resendResetCode.start),
        newPassword: status(requests.newPassword),
        help: status(requests.help),
        switchAccount: status(requests.switchAccount),
        removeAccount: status(requests.removeAccount),
        recoveryOptions: { isPending: recoveryOptions.isPending, feedback: recoveryOptions.error ? describeSignInFailure(recoveryOptions.error, 'other') : null, clear: () => void recoveryOptions.refetch(), again: () => void recoveryOptions.refetch() },
      },
      screens: {
        account: flow.email,
        exits: { signIn: stepPath('email'), signUp: links?.signUp, resetPassword: flow.email ? stepPath('recover') : null, support: links?.help },
        serviceStatus: capabilities.serviceStatus,
      },
    },
  };

  return <SignInFlowContext value={value}>{children}</SignInFlowContext>;
}
