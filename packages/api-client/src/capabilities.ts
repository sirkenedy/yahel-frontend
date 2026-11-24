import type { AuthTokens, ClientAccount, Profile } from './types';

// Things the account flows need that the backend may not offer yet. Each is a small interface so the
// interface code never knows whether a real endpoint or a stand-in is answering. See account-capabilities.ts.

/** A signed-in session as a sign-in method other than the password endpoint would return it. */
export interface SignedIn {
  tokens: AuthTokens;
  profile: Profile;
}

/** What the server asks the device to sign. Binary values are base64url text. */
export interface PasskeyAssertionOptions {
  challenge: string;
  rpId: string;
  timeoutMs: number;
  /** Empty lets the device offer any passkey it holds for this site. */
  allowCredentials: { id: string }[];
  userVerification: 'required' | 'preferred';
}

/** The device's answer. Binary values are base64url text. */
export interface PasskeyAssertion {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string | null;
}

/**
 * The server half of signing in with a passkey. A real server uses its own relying-party id and ignores
 * the one passed here, which exists for the stand-in; see docs/roadmap.md, "What each real endpoint must do".
 */
export interface PasskeyCeremony {
  begin(input: { email?: string; rpId: string }): Promise<PasskeyAssertionOptions>;
  finish(assertion: PasskeyAssertion): Promise<SignedIn>;
}

/** Sends the second-step code by text message instead of an authenticator app. */
export interface TextCodeSender {
  /** Resolves with the masked number the code went to. */
  send(challengeToken: string): Promise<{ destination: string }>;
}

/** The accounts this browser has used, for the account chooser. The server keeps the list against the browser's own cookie. */
export interface AccountDirectory {
  list(signal?: AbortSignal): Promise<ClientAccount[]>;
  /** Removes an account from this browser by its handle. Idempotent. */
  remove(handle: string): Promise<void>;
}

export type RecoveryMethod = 'email' | 'phone';

export interface RecoveryOption {
  method: RecoveryMethod;
  /** Masked: enough to recognise, not enough to learn. */
  destination: string;
}

/** Where a password-reset code can be sent, and sending it. */
export interface RecoveryChannels {
  /** Must answer the same way, in shape and in time, whether or not the address has an account. */
  options(email: string): Promise<RecoveryOption[]>;
  send(email: string, method: RecoveryMethod): Promise<void>;
}

/** Takes a request from someone who cannot tell us which account is theirs. */
export interface AccountHelpDesk {
  request(input: { contact: string }): Promise<void>;
}

/** What the server asks the device to create. Binary values are base64url text. */
export interface PasskeyCreationOptions {
  challenge: string;
  rp: { id: string; name: string };
  /** A random handle for the account-to-be, or the signed-in account's own. It says nothing about the person. */
  userHandle: string;
  timeoutMs: number;
  /** COSE algorithm identifiers the server accepts, most preferred first. */
  algorithms: number[];
  /** The account's passkeys already made, so a device does not make a second; only for a signed-in account. */
  excludeCredentials?: string[];
}

/** The new passkey's public half, as the device describes it. Binary values are base64url text. */
export interface PasskeyAttestation {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  transports: string[];
}

/**
 * The server half of creating a passkey. `begin` runs during sign-up, before the account exists, so it
 * takes and reveals nothing about a person; `beginForAccount` is for someone already signed in, and the
 * server binds its challenge to the session. `finish` runs once they are signed in and attaches the
 * passkey to the account. See docs/roadmap.md, "What each real endpoint must do".
 */
export interface PasskeyRegistration {
  begin(input: { rpId: string }): Promise<PasskeyCreationOptions>;
  beginForAccount(input: { rpId: string }): Promise<PasskeyCreationOptions>;
  finish(attestation: PasskeyAttestation): Promise<void>;
}

export interface AddressCheck {
  /** Only ever "available" or not: never why, and never whose it is. */
  available: boolean;
  /** Free addresses close to the one asked about. */
  alternatives: string[];
}

/** Whether a Yahel address (the part before the @) can still be had. */
export interface AddressAvailability {
  check(name: string, signal?: AbortSignal): Promise<AddressCheck>;
}

/** Someone the person trusts to vouch for them if every other way back in is lost. Needs a session. */
export interface TrustedContacts {
  /** Answers the same way whether or not the invited address has a Yahel account. */
  invite(email: string): Promise<void>;
}

/** The two choices on the review screen. Both are off unless the person turns them on. Needs a session. */
export interface SignUpPreferences {
  save(choices: { productNews: boolean; activityHistory: boolean }): Promise<void>;
}

/** A planned interruption, as the server announces it. Times are ISO 8601. */
export interface ServiceWindow {
  from: string;
  until: string;
}

/** What the service says about itself while it cannot answer, so the wait can be given an end. */
export interface ServiceStatus {
  /** The maintenance window in progress, or `null` when none is announced. */
  window(): Promise<ServiceWindow | null>;
}

/** An amount of money in the currency's smallest unit (kobo for naira), so nothing is ever a fraction. */
export interface Money {
  amount: number;
  /** ISO 4217. */
  currency: string;
}

/** A domain that can be registered now, and what it costs a year. */
export interface DomainOffer {
  domain: string;
  yearly: Money;
  /** The one closest to what was asked for. */
  bestMatch: boolean;
}

/** Finding a domain to buy. Buying it happens with the workspace order. */
export interface DomainMarket {
  /** Domains like the words asked about that can be registered now; empty when none can. */
  search(query: string, signal?: AbortSignal): Promise<DomainOffer[]>;
}

/** `claimed`: a workspace already holds it. `public`: it belongs to an email provider, so no business can claim it. */
export type DomainStanding = 'free' | 'claimed' | 'public';

/** Whether a domain a business says it owns can be claimed by a new workspace. Advice: creating the workspace decides. */
export interface DomainClaims {
  check(domain: string): Promise<DomainStanding>;
}

export type BillingPeriod = 'monthly' | 'yearly';

/** The plan a new workspace starts on, as the server sells it in one country. */
export interface WorkspacePlan {
  id: string;
  name: string;
  features: readonly string[];
  /** What one person costs a month, when billed each way. */
  seatPrice: Record<BillingPeriod, Money>;
  /** What paying by the year saves, in percent. */
  yearlySaving: number;
  /** The free trial: how long, and the largest team that gets one. */
  trial: { days: number; maxSeats: number };
  /** Tax that is added to every price, in percent. */
  taxRate: number;
  /** From this many people, the plan is arranged in conversation instead. */
  enterpriseFrom: number;
}

export interface PromoCode {
  code: string;
  percent: number;
  months: number;
}

/** What is being ordered. `domain` is one bought here, or `null` for a domain the business already owns. */
export interface OrderRequest {
  planId: string;
  period: BillingPeriod;
  seats: number;
  promoCode: string | null;
  domain: string | null;
}

/**
 * One line of what will be charged and when. `trial`: the free trial starts. `first-period`: the first
 * month or year, taken today. `discount`: months at a reduced price. `plan`: the regular price.
 * `renewal`: a yearly plan renewing.
 */
export interface ScheduledCharge {
  /** The day it starts, as an ISO date; `null` for today. */
  from: string | null;
  kind: 'trial' | 'first-period' | 'discount' | 'plan' | 'renewal';
  amount: Money;
  /** What the amount is for each of; `null` for a single charge. */
  per: 'month' | 'year' | null;
  discount: { percent: number; months: number } | null;
  /** For a plan paid once a year: what that payment is. */
  billedYearly: Money | null;
}

/** The server's sums for an order. The interface shows them and never works out a price itself. */
export interface OrderQuote {
  period: BillingPeriod;
  seats: number;
  /** Whether this order starts with the free trial. */
  trial: boolean;
  promo: PromoCode | null;
  /** What one person costs a month on this order, and what that becomes while a promo code applies. */
  seatPrice: Money;
  discountedSeatPrice: Money | null;
  /** What the plan would cost today if there were no trial. */
  planToday: Money;
  schedule: readonly ScheduledCharge[];
  domain: { name: string; yearly: Money } | null;
  dueToday: Money;
  taxRate: number;
}

/**
 * A payment card as typed. Handed to `pay` and to nothing else: never stored, logged or put in an error.
 *
 * **Stand-in only. Card data must never reach Yahel.** This shape exists so the demo checkout can be seen;
 * it must never be sent to a Yahel endpoint. A real checkout uses the payment provider's hosted fields or a
 * redirect, and the bank's challenge on the provider's own page; this type then leaves the interface.
 */
export interface CardDetails {
  number: string;
  /** MM/YY. */
  expiry: string;
  securityCode: string;
  name: string;
  /** Where the bank sends the card's statements, when it is not the business address; `null` when it is. */
  billingAddress: CardBillingAddress | null;
}

/** The address the bank has for a card. Used to check the card, and for nothing else. */
export interface CardBillingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
}

export interface PostalAddress {
  street: string;
  street2: string;
  city: string;
  /** The state or region; for Nigeria also the local government area. */
  state: string;
  localArea: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** In international form. */
  phone: string;
}

/** Who is paying, and where invoices and (for a domain bought here) the registry's records point. */
export interface BillingContact {
  businessName: string;
  email: string;
  address: PostalAddress | null;
}

/** The bank wants a one-time code (`sentTo` is a masked number, when the bank says), or it refused the card. */
export type PaymentStart = { status: 'code-needed'; paymentId: string; sentTo: string | null } | { status: 'declined' };

/** `spent`: too many wrong codes, so the payment has to be started again. */
export type PaymentConfirmation = 'authorised' | 'wrong-code' | 'expired-code' | 'spent';

/** What an authorised payment turned out to be for, once the workspace exists. */
export interface CompletedOrder {
  tenantId: string | null;
  domain: string;
  /** The two choices on the admin step; both off unless turned on. */
  marketing: { productNews: boolean; teamTips: boolean };
}

/**
 * Plans, prices and paying for a new workspace.
 *
 * **`pay` and `confirm` are for the stand-in only: card data must never reach Yahel.** Do not implement them
 * against a Yahel endpoint. A real checkout is the payment provider's hosted fields or a redirect, with the
 * bank's challenge on the provider's page; both methods then leave this interface (`docs/roadmap.md`).
 */
export interface WorkspaceBilling {
  plan(country: string): Promise<WorkspacePlan>;
  /** The discount a code gives, or `null` when the code is not valid. */
  promo(code: string): Promise<PromoCode | null>;
  quote(order: OrderRequest): Promise<OrderQuote>;
  /** Asks the bank to authorise what is due today (or a small hold, for a trial). Nothing is taken yet. Stand-in only: never send a card to Yahel. */
  pay(order: OrderRequest, card: CardDetails, contact: BillingContact): Promise<PaymentStart>;
  /** Asks the bank to send its one-time code again. */
  resendCode(paymentId: string): Promise<void>;
  /** Passes on the bank's one-time code. Stand-in only: a real checkout takes it on the provider's own page. */
  confirm(paymentId: string, code: string): Promise<PaymentConfirmation>;
  /** Ties an authorised payment to the workspace it paid for, which is when money is taken and a bought domain registered. Safe to repeat. */
  complete(paymentId: string, order: CompletedOrder): Promise<void>;
  /** Lets go of an authorisation whose workspace was not created. Safe to repeat. */
  release(paymentId: string): Promise<void>;
}

/** The workspace a signed-in session is in, as an administrator's first sign-in needs it. */
export interface WorkspaceMembership {
  /** The organisation's name. */
  organisation: string;
  /** The person administers the workspace (its owner or an admin), so Admin is theirs to set up. */
  administrator: boolean;
  /** The person has at least one passkey. Admin is for administrators who have one. */
  hasPasskey: boolean;
  /**
   * The server's own statement that it enforces "Admins must use a passkey" for this workspace (every rule in
   * the admin-access stand-in's header). Only when it is true may the interface say Admin is closed without one.
   */
  passkeyRequired: boolean;
}

/**
 * What an administrator's first sign-in asks of the server about the signed-in person. Needs a session.
 * It informs the interface only: refusing Admin to an administrator without a passkey is the server's
 * job (docs/roadmap.md, "What each real endpoint must do").
 */
export interface AdminAccess {
  /** The session's workspace, or `null` when the session is a personal one with none. */
  membership(): Promise<WorkspaceMembership | null>;
}

export type StandInName = 'passkeys' | 'textCodes' | 'recoveryByPhone' | 'helpDesk' | 'passkeyRegistration' | 'preferences' | 'serviceStatus' | 'domainMarket' | 'workspaceBilling' | 'adminAccess';

export interface AccountCapabilities {
  /** `null` when the feature is not available; the interface then does not offer it. */
  passkeys: PasskeyCeremony | null;
  textCodes: TextCodeSender | null;
  directory: AccountDirectory;
  recovery: RecoveryChannels;
  helpDesk: AccountHelpDesk | null;
  passkeyRegistration: PasskeyRegistration | null;
  addresses: AddressAvailability | null;
  trustedContacts: TrustedContacts;
  preferences: SignUpPreferences | null;
  serviceStatus: ServiceStatus | null;
  domainMarket: DomainMarket | null;
  domainClaims: DomainClaims;
  workspaceBilling: WorkspaceBilling | null;
  adminAccess: AdminAccess | null;
  /** The capabilities currently answered by stand-ins. Empty in a normal build. */
  standIns: readonly StandInName[];
}
