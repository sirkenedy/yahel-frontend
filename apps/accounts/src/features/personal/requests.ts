import { ApiError } from '@yahel/api-client';
import type { AccountCapabilities, Schemas } from '@yahel/api-client';
import type { PasskeyRegistrar, Session } from '@yahel/auth';
import { useFlowRequest } from '../../flow/use-flow-request';
import { internationalNumber } from './countries';
import { describeFailure, hasCode, isRefusal } from './failure';
import type { FailureContext } from './failure';
import { addressOf, fullNameOf } from './machine';
import type { Creation, PersonalState, PersonalStep, Rejection, SetupPart } from './machine';
import type { PersonalStore } from './store';
import { isoBirthDate } from './validation';

export interface PersonalRequestDeps {
  /** Counts the steps shown so far; see `useFlowRequest`. */
  visit: number;
  session: Session;
  capabilities: AccountCapabilities;
  registrar: PasskeyRegistrar | null;
  store: PersonalStore;
  mailDomain: string;
  navigate: (step: PersonalStep, options?: { replace?: boolean }) => void;
  /** Moves on from a step that has been answered. */
  advance: (from: 'passkey') => void;
  /** Waits about as long as a request would. Tests pass one that resolves at once. */
  pause?: () => Promise<void>;
}

const ROUND_TRIP = 600;
const realPause = () => new Promise<void>((resolve) => setTimeout(resolve, ROUND_TRIP));

export type CreateOutcome = 'ready' | 'confirm-email' | 'confirm-phone' | 'rejected';

// The backend takes any text for gender and gives "female" as its example.
const genderForApi = { woman: 'female', man: 'male', another: 'other' } as const;

/** What the design collects, as the backend's register endpoint takes it. */
export const registrationOf = (state: PersonalState, email: string): Schemas['RegisterDto'] => ({
  email,
  firstName: state.firstName,
  lastName: state.lastName,
  // Without a last name the backend would make the display name "Amara " with a trailing space.
  ...(state.lastName ? {} : { displayName: state.firstName }),
  dateOfBirth: state.birth ? isoBirthDate(state.birth) : '',
  password: state.password ?? '',
  ...(state.gender === 'unspecified' ? {} : { gender: genderForApi[state.gender] }),
});

/**
 * Every request the personal flow makes and where each outcome leads. Nothing here renders; the provider
 * turns these into `actions` and `meta.requests`.
 */
export function usePersonalRequests({ visit, session, capabilities, registrar, store, mailDomain, navigate, advance, pause = realPause }: PersonalRequestDeps) {
  const state = () => store.getState();
  const address = () => addressOf(state(), mailDomain);
  const describe = (context: FailureContext) => (error: unknown) => describeFailure(error, context);
  const usesOwnEmail = () => state().addressKind === 'own';

  const passkey = useFlowRequest({
    visit,
    scope: 'flow',
    describe: describe('passkey'),
    run: async () => {
      const result = await (registrar?.create({ address: address(), name: fullNameOf(state()) }) ?? { status: 'cancelled' as const });
      if (result.status !== 'created') return 'cancelled' as const;
      store.dispatch({ type: 'passkey-created', attestation: result.attestation });
      return 'created' as const;
    },
    onDone: (outcome) => {
      if (outcome === 'created') advance('passkey');
    },
  });

  const stage = (next: Creation['stage']) => store.dispatch({ type: 'creation-stage', stage: next });

  const reject = (rejection: Rejection): CreateOutcome => {
    store.dispatch({ type: 'answer-rejected', rejection });
    return 'rejected';
  };

  /**
   * Shows the emailed-code screen. `obtainable` says whether a code exists for a registration that is
   * provably this person's; when it does not, the same screen is shown and nothing is ever asked of the server.
   */
  const awaitEmailCode = (obtainable: boolean): CreateOutcome => {
    store.dispatch({ type: 'email-code-needed', obtainable });
    return 'confirm-email';
  };

  /** Saves one part of the new account, once. A refusal is final and told on the last screen; anything else can be tried again. */
  const settle = async (part: SetupPart, save: (() => Promise<unknown>) | null) => {
    if (!save || state().creation.settled.includes(part)) return;
    try {
      await save();
      store.dispatch({ type: 'setup-settled', part, outcome: 'saved' });
    } catch (error) {
      if (!isRefusal(error)) throw error;
      store.dispatch({ type: 'setup-settled', part, outcome: 'refused' });
    }
  };

  const register = async (): Promise<CreateOutcome | null> => {
    stage('account');
    try {
      await session.api.auth.register(registrationOf(state(), address()));
      store.dispatch({ type: 'account-created' });
    } catch (error) {
      if (hasCode(error, 'USER_UNDERAGE')) return reject({ step: 'birth', reason: 'underage' });
      if (hasCode(error, 'PERSONAL_SIGNUP_REQUIRES_PUBLIC_EMAIL') && usesOwnEmail()) return reject({ step: 'own-email', reason: 'not-personal' });
      if (!hasCode(error, 'EMAIL_ALREADY_EXISTS')) throw error;
      // Possibly this person's own account, from an attempt whose answer was lost. Signing in will tell.
      store.dispatch({ type: 'account-conflicted' });
    }
    return null;
  };

  const signIn = async (): Promise<CreateOutcome | null> => {
    stage('signing-in');
    const { conflicted, emailCode } = state().creation;
    let refused: boolean;
    try {
      // A second step can only belong to an account that existed before, so it is a refusal too.
      refused = !(await session.signIn(address(), state().password ?? '')).ok;
    } catch (error) {
      if (usesOwnEmail() && emailCode !== 'confirmed' && hasCode(error, 'EMAIL_NOT_VERIFIED')) {
        // The backend checks the password before it says this, so the unconfirmed registration is this
        // person's: the one just made, or one of theirs from an earlier visit, which needs a fresh code.
        if (conflicted) await session.api.auth.resendVerification({ email: address() }).catch(() => undefined);
        return awaitEmailCode(true);
      }
      if (!conflicted || !hasCode(error, 'INVALID_CREDENTIALS')) throw error;
      refused = true;
    }
    if (!refused) {
      store.dispatch({ type: 'signed-in' });
      return null;
    }
    if (!usesOwnEmail()) return reject({ step: 'address', reason: 'taken' });
    // The address has a registration or an account under another password. It may be someone else's,
    // made to be switched on by this person's code, so no code is asked for and none will be submitted.
    // The screen is the same one; the way forward for the real owner is to sign in or reset the password.
    return awaitEmailCode(false);
  };

  /** Stages the recovery phone, which texts it a code. It is settled later, when the code is entered or skipped. */
  const sendPhoneCode = async () => {
    const { recovery, creation } = state();
    if (!recovery.phone || creation.phoneCodeAwaited || creation.settled.includes('phone')) return;
    try {
      await session.api.me.recovery.updatePhone({ phone: internationalNumber(recovery.country, recovery.phone) });
      store.dispatch({ type: 'phone-code-sent' });
    } catch (error) {
      if (!isRefusal(error)) throw error;
      store.dispatch({ type: 'setup-settled', part: 'phone', outcome: 'refused' });
    }
  };

  const setUp = async (): Promise<CreateOutcome> => {
    stage('finishing');
    const { recovery, preferences, passkey: attestation } = state();
    const wantsPreferences = preferences.productNews || preferences.activityHistory;
    await settle('recoveryEmail', recovery.email ? () => session.api.me.recovery.updateEmail({ recoveryEmail: recovery.email }) : null);
    await settle('preferences', capabilities.preferences && wantsPreferences ? () => capabilities.preferences!.save(preferences) : null);
    await settle('passkey', attestation && registrar ? () => registrar.save(attestation) : null);
    await sendPhoneCode();
    if (state().creation.phoneCodeAwaited) return 'confirm-phone';
    store.dispatch({ type: 'creation-finished' });
    return 'ready';
  };

  /**
   * Creates the account and sets it up, in order, recording each part as it is done. Started again after
   * a failure or after a code has been entered, it skips what is recorded, so the account is created once.
   */
  const create = useFlowRequest({
    visit,
    scope: 'flow',
    describe: describe('create'),
    run: async (): Promise<CreateOutcome> => {
      const { created, conflicted, signedIn } = state().creation;
      const stopped = (created || conflicted ? null : await register()) ?? (signedIn ? null : await signIn());
      return stopped ?? setUp();
    },
    onDone: (outcome) => {
      if (outcome === 'ready') navigate('ready', { replace: true });
      if (outcome === 'confirm-email') navigate('own-code', { replace: true });
      if (outcome === 'confirm-phone') navigate('code', { replace: true });
      if (outcome === 'rejected') navigate(state().rejection?.step ?? 'review', { replace: true });
    },
  });

  const confirmEmail = useFlowRequest({
    visit,
    describe: describe('code'),
    run: async (code: string) => {
      if (state().creation.emailCode !== 'awaited') {
        // No code was sent, so none can be right, and one from someone else's registration must not be used.
        await pause();
        throw new ApiError({ status: 401, code: 'INVALID_TOKEN', message: 'No code was issued for this visit' });
      }
      await session.api.auth.verifyEmail({ email: address(), token: code });
      store.dispatch({ type: 'email-confirmed' });
    },
    onDone: () => {
      create.start();
      navigate('creating', { replace: true });
    },
  });

  const resendEmailCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      // Asked for only where a code may be used; otherwise the screen answers the same way and sends nothing.
      if (state().creation.emailCode === 'awaited') await session.api.auth.resendVerification({ email: address() });
      else await pause();
      return 'sent' as const;
    },
  });

  const finish = () => {
    store.dispatch({ type: 'creation-finished' });
    navigate('ready', { replace: true });
  };

  const verifyPhone = useFlowRequest({
    visit,
    describe: describe('code'),
    run: async (code: string) => {
      await session.api.me.recovery.verifyPhone({ code });
      store.dispatch({ type: 'setup-settled', part: 'phone', outcome: 'saved' });
    },
    onDone: finish,
  });

  const resendPhoneCode = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async () => {
      const { country, phone } = state().recovery;
      await session.api.me.recovery.updatePhone({ phone: internationalNumber(country, phone) });
      return 'sent' as const;
    },
  });

  const inviteContact = useFlowRequest({
    visit,
    describe: describe('other'),
    run: async (email: string) => {
      if (!capabilities.trustedContacts) throw new Error('Trusted contacts are not offered');
      await capabilities.trustedContacts.invite(email);
      store.dispatch({ type: 'contact-invited', email });
    },
    onDone: () => navigate('ready', { replace: true }),
  });

  /** Leaves the phone unconfirmed; the last screen says so. */
  const skipPhone = () => {
    store.dispatch({ type: 'setup-settled', part: 'phone', outcome: 'skipped' });
    finish();
  };

  return { passkey, create, confirmEmail, resendEmailCode, verifyPhone, resendPhoneCode, inviteContact, skipPhone };
}

export type PersonalRequests = ReturnType<typeof usePersonalRequests>;
