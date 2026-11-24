import type { AccountCapabilities, AccountDirectory, AdminAccess, AccountHelpDesk, AddressAvailability, DomainClaims, DomainMarket, PasskeyCeremony, PasskeyRegistration, RecoveryChannels, ServiceStatus, ServiceWindow, SignUpPreferences, StandInName, TextCodeSender, TrustedContacts, WorkspaceBilling } from './capabilities';
import type { ApiClient } from './client';

/** The stand-in implementations, as `@yahel/api-client/standins` builds them. */
export interface StandIns {
  textCodes: TextCodeSender;
  recoveryByPhone: Pick<RecoveryChannels, 'options' | 'send'>;
  helpDesk: AccountHelpDesk;
  preferences: SignUpPreferences;
  serviceStatus: ServiceStatus;
  domainMarket: DomainMarket;
  workspaceBilling: WorkspaceBilling;
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

/** The account chooser, on `GET /auth/accounts` and `DELETE /auth/accounts/{handle}`. */
export const accountDirectoryOf = (api: Pick<ApiClient, 'auth'>): AccountDirectory => ({
  list: (signal) => api.auth.accounts(signal),
  remove: async (handle) => {
    await api.auth.removeAccount(handle);
  },
});

const addressesOf = (api: Pick<ApiClient, 'auth'>): AddressAvailability => ({
  check: (name, signal) => api.auth.addressAvailability({ name }, signal),
});

const domainClaimsOf = (api: Pick<ApiClient, 'tenants'>): DomainClaims => ({
  check: async (domain) => (await api.tenants.checkDomainClaim({ domain })).standing,
});

/**
 * Passkey sign-in through `/auth/passkey/authenticate/*`. The server's options are those of `@simplewebauthn/server`,
 * and it verifies an `AuthenticationResponseJSON`: `id` and `rawId` the same base64url text.
 */
export const passkeySignInOf = (api: Pick<ApiClient, 'auth'>): PasskeyCeremony => ({
  async begin({ email }) {
    const { options, challengeToken } = await api.auth.passkeys.authenticateBegin(email ? { email } : {});
    return {
      challengeToken,
      challenge: options.challenge,
      rpId: options.rpId,
      timeoutMs: options.timeout ?? 60_000,
      allowCredentials: (options.allowCredentials ?? []).map(({ id }) => ({ id })),
      userVerification: options.userVerification === 'required' ? 'required' : 'preferred',
    };
  },
  finish: (challengeToken, assertion) =>
    api.auth.passkeys.authenticateFinish({
      challengeToken,
      response: {
        id: assertion.credentialId,
        rawId: assertion.credentialId,
        type: 'public-key',
        response: { clientDataJSON: assertion.clientDataJSON, authenticatorData: assertion.authenticatorData, signature: assertion.signature, ...(assertion.userHandle ? { userHandle: assertion.userHandle } : {}) },
        clientExtensionResults: {},
      },
    }),
});

/** Passkey creation for the signed-in account through `/auth/passkey/register/*`; the server verifies a `RegistrationResponseJSON`. */
export const passkeyRegistrationOf = (api: Pick<ApiClient, 'auth'>): PasskeyRegistration => ({
  async beginForAccount() {
    const { options, challengeToken } = await api.auth.passkeys.registerBegin();
    return {
      challengeToken,
      challenge: options.challenge,
      rp: options.rp,
      userHandle: options.user.id,
      timeoutMs: options.timeout ?? 60_000,
      algorithms: options.pubKeyCredParams.map(({ alg }) => alg),
      excludeCredentials: (options.excludeCredentials ?? []).map(({ id }) => id),
    };
  },
  async finish(challengeToken, attestation) {
    await api.auth.passkeys.registerFinish({
      challengeToken,
      response: {
        id: attestation.credentialId,
        rawId: attestation.credentialId,
        type: 'public-key',
        response: { clientDataJSON: attestation.clientDataJSON, attestationObject: attestation.attestationObject, transports: attestation.transports },
        clientExtensionResults: {},
      },
    });
  },
});

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

/**
 * The session's workspace from its contexts, and whether the account has a passkey from its list.
 * `passkeyRequired` stays false until the server enforces "Admins must use a passkey" (F-86).
 */
export const adminAccessOf = (api: Pick<ApiClient, 'auth'>): AdminAccess => ({
  async membership() {
    const [contexts, passkeys] = await Promise.all([api.auth.contexts(), api.auth.passkeys.list()]);
    const workspace = contexts.find((context) => context.isCurrent && context.type === 'tenant');
    if (!workspace) return null;
    return { organisation: workspace.displayName, administrator: workspace.role !== null && ADMIN_ROLES.has(workspace.role), hasPasskey: passkeys.length > 0, passkeyRequired: false };
  },
});

export function createAccountCapabilities(api: Pick<ApiClient, 'auth' | 'me' | 'tenants'>, standIns?: StandIns): AccountCapabilities {
  const byEmail = emailRecovery(api);
  const trustedContacts = trustedContactsOf(api);
  const addresses = addressesOf(api);
  const directory = accountDirectoryOf(api);
  const domainClaims = domainClaimsOf(api);
  const adminAccess = adminAccessOf(api);
  const passkeys = passkeySignInOf(api);
  const passkeyRegistration = passkeyRegistrationOf(api);
  if (!standIns) return { passkeys, textCodes: null, directory, recovery: byEmail, helpDesk: null, passkeyRegistration, addresses, trustedContacts, preferences: null, serviceStatus: null, domainMarket: null, domainClaims, workspaceBilling: null, adminAccess, standIns: [] };

  const recovery: RecoveryChannels = {
    options: async (email) => [...(await standIns.recoveryByPhone.options(email)), ...(await byEmail.options(email))],
    send: (email, method) => (method === 'phone' ? standIns.recoveryByPhone.send(email, method) : byEmail.send(email, method)),
  };
  return {
    passkeys,
    textCodes: standIns.textCodes,
    directory,
    recovery,
    helpDesk: standIns.helpDesk,
    passkeyRegistration,
    addresses,
    trustedContacts,
    preferences: standIns.preferences,
    serviceStatus: checked(standIns.serviceStatus),
    domainMarket: standIns.domainMarket,
    domainClaims,
    workspaceBilling: standIns.workspaceBilling,
    adminAccess,
    standIns: Object.keys(standIns) as StandInName[],
  };
}
