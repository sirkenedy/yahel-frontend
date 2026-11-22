import { useQuery } from '@tanstack/react-query';
import type { AccountCapabilities } from '@yahel/api-client';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import type { FlowDirection } from '@yahel/ui';
import { createContext, use, useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { useDebouncedValue } from '../../flow/use-debounced-value';
import { requestStatus as status } from '../../flow/use-flow-request';
import type { FlowRequest } from '../../flow/use-flow-request';
import { useStepTravel } from '../../flow/use-step-travel';
import { addressOf, backOf, directionOf, nextOf, progressOf, stepPath } from './machine';
import type { BirthDate, Gender, PersonalFacts, PersonalState, PersonalStep } from './machine';
import { addressCheckQuery, passkeyChallengeQuery } from './queries';
import { fullNameOf, usePersonalRequests } from './requests';
import type { PersonalRequests } from './requests';
import type { PersonalStore } from './store';
import { addressFromName, addressProblem } from './validation';

const CHECK_DELAY = 350;

/** `unoffered`: this build cannot check. `unknown`: the check failed, and creating the account will decide. */
export type AddressCheckStatus = 'unoffered' | 'idle' | 'checking' | 'available' | 'taken' | 'unknown';

export type ReviewRow = 'name' | 'address' | 'birthday' | 'signIn' | 'recovery';

export interface PersonalFlowValue {
  state: PersonalState & {
    step: PersonalStep;
    /** The address the person will sign in with. */
    address: string;
    fullName: string;
    /** What is known about the address being typed, and free ones like it. */
    addressCheck: { status: AddressCheckStatus; alternatives: readonly string[] };
    passkeyCancelled: boolean;
    emailCodeResent: boolean;
    phoneCodeResent: boolean;
    /** The address turned out to have an account already, and the person has proved the mailbox is theirs. */
    existingAccount: boolean;
  };
  actions: {
    startPersonal: () => void;
    /** Leaves for the business sign-up. Only offered when `meta.offers.business`. */
    startBusiness: () => void;
    enterName: (firstName: string, lastName: string) => void;
    enterBirth: (birth: BirthDate, gender: Gender) => void;
    /** Tells the flow what is in the address field, so it can find out whether it is free. */
    considerAddress: (name: string) => void;
    chooseAddress: (name: string) => void;
    useOwnEmail: () => void;
    useYahelAddress: () => void;
    chooseOwnEmail: (email: string) => void;
    choosePassword: (password: string) => void;
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
    offers: { passkey: boolean; business: boolean; contact: boolean; preferences: boolean };
    links: { signIn: string; terms: string | null; privacy: string | null };
    requests: Record<Exclude<keyof PersonalRequests, 'skipPhone'>, FlowRequest>;
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
  /** Sends the browser to the business sign-up, or `null` when it has no address yet. */
  leaveForBusiness: (() => void) | null;
  /** Sends the browser to the validated return address. */
  leave: () => void;
  children: ReactNode;
}

const reviewSteps = { name: 'name', birthday: 'birth', signIn: 'password', recovery: 'recovery' } as const;

/**
 * Gives the personal sign-up steps one thing to read: `{ state, actions, meta }`. The state comes from the
 * store (`machine.ts`), the requests from `requests.ts`; this component only joins them. Steps know
 * nothing about the session, the API or the router.
 */
export function PersonalFlowProvider({ step, session, capabilities, registrar, store, mailDomain, links, navigate, leaveForBusiness, leave, children }: PersonalFlowProviderProps) {
  const flow = useStore(store);
  const facts: PersonalFacts = { passkeysOffered: registrar?.isSupported() ?? false, contactOffered: capabilities.trustedContacts !== null };
  const travel = useStepTravel(step, directionOf);

  // Fetched before the press so the browser's prompt can open inside it.
  useQuery({ ...passkeyChallengeQuery(registrar), enabled: facts.passkeysOffered && step === 'add-passkey' });

  // What is in the address field, asked about once typing pauses. Before anything is typed, the person's name is.
  const [typed, setTyped] = useState(flow.username);
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

  /** Moves on from an answered step. An answer changed from the review returns there, and the change is over. */
  const advance = (from: Parameters<typeof nextOf>[0]) => {
    const current = store.getState();
    const next = nextOf(from, current, facts);
    if (next === 'review' && current.editing) store.dispatch({ type: 'edit-finished' });
    navigate(next);
  };

  const requests = usePersonalRequests({ visit: travel.visit, session, capabilities, registrar, store, mailDomain, navigate, advance });
  const back = backOf(step, flow, facts);

  const value: PersonalFlowValue = {
    state: {
      ...flow,
      step,
      address: addressOf(flow, mailDomain),
      fullName: fullNameOf(flow),
      addressCheck,
      passkeyCancelled: requests.passkey.outcome === 'cancelled',
      emailCodeResent: requests.resendEmailCode.outcome === 'sent',
      phoneCodeResent: requests.resendPhoneCode.outcome === 'sent',
      existingAccount: requests.create.outcome === 'existing-account',
    },
    actions: {
      startPersonal: () => advance('type'),
      startBusiness: () => leaveForBusiness?.(),
      enterName: (firstName, lastName) => {
        store.dispatch({ type: 'name-entered', firstName, lastName });
        advance('name');
      },
      enterBirth: (birth, gender) => {
        store.dispatch({ type: 'birth-entered', birth, gender });
        advance('birth');
      },
      considerAddress: setTyped,
      chooseAddress: (username) => {
        store.dispatch({ type: 'address-chosen', username });
        advance('address');
      },
      useOwnEmail: () => {
        store.dispatch({ type: 'address-kind-chosen', kind: 'own' });
        navigate('own-email');
      },
      useYahelAddress: () => {
        store.dispatch({ type: 'address-kind-chosen', kind: 'yahel' });
        navigate('address');
      },
      chooseOwnEmail: (email) => {
        store.dispatch({ type: 'own-email-chosen', email });
        advance('own-email');
      },
      choosePassword: (password) => {
        store.dispatch({ type: 'password-chosen', password });
        advance('password');
      },
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
      offers: { passkey: facts.passkeysOffered, business: leaveForBusiness !== null, contact: facts.contactOffered, preferences: capabilities.preferences !== null },
      links,
      requests: {
        passkey: status(requests.passkey),
        create: status(requests.create),
        confirmEmail: status(requests.confirmEmail),
        resendEmailCode: status(requests.resendEmailCode),
        verifyPhone: status(requests.verifyPhone),
        resendPhoneCode: status(requests.resendPhoneCode),
        inviteContact: status(requests.inviteContact),
      },
    },
  };

  return <PersonalFlowContext value={value}>{children}</PersonalFlowContext>;
}
