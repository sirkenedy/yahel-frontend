import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@yahel/api-client';
import { forgetAccountData } from '@yahel/auth';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { isSignedInAs } from '../../flow/accounts';
import { countriesQuery, countryOf, internationalNumber } from '../../flow/countries';
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
 * administrator already signed in whose phone is unconfirmed confirms it on the account instead. Another account
 * signed in to this tab is never touched (F-109): without a challenge the check is lost, and the person signs in again.
 */
export function useAdminRequests({ visit, session, registrar, store, navigate }: AdminRequestDeps) {
  const queryClient = useQueryClient();
  /** Whose account it is once signed in: the session's, which outlives a reload, before the flow's own record. */
  const account = () => session.store.getState().profile ?? null;
  const describe = (context: FailureContext) => (error: unknown) => describeAdminFailure(error, context);
  const challenge = () => store.getState().challengeToken;

  /** With no challenge, the account's own recovery phone is used, and only while this tab is signed in as the administrator. */
  const ownAccount = (code: 'INVALID_TOKEN' | 'TOKEN_MAX_ATTEMPTS') => {
    if (isSignedInAs(session.store.getState(), store.getState().email)) return session.api.me.recovery;
    store.dispatch({ type: 'challenge-lost' });
    throw new ApiError({ status: 401, code, message: 'No phone check is waiting for this account' });
  };

  /** The recovery phone takes no `countryCode`, so it is given the number in international form. */
  const textPhone = async ({ country, number }: PhoneNumber) => {
    const token = challenge();
    if (token) await session.sendPhoneCheck(token, { phone: number, countryCode: country });
    else await ownAccount('INVALID_TOKEN').updatePhone({ phone: internationalNumber(countryOf(await queryClient.ensureQueryData(countriesQuery), country), number) });
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
      // Meeting the challenge is what signs the administrator in: a new account in this tab, so nothing the last one
      // cached may be seen, and the account list is read again (the one before moves to "Other accounts").
      if (token) {
        await session.completePhoneCheck(token, code);
        forgetAccountData(queryClient);
      } else await ownAccount('TOKEN_MAX_ATTEMPTS').verifyPhone({ code });
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
