import type { AccountCapabilities, AccountDirectory, AdminAccess, AccountHelpDesk, AddressAvailability, DomainClaims, DomainMarket, PasskeyCeremony, PasskeyRegistration, RecoveryChannels, ServiceStatus, ServiceWindow, SignUpPreferences, StandInName, TextCodeSender, TrustedContacts, WorkspaceBilling } from './capabilities';
import type { ApiClient } from './client';

/** The stand-in implementations, as `@yahel/api-client/standins` builds them. */
export interface StandIns {
  passkeys: PasskeyCeremony;
  textCodes: TextCodeSender;
  directory: AccountDirectory;
  recoveryByPhone: Pick<RecoveryChannels, 'options' | 'send'>;
  helpDesk: AccountHelpDesk;
  passkeyRegistration: PasskeyRegistration;
  preferences: SignUpPreferences;
  serviceStatus: ServiceStatus;
  domainMarket: DomainMarket;
  domainClaims: DomainClaims;
  workspaceBilling: WorkspaceBilling;
  adminAccess: AdminAccess;
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

const LONGEST_WINDOW = 7 * 24 * 60 * 60 * 1000;

/**
 * A maintenance window as announced, only when it can be shown to people: two real times, the end after
 * the start, not over already and not absurdly far off. Anything else is no window at all.
 */
export const usableWindow = (window: ServiceWindow | null, now: number = Date.now()): ServiceWindow | null => {
  if (!window) return null;
  const from = Date.parse(window.from);
  const until = Date.parse(window.until);
  return Number.isFinite(from) && Number.isFinite(until) && until > from && until > now && until - now <= LONGEST_WINDOW ? window : null;
};

const checked = (status: ServiceStatus): ServiceStatus => ({ window: async () => usableWindow(await status.window()) });

/**
 * The one place that decides what answers each account capability: the real endpoint where the backend
 * has one, otherwise nothing, or a stand-in when stand-ins are passed in (see docs/roadmap.md for the
 * endpoint each one is waiting for).
 */
const trustedContactsOf = (api: Pick<ApiClient, 'me'>): TrustedContacts => ({
  invite: async (email) => {
    await api.me.recovery.updateTrustedContact({ trustedContactEmail: email });
  },
});

const addressesOf = (api: Pick<ApiClient, 'auth'>): AddressAvailability => ({
  check: (name, signal) => api.auth.addressAvailability({ name }, signal),
});

export function createAccountCapabilities(api: Pick<ApiClient, 'auth' | 'me'>, standIns?: StandIns): AccountCapabilities {
  const byEmail = emailRecovery(api);
  const trustedContacts = trustedContactsOf(api);
  const addresses = addressesOf(api);
  if (!standIns) return { passkeys: null, textCodes: null, directory: null, recovery: byEmail, helpDesk: null, passkeyRegistration: null, addresses, trustedContacts, preferences: null, serviceStatus: null, domainMarket: null, domainClaims: null, workspaceBilling: null, adminAccess: null, standIns: [] };

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
    passkeyRegistration: standIns.passkeyRegistration,
    addresses,
    trustedContacts,
    preferences: standIns.preferences,
    serviceStatus: checked(standIns.serviceStatus),
    domainMarket: standIns.domainMarket,
    domainClaims: standIns.domainClaims,
    workspaceBilling: standIns.workspaceBilling,
    adminAccess: standIns.adminAccess,
    standIns: Object.keys(standIns) as StandInName[],
  };
}
