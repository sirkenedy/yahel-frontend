import { useQuery } from '@tanstack/react-query';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import type { FlowDirection } from '@yahel/ui';
import { createContext, use } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import type { ScreenFacts } from '../../flow/step-frame';
import { requestStatus as status } from '../../flow/use-flow-request';
import type { FlowRequest } from '../../flow/use-flow-request';
import { useStepTravel } from '../../flow/use-step-travel';
import type { AdminField, AdminNext } from './feedback';
import { backOf, directionOf, hasPasskey, stepPath } from './machine';
import type { AdminFacts, AdminState, AdminStep, PhoneNumber } from './machine';
import { passkeyChallengeQuery } from './queries';
import { useAdminRequests } from './requests';
import type { AdminRequests } from './requests';
import type { AdminStore } from './store';

export interface AdminLinks {
  /** Where Admin itself is: the only way out of the flow once it is done. */
  admin: string;
  /** Workspace sign-up's plan, where the welcome leads when sign-up continues there. */
  plan: string;
  signIn: string;
  resetPassword: string;
  help: string | null;
  businessTerms: string | null;
  privacy: string | null;
}

export interface AdminFlowValue {
  /** The flow state, without the phone challenge: no step is ever handed it. */
  state: Omit<AdminState, 'challengeToken'> & {
    step: AdminStep;
    /** The address signed in to, or being signed in to. */
    address: string | null;
    domain: string | null;
    /** The organisation's name, or `null` when nothing has said it. */
    organisation: string | null;
    hasPasskey: boolean;
    passkeyCancelled: boolean;
    /** The last press found no challenge ready, so no prompt opened. */
    passkeyUnprepared: boolean;
  };
  actions: {
    sendPhoneCode: (phone: PhoneNumber) => void;
    resendPhoneCode: () => void;
    verifyPhone: (code: string) => void;
    understand: () => void;
    /** Must be called from a press handler: the browser shows the passkey prompt only for a user action. */
    startPasskey: () => void;
    /** Opens Admin, with or without a passkey: one is recommended, not required (F-98). */
    openAdmin: () => void;
  };
  meta: {
    direction: FlowDirection;
    backHref: string | null;
    /** This device can make a passkey. */
    passkeySupported: boolean;
    /** The challenge the passkey prompt needs is still being fetched: pressing now would open nothing. */
    passkeyPreparing: boolean;
    links: AdminLinks;
    requests: Record<keyof AdminRequests, FlowRequest<AdminField, AdminNext>>;
    screens: ScreenFacts;
  };
}

export const AdminFlowContext = createContext<AdminFlowValue | null>(null);

export const useAdminFlow = () => {
  const value = use(AdminFlowContext);
  if (!value) throw new Error('Admin steps must be rendered inside <AdminFlowProvider>.');
  return value;
};

export interface AdminFlowProviderProps {
  step: AdminStep;
  session: Session;
  registrar: PasskeyRegistrar | null;
  store: AdminStore;
  facts: AdminFacts;
  /** What the server named the organisation, when it has. */
  organisation: string | null;
  links: AdminLinks;
  navigate: (step: AdminStep, options?: { replace?: boolean }) => void;
  /** Goes to an address of this app outside the flow: sign-in, or workspace sign-up's plan. */
  goTo: (href: string) => void;
  /** Sends the browser to Admin. */
  leave: () => void;
  children: ReactNode;
}

/**
 * Gives the admin steps one thing to read: `{ state, actions, meta }`. The state comes from the store
 * (`machine.ts`), the requests from `requests.ts`; this component only joins them.
 */
export function AdminFlowProvider({ step, session, registrar, store, facts, organisation, links, navigate, goTo, leave, children }: AdminFlowProviderProps) {
  const { challengeToken, ...flow } = useStore(store);
  const profile = useStore(session.store, (snapshot) => snapshot.profile);
  const passkeySupported = registrar?.isSupported() ?? false;
  // Fetched before the press so the browser's prompt can open inside it.
  const challenge = useQuery({ ...passkeyChallengeQuery(registrar), enabled: passkeySupported && step === 'add-passkey' });

  const travel = useStepTravel(step, directionOf);
  const requests = useAdminRequests({ visit: travel.visit, session, registrar, store, navigate });
  const back = backOf(step);
  const address = profile?.email ?? flow.email;
  const whole = { ...flow, challengeToken };
  const passkeyDone = hasPasskey(whole, facts);

  const value: AdminFlowValue = {
    state: {
      ...flow,
      step,
      address,
      domain: address?.split('@')[1] ?? null,
      // What the person named their business moments ago, for the address it was made with; otherwise what the server says.
      organisation: flow.handedOver && flow.email === address ? flow.organisation : organisation,
      hasPasskey: passkeyDone,
      passkeyCancelled: requests.passkey.outcome === 'cancelled',
      passkeyUnprepared: requests.passkey.outcome === 'unprepared',
    },
    actions: {
      sendPhoneCode: requests.sendPhoneCode.start,
      resendPhoneCode: requests.resendPhoneCode.start,
      verifyPhone: requests.verifyPhone.start,
      understand: () => {
        store.dispatch({ type: 'welcomed' });
        // Workspace sign-up goes on to the plan and checkout, and comes back for the passkey once paid.
        if (store.getState().continueToPlan) goTo(links.plan);
        else navigate('add-passkey');
      },
      startPasskey: () => {
        if (!requests.passkey.start()) return;
        store.dispatch({ type: 'passkey-started' });
        navigate('passkey');
      },
      openAdmin: leave,
    },
    meta: {
      direction: travel.direction,
      backHref: back ? stepPath(back) : null,
      passkeySupported,
      passkeyPreparing: challenge.isFetching,
      links,
      requests: {
        sendPhoneCode: status(requests.sendPhoneCode),
        resendPhoneCode: status(requests.resendPhoneCode, requests.resendPhoneCode.start),
        verifyPhone: status(requests.verifyPhone),
        passkey: status(requests.passkey, requests.passkey.start),
      },
      screens: {
        account: address,
        exits: { signIn: links.signIn, resetPassword: links.resetPassword, support: links.help },
      },
    },
  };

  return <AdminFlowContext value={value}>{children}</AdminFlowContext>;
}
