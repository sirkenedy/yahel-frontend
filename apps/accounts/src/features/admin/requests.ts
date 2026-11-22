import type { QueryClient } from '@tanstack/react-query';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { internationalNumber } from '../../flow/countries';
import { confirmAndSignIn, resendConfirmation, signInOrConfirm } from '../../flow/email-confirmation';
import type { ConfirmedSignIn } from '../../flow/email-confirmation';
import { flowMessages as shared } from '../../flow/messages';
import { say } from '../../flow/toasts';
import { useFlowRequest } from '../../flow/use-flow-request';
import { describeAdminFailure } from './feedback';
import type { FailureContext } from './feedback';
import type { AdminStep } from './machine';
import { adminMessages as m } from './messages';
import type { AdminStore } from './store';

export interface AdminRequestDeps {
  /** Counts the steps shown so far; see `useFlowRequest`. */
  visit: number;
  session: Session;
  registrar: PasskeyRegistrar | null;
  store: AdminStore;
  queryClient: QueryClient;
  navigate: (step: AdminStep, options?: { replace?: boolean }) => void;
  /** The address bar shows this step, even while a navigation away from it is still loading. */
  isShown: (step: AdminStep) => boolean;
}

export interface PhoneNumber {
  country: string;
  number: string;
}

/**
 * Every request an administrator's first sign-in makes and where each outcome leads. Nothing here renders;
 * the provider turns these into `actions` and `meta.requests`. After signing in, where to go is the step
 * guards' to say: the flow asks for the phone and the guards move on past what is already done.
 */
export function useAdminRequests({ visit, session, registrar, store, queryClient, navigate, isShown }: AdminRequestDeps) {
  const email = () => store.getState().email ?? '';
  /** Whose account it is once signed in: the session's, which outlives a reload, before the flow's own record. */
  const account = () => session.store.getState().profile ?? null;
  const describe = (context: FailureContext) => (error: unknown) => describeAdminFailure(error, context);

  /** The plain outcome of a sign-in, with the flow told what it needs. Nothing about a second step is kept: this flow cannot take one. */
  const settle = (result: ConfirmedSignIn) => {
    if (result.ok) {
      store.dispatch({ type: 'signed-in' });
      return 'signed-in' as const;
    }
    store.dispatch({ type: result.reason === 'mfa-required' ? 'second-step-required' : 'email-confirmed' });
    return 'back-to-sign-in' as const;
  };

  const password = useFlowRequest({
    visit,
    describe: describe('password'),
    run: async ({ address, password: value }: { address: string; password: string }, { isCurrent }) => {
      store.dispatch({ type: 'email-entered', email: address });
      const result = await signInOrConfirm(session, email(), value);
      if (result.ok || result.reason === 'mfa-required') return settle(result);
      // The proof is held only for the confirm step, and only if the person is still where they asked for it:
      // not left, and not on the way somewhere else while that page loads.
      if (!isCurrent() || !isShown('signin')) return 'left' as const;
      store.dispatch({ type: 'email-unconfirmed', password: value });
      return 'confirm-email' as const;
    },
    onDone: (outcome) => {
      if (outcome === 'signed-in') navigate('phone', { replace: true });
      if (outcome === 'confirm-email') navigate('confirm-email');
    },
  });

  const confirmEmail = useFlowRequest({
    visit,
    describe: describe('code'),
    run: async (code: string) => settle(await confirmAndSignIn(session, email(), code, store.getState().provenPassword, () => store.dispatch({ type: 'email-confirmed' }))),
    onDone: (outcome) => navigate(outcome === 'signed-in' ? 'phone' : 'signin', { replace: true }),
  });

  const resendEmailCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: () => resendConfirmation(session, email(), store.getState().provenPassword),
    onDone: () => say(shared.newCodeSent),
  });

  const textPhone = ({ country, number }: PhoneNumber) => session.api.me.recovery.updatePhone({ phone: internationalNumber(country, number) });

  const sendPhoneCode = useFlowRequest({
    visit,
    describe: describe('phone'),
    run: async (phone: PhoneNumber) => {
      await textPhone(phone);
      store.dispatch({ type: 'phone-code-sent', ...phone });
    },
    onDone: () => navigate('code'),
  });

  const resendPhoneCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      const phone = store.getState().phone;
      if (!phone) throw new Error('No number has been given');
      await textPhone(phone);
    },
    onDone: () => say(shared.newCodeSent),
  });

  const verifyPhone = useFlowRequest({
    visit,
    describe: describe('code'),
    run: async (code: string) => {
      await session.api.me.recovery.verifyPhone({ code });
      store.dispatch({ type: 'phone-verified' });
    },
    onDone: () => navigate('welcome', { replace: true }),
  });

  /** Makes the passkey on the device and saves it to the account at once: the administrator is already signed in. */
  const passkey = useFlowRequest({
    visit,
    scope: 'flow',
    describe: describe('passkey'),
    run: async () => {
      const who = account();
      if (!registrar || !who) throw new Error('A passkey cannot be made here');
      const made = await registrar.create({ address: who.email, name: who.displayName?.trim() || who.email });
      if (made.status !== 'created') return 'cancelled' as const;
      await registrar.save(made.attestation);
      store.dispatch({ type: 'passkey-saved' });
      return 'saved' as const;
    },
    onDone: (outcome) => {
      if (outcome !== 'saved') return;
      say(m.passkeySaved);
      navigate('add-passkey', { replace: true });
    },
  });

  const signOut = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      // Signing out here always succeeds; a failed server call must not keep the person signed in on this device.
      await session.signOut().catch(() => undefined);
    },
    onDone: () => {
      store.dispatch({ type: 'reset' });
      queryClient.clear();
      navigate('signin', { replace: true });
    },
  });

  return { password, confirmEmail, resendEmailCode, sendPhoneCode, resendPhoneCode, verifyPhone, passkey, signOut };
}

export type AdminRequests = ReturnType<typeof useAdminRequests>;
