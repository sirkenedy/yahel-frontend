export { CLIENT_HEADER, createApiClient } from './client';
export type { ApiClient, ApiClientOptions } from './client';
export { ApiError, isApiError } from './errors';
export { isMfaRequired, isPhoneRequired } from './types';
export type { Acknowledgement, AddedDomain, AuthContext, DomainStatus, DomainVerificationRecord, DomainVerified, MemberRole, MemberStatus, Workspace, WorkspaceDomain, WorkspaceMember, AuthTokens, BusinessRegistration, ClientAccount, City, Country, CountryState, RefreshedTokens, LoginResult, MfaRequired, PhoneChallengeSendBody, PhoneChallengeSent, PhoneChallengeVerifyBody, PhoneRequired, PasskeySignInResult, RegisterBusinessBody, PendingRecoveryContact, Profile, ProfilePhoto, RecoveryMethods, Schemas } from './types';
export { accountDirectoryOf, createAccountCapabilities, maskEmail } from './account-capabilities';
export type { StandIns } from './account-capabilities';
export { currentAccountOf, isWorkspaceAdmin, standingOf } from './account-standing';
export type { AccountStanding } from './account-standing';
export type {
  AccountCapabilities,
  AddressAvailability,
  AddressCheck,
  AccountDirectory,
  AccountHelpDesk,
  AdminAccess,
  BillingContact,
  BillingPeriod,
  CardBillingAddress,
  CardDetails,
  CompletedOrder,
  DomainClaims,
  DomainMarket,
  DomainOffer,
  DomainStanding,
  Money,
  OrderQuote,
  OrderRequest,
  PaymentConfirmation,
  PaymentStart,
  PostalAddress,
  PromoCode,
  ScheduledCharge,
  WorkspaceBilling,
  WorkspaceMembership,
  WorkspacePlan,
  PasskeyAssertion,
  PasskeyAssertionOptions,
  PasskeyAttestation,
  PasskeyCeremony,
  PasskeyCreationOptions,
  PasskeyRegistration,
  RecoveryChannels,
  RecoveryMethod,
  RecoveryOption,
  ServiceStatus,
  ServiceWindow,
  SignUpPreferences,
  StandInName,
  TextCodeSender,
  TrustedContacts,
} from './capabilities';
