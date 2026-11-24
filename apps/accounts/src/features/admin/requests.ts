import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { internationalNumber } from '../../flow/countries';
import { hasCode } from '../../flow/feedback';
import { flowMessages as shared } from '../../flow/messages';
import { say } from '../../flow/toasts';
import { useFlowRequest } from '../../flow/use-flow-request';
import { describeAdminFailure } from './feedback';
import type { FailureContext } from './feedback';
import type { AdminStep, PhoneNumber } from './machine';
import { adminMessages as m } from './messages';
import type { AdminStore } from './store';

export interface AdminRequestDeps {
  /** Counts the steps shown so far; see `useFlowRequest`. */
  visit: number;
  session: Session;
  registrar: PasskeyRegistrar | null;
  store: AdminStore;
  navigate: (step: AdminStep, options?: { replace?: boolean }) => void;
}

/**
 * Every request an administrator's first steps make and where each outcome leads. Nothing here renders; the
 * provider turns these into `actions` and `meta.requests`. Before the session exists the phone is checked
 * through the challenge registration or sign-in answered with, and checking its code is what signs in; an
 * administrator already signed in whose phone is unconfirmed confirms it on the account instead.
 */
export function useAdminRequests({ visit, session, registrar, store, navigate }: AdminRequestDeps) {
  /** Whose account it is once signed in: the session's, which outlives a reload, before the flow's own record. */
  const account = () => session.store.getState().profile ?? null;
  const describe = (context: FailureContext) => (error: unknown) => describeAdminFailure(error, context);
  const challenge = () => store.getState().challengeToken;

  const textPhone = async ({ country, number }: PhoneNumber) => {
    const phone = internationalNumber(country, number);
    const token = challenge();
    if (token) await session.sendPhoneCheck(token, phone);
    else await session.api.me.recovery.updatePhone({ phone });
  };

  /** A challenge that can no longer be met is gone for good: the person signs in again for a new one. */
  const loseChallengeOn = (...codes: string[]) => (error: unknown) => {
    if (challenge() && hasCode(error, ...codes)) store.dispatch({ type: 'challenge-lost' });
  };

  const sendPhoneCode = useFlowRequest({
    visit,
    describe: describe('phone'),
    run: async (phone: PhoneNumber) => {
      await textPhone(phone);
      store.dispatch({ type: 'phone-code-sent', ...phone });
    },
    onDone: () => navigate('code'),
    // Before a code is sent, a refused challenge can only be one that has expired or been used.
    onFailed: loseChallengeOn('INVALID_TOKEN'),
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
      const token = challenge();
      // Meeting the challenge is what signs the administrator in.
      if (token) await session.completePhoneCheck(token, code);
      else await session.api.me.recovery.verifyPhone({ code });
      store.dispatch({ type: 'phone-verified' });
    },
    onDone: () => navigate('welcome', { replace: true }),
    onFailed: loseChallengeOn('TOKEN_MAX_ATTEMPTS'),
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
      if (made.status !== 'created') return made.status;
      await registrar.save(made);
      store.dispatch({ type: 'passkey-saved' });
      return 'saved' as const;
    },
    onDone: (outcome) => {
      if (outcome !== 'saved') return;
      say(m.passkeySaved);
      navigate('add-passkey', { replace: true });
    },
  });

  return { sendPhoneCode, resendPhoneCode, verifyPhone, passkey };
}

export type AdminRequests = ReturnType<typeof useAdminRequests>;
