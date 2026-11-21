import type { AccountCapabilities, AccountDirectory, AccountHelpDesk, PasskeyCeremony, RecoveryChannels, StandInName, TextCodeSender } from './capabilities';
import type { ApiClient } from './client';

/** The stand-in implementations, as `@yahel/api-client/standins` builds them. */
export interface StandIns {
  passkeys: PasskeyCeremony;
  textCodes: TextCodeSender;
  directory: AccountDirectory;
  recoveryByPhone: Pick<RecoveryChannels, 'options' | 'send'>;
  helpDesk: AccountHelpDesk;
}

/** `amara@northwind.example` becomes `a•••@northwind.example`: derived from what was typed, so it reveals nothing. */
export const maskEmail = (email: string) => {
  const [local = '', domain = ''] = email.trim().split('@');
  return `${local.charAt(0)}•••@${domain}`;
};

const emailRecovery = (api: Pick<ApiClient, 'auth'>): RecoveryChannels => ({
  options: async (email) => [{ method: 'email', destination: maskEmail(email) }],
  send: async (email) => {
    await api.auth.forgotPassword({ email });
  },
});

/**
 * The one place that decides what answers each account capability: the real endpoint where the backend
 * has one, otherwise nothing, or a stand-in when stand-ins are passed in (see docs/roadmap.md for the
 * endpoint each one is waiting for).
 */
export function createAccountCapabilities(api: Pick<ApiClient, 'auth'>, standIns?: StandIns): AccountCapabilities {
  const byEmail = emailRecovery(api);
  if (!standIns) return { passkeys: null, textCodes: null, directory: null, recovery: byEmail, helpDesk: null, standIns: [] };

  const recovery: RecoveryChannels = {
    options: async (email) => [...(await standIns.recoveryByPhone.options(email)), ...(await byEmail.options(email))],
    send: (email, method) => (method === 'phone' ? standIns.recoveryByPhone.send(email, method) : byEmail.send(email, method)),
  };
  return {
    passkeys: standIns.passkeys,
    textCodes: standIns.textCodes,
    directory: standIns.directory,
    recovery,
    helpDesk: standIns.helpDesk,
    standIns: Object.keys(standIns) as StandInName[],
  };
}
