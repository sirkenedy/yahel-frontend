import { useQuery } from '@tanstack/react-query';
import type { AccountCapabilities } from '@yahel/api-client';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import type { FlowDirection } from '@yahel/ui';
import { createContext, use } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { useDebouncedValue } from '../../flow/use-debounced-value';
import { requestStatus as status } from '../../flow/use-flow-request';
import type { ScreenFacts } from '../../flow/step-frame';
import type { FlowRequest } from '../../flow/use-flow-request';
import type { PersonalField, PersonalNext } from './feedback';
import { useStepTravel } from '../../flow/use-step-travel';
import { addressOf, backOf, directionOf, fullNameOf, nextOf, progressOf, stepPath } from './machine';
import type { BirthDate, Gender, PersonalFacts, PersonalState, PersonalStep } from './machine';
import { addressCheckQuery, passkeyChallengeQuery } from './queries';
import { usePersonalRequests } from './requests';
import type { PersonalRequests } from './requests';
import type { PersonalStore } from './store';
import { addressFromName, addressProblem } from './validation';

const CHECK_DELAY = 350;

/** `unoffered`: this build cannot check. `unknown`: the check failed, and creating the account will decide. */
export type AddressCheckStatus = 'unoffered' | 'idle' | 'checking' | 'available' | 'taken' | 'unknown';

export type ReviewRow = 'name' | 'address' | 'birthday' | 'signIn' | 'recovery';

export interface PersonalFlowValue {
  /** The answers, without the password: no step is ever handed it back. */
  state: Omit<PersonalState, 'password'> & {
    step: PersonalStep;
    hasPassword: boolean;
    /** The address the person will sign in with. */
    address: string;
    fullName: string;
    /** What is known about the address being typed, and free ones like it. */
    addressCheck: { status: AddressCheckStatus; alternatives: readonly string[] };
    passkeyCancelled: boolean;
    emailCodeResent: boolean;
    phoneCodeResent: boolean;
  };
  actions: {
    startPersonal: () => void;
    /** Leaves for the business sign-up. */
    startBusiness: () => void;
    enterName: (firstName: string, lastName: string) => void;
    enterBirth: (birth: BirthDate, gender: Gender) => void;
    typeAddress: (name: string) => void;
    chooseAddress: (name: string) => void;
    useOwnEmail: () => void;
    useYahelAddress: () => void;
    chooseOwnEmail: (email: string) => void;
    choosePassword: (password: string) => void;
    /** Moves on with the password already chosen. */
    keepPassword: () => void;
    /** Must be called from a press handler: the browser shows the passkey prompt only for a user action. */
    startPasskey: () => void;
    /** Moves on from the passkey steps without (another) passkey. */
    continueWithoutPasskey: () => void;
    enterRecovery: (recovery: PersonalState['recovery']) => void;
    skipRecovery: () => void;
    setPreferences: (preferences: PersonalState['preferences']) => void;
    edit: (row: ReviewRow) => void;
    createAccount: () => void;
    confirmEmail: (code: string) => void;
    /** Gives up on the emailed code and asks for the address again; every other answer stands. */
    useDifferentAddress: () => void;
    /** Forgets every answer and returns to the first screen. */
    startAgain: () => void;
    resendEmailCode: () => void;
    verifyPhone: (code: string) => void;
    resendPhoneCode: () => void;
    skipPhone: () => void;
    inviteContact: (email: string) => void;
    /** Leaves for the address the person was heading to before they were asked to sign up. */
    continueToApp: () => void;
  };
  meta: {
    direction: FlowDirection;
    /** Address of the step before this one, or `null` when there is none. */
    backHref: string | null;
    progress: ReturnType<typeof progressOf>;
    /** The domain of a new Yahel address, without the @. */
    mailDomain: string;
    offers: { passkey: boolean; contact: boolean; preferences: boolean };
    links: { signIn: string; terms: string | null; privacy: string | null; help?: string | null };
    /** What a whole-screen state needs: whose account, and where its ways out lead. */
    screens: ScreenFacts;
    requests: Record<Exclude<keyof PersonalRequests, 'skipPhone'>, FlowRequest<PersonalField, PersonalNext>>;
  };
}

export const PersonalFlowContext = createContext<PersonalFlowValue | null>(null);

export const usePersonalFlow = () => {
  const value = use(PersonalFlowContext);
  if (!value) throw new Error('Personal sign-up steps must be rendered inside <PersonalFlowProvider>.');
  return value;
};

export interface PersonalFlowProviderProps {
  step: PersonalStep;
  session: Session;
  capabilities: AccountCapabilities;
  registrar: PasskeyRegistrar | null;
  store: PersonalStore;
  /** The domain of a new Yahel address, without the @. */
  mailDomain: string;
  links: PersonalFlowValue['meta']['links'];
  navigate: (step: PersonalStep, options?: { replace?: boolean }) => void;
  /** Sends the browser to the business sign-up. */
  leaveForBusiness: () => void;
  /** Sends the browser to the validated return address. */
  leave: () => void;
  /** Passed to the requests; see `PersonalRequestDeps`. */
  pause?: () => Promise<void>;
  children: ReactNode;
}

const reviewSteps = { name: 'name', birthday: 'birth', signIn: 'password', recovery: 'recovery' } as const;

/**
 * Gives the personal sign-up steps one thing to read: `{ state, actions, meta }`. The state comes from the
 * store (`machine.ts`), the requests from `requests.ts`; this component only joins them. Steps know
 * nothing about the session, the API or the router.
 */
export function PersonalFlowProvider({ step, session, capabilities, registrar, store, mailDomain, links, navigate, leaveForBusiness, leave, pause, children }: PersonalFlowProviderProps) {
  const { password, ...flow } = useStore(store);
  const facts: PersonalFacts = { passkeysOffered: registrar?.isSupported() ?? false, contactOffered: capabilities.trustedContacts !== null };
  const travel = useStepTravel(step, directionOf);

  // Fetched before the press so the browser's prompt can open inside it.
  useQuery({ ...passkeyChallengeQuery(registrar), enabled: facts.passkeysOffered && step === 'add-passkey' });

  // What is in the address field, asked about once typing pauses. Before anything is typed, the person's name is.
  const typed = flow.addressDraft;
  const asked = useDebouncedValue(typed || addressFromName(flow.firstName, flow.lastName), CHECK_DELAY);
  const check = useQuery({ ...addressCheckQuery(capabilities.addresses, asked), enabled: step === 'address' && addressCheckQuery(capabilities.addresses, asked).enabled });
  const addressCheck = ((): PersonalFlowValue['state']['addressCheck'] => {
    if (!capabilities.addresses) return { status: 'unoffered', alternatives: [] };
    const answer = check.data;
    if (typed === '') return { status: 'idle', alternatives: answer ? [...(answer.available ? [asked] : []), ...answer.alternatives].slice(0, 3) : [] };
    if (addressProblem(typed) !== null) return { status: 'idle', alternatives: [] };
    if (typed !== asked || check.isPending) return { status: 'checking', alternatives: [] };
    if (!answer) return { status: 'unknown', alternatives: [] };
    return { status: answer.available ? 'available' : 'taken', alternatives: answer.alternatives.filter((name) => name !== typed) };
  })();

  /** Moves on from an answered step. An answer changed from the review returns there. */
  const advance = (from: Parameters<typeof nextOf>[0]) => navigate(nextOf(from, store.getState(), facts));

  const requests = usePersonalRequests({ visit: travel.visit, session, capabilities, registrar, store, mailDomain, navigate, advance, pause });
  const back = backOf(step, { ...flow, password }, facts);

  const value: PersonalFlowValue = {
    state: {
      ...flow,
      step,
      hasPassword: password !== null,
      address: addressOf(flow, mailDomain),
      fullName: fullNameOf(flow),
      addressCheck,
      passkeyCancelled: requests.passkey.outcome === 'cancelled',
      emailCodeResent: requests.resendEmailCode.outcome === 'sent',
      phoneCodeResent: requests.resendPhoneCode.outcome === 'sent',
    },
    actions: {
      startPersonal: () => advance('type'),
      startBusiness: leaveForBusiness,
      enterName: (firstName, lastName) => {
        store.dispatch({ type: 'name-entered', firstName, lastName });
        advance('name');
      },
      enterBirth: (birth, gender) => {
        store.dispatch({ type: 'birth-entered', birth, gender });
        advance('birth');
      },
      typeAddress: (draft) => store.dispatch({ type: 'address-typed', draft }),
      chooseAddress: (username) => {
        store.dispatch({ type: 'address-chosen', username });
        advance('address');
      },
      // The kind of address changes only when the new address is given, so there is never a kind without one.
      useOwnEmail: () => navigate('own-email'),
      useYahelAddress: () => navigate('address'),
      chooseOwnEmail: (email) => {
        store.dispatch({ type: 'own-email-chosen', email });
        advance('own-email');
      },
      choosePassword: (password) => {
        store.dispatch({ type: 'password-chosen', password });
        advance('password');
      },
      keepPassword: () => advance('password'),
      startPasskey: () => {
        if (!requests.passkey.start()) return;
        store.dispatch({ type: 'passkey-started' });
        navigate('passkey');
      },
      continueWithoutPasskey: () => advance('add-passkey'),
      enterRecovery: (recovery) => {
        store.dispatch({ type: 'recovery-entered', ...recovery });
        advance('recovery');
      },
      skipRecovery: () => {
        store.dispatch({ type: 'recovery-skipped' });
        advance('recovery');
      },
      setPreferences: (preferences) => store.dispatch({ type: 'preferences-changed', preferences }),
      edit: (row) => {
        store.dispatch({ type: 'edit-started' });
        navigate(row === 'address' ? (flow.addressKind === 'own' ? 'own-email' : 'address') : reviewSteps[row]);
      },
      createAccount: () => {
        if (!requests.create.start()) return;
        store.dispatch({ type: 'creation-started' });
        navigate('creating');
      },
      confirmEmail: requests.confirmEmail.start,
      useDifferentAddress: () => {
        store.dispatch({ type: 'address-abandoned' });
        navigate('own-email', { replace: true });
      },
      startAgain: () => {
        store.dispatch({ type: 'reset' });
        navigate('type', { replace: true });
      },
      resendEmailCode: requests.resendEmailCode.start,
      verifyPhone: requests.verifyPhone.start,
      resendPhoneCode: requests.resendPhoneCode.start,
      skipPhone: requests.skipPhone,
      inviteContact: requests.inviteContact.start,
      continueToApp: leave,
    },
    meta: {
      direction: travel.direction,
      backHref: back ? stepPath(back) : null,
      progress: progressOf(step),
      mailDomain,
      offers: { passkey: facts.passkeysOffered, contact: facts.contactOffered, preferences: capabilities.preferences !== null },
      links,
      screens: { account: flow.creation.created ? addressOf(flow, mailDomain) : null, exits: { signIn: links.signIn, signUp: stepPath('type'), support: links.help }, serviceStatus: capabilities.serviceStatus },
      requests: {
        passkey: status(requests.passkey, requests.passkey.start),
        create: status(requests.create, requests.create.start),
        confirmEmail: status(requests.confirmEmail),
        resendEmailCode: status(requests.resendEmailCode, requests.resendEmailCode.start),
        verifyPhone: status(requests.verifyPhone),
        resendPhoneCode: status(requests.resendPhoneCode, requests.resendPhoneCode.start),
        inviteContact: status(requests.inviteContact),
      },
    },
  };

  return <PersonalFlowContext value={value}>{children}</PersonalFlowContext>;
}
