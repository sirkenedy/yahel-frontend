import type { Page, Route } from '@playwright/test';

export const profile = {
  id: '64f000000000000000000001',
  globalId: 'g-amara-001',
  email: 'amara@northwind.example',
  firstName: 'Amara',
  lastName: 'Okafor',
  displayName: 'Amara Okafor',
  photo: null,
  // A member of Northwind Studio, which made her account.
  accountType: 'managed' as 'personal' | 'business' | 'managed',
};

/** The credential id (base64url) of the passkey the stubbed device signs in with. Amara's. */
export const signInCredentialId = 'AQID';

export const credentials = { email: profile.email, password: 'correct horse battery staple' };

/** An account with two-step sign-in turned on. */
export const twoStepProfile = { ...profile, id: '64f000000000000000000002', globalId: 'g-kofi-001', email: 'kofi@northwind.example', firstName: 'Kofi', lastName: 'Mensah', displayName: 'Kofi Mensah' };
export const twoStepCredentials = { email: twoStepProfile.email, password: 'harmattan morning in accra' };
export const secondStepCode = '482910';
export const backupCode = 'a1b2c3d4e5';
/** The reset code the mock accepts, in the backend's format: six letters and numbers. */
export const resetCode = 'A7kZq2';

/** The domain of a new Yahel address in the demo build; accounts on it need no email confirmation. */
export const mailDomain = 'yahel.example';
/** Stands for the public providers (Gmail, Outlook and so on) the backend accepts for a personal account. */
export const publicEmailDomain = 'mail.example';
/** The codes the mock sends, in the backend's format: six letters and numbers. */
export const emailCode = 'B4nQ7x';
export const phoneCode = 'K9mP2r';
/** A Yahel address that already has an account, with a password nobody signing up will choose. */
export const takenAddress = `kemi.adeyemi@${mailDomain}`;
/**
 * An existing email that someone else registered first, with their own password, and never confirmed. The
 * backend keeps such a registration: registering again answers "already exists", its password is checked
 * before sign-in says it is unconfirmed, anyone may ask for a new code for it, and a right code switches it on.
 */
export const pendingEmail = `ngozi.eze@${publicEmailDomain}`;
export const pendingPassword = 'Set-by-someone-else-77';
/** An existing email that already has a confirmed Yahel account. */
export const registeredEmail = `kemi.adeyemi@${publicEmailDomain}`;

const MAX_SECOND_STEP_ATTEMPTS = 5;
const MIN_AGE = 13;
/** A country whose age of consent the backend sets higher than its default (16, in its `ageOfConsentByCountry`). */
export const strictCountry = 'DE';
// The backend's rule for a new password: at least 8 characters with upper case, lower case, a number and a symbol.
const meetsPasswordPolicy = (password: string) => password.length >= 8 && [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].every((pattern) => pattern.test(password));

/** The id every answer carries, as the backend's `meta.requestId` does; a failure shows it as the reference to quote. */
/** A domain a workspace already holds: the one the seeded accounts' addresses are on. */
export const claimedDomain = 'northwind.example';

export const requestId = 'req-e2e-7F3K2Q';
/**
 * The administrator of the seeded workspace (`claimedDomain`), made by workspace sign-up whose phone was never
 * checked: the backend takes the address as verified and answers a right password with a phone challenge instead
 * of a session, until a texted code meets it. Its owner context (`/auth/contexts`) names the workspace, Northwind Studio.
 */
export const newAdmin = { email: 'kayode@northwind.example', password: 'Northwind Admin 2026!', firstName: 'Kayode' };

/** An account whose identity an administrator has suspended: the backend answers 403 `FORBIDDEN`, and only once the password has matched. */
export const suspendedCredentials = { email: 'tunde@northwind.example', password: 'Lagos-lagoon-at-dawn-7' };

const ok = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta: { requestId } }) });
// `retryAfter` sends the header the backend's rate limiter sends. A browser can read it across origins
// only if the backend lists it in `Access-Control-Expose-Headers`, which it does not yet: `exposed` models the day it does.
const fail = (route: Route, status: number, code: string, retry?: { retryAfter: number; exposed: boolean }) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    // Requests carry the browser's cookies, so CORS must name the origin and allow credentials, as the backend does.
    headers: retry ? { 'Retry-After': String(retry.retryAfter), 'Access-Control-Allow-Origin': route.request().headers()['origin'] ?? '*', 'Access-Control-Allow-Credentials': 'true', ...(retry.exposed ? { 'Access-Control-Expose-Headers': 'Retry-After' } : {}) } : undefined,
    body: JSON.stringify({ success: false, error: { code, message: `Server said: ${code}` }, meta: { requestId } }),
  });

export interface MockApi {
  calls: { method: string; path: string; body: unknown; authorization: string | undefined; client: string | undefined }[];
  /** The accounts this browser remembers, by slot, as the server keeps them. */
  remembered: () => { slot: number; handle: string; email: string; signedIn: boolean }[];
  /** Signs an account in as if it had done so in the accounts app: it takes its remembered slot, or the lowest free one. Resolves its slot. */
  signInAs: (email: string) => number;
  /**
   * Makes the next request to `path` go wrong, once. A status answers with that failure and does nothing.
   * `lost` does what was asked and then drops the answer, as when a connection dies after the server has acted.
   */
  failNext(path: string, how: number | 'lost', code?: string, retry?: { retryAfter: number; exposed: boolean }): void;
}

interface Account {
  profile: typeof profile;
  password: string;
  twoStep: boolean;
  emailVerified: boolean;
  suspended?: boolean;
  /** An administrator whose phone is still to be checked: no session until a texted code meets the challenge sign-in answers with. */
  phoneRequired?: boolean;
  /** The workspace the account belongs to, as `/auth/accounts` reports it. */
  membership?: { organisation: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' };
}

const staged = (value: string) => ({ value, requestedAt: new Date().toISOString(), usableAt: new Date(Date.now() + 7 * 86_400_000).toISOString() });
const wellFormedPhone = (phone: string | undefined) => Boolean(phone?.startsWith('+')) && (phone ?? '').replace(/\D/g, '').length >= 8;

const emptyRecovery = () => ({
  recoveryEmail: { configured: false, value: null as string | null, lastUpdatedAt: null, pending: null as { value: string; requestedAt: string; usableAt: string } | null },
  phone: { configured: false, verified: false, value: null as string | null, lastUpdatedAt: null, pending: null as { value: string; verified: boolean; requestedAt: string; usableAt: string } | null },
});

/** Whole years between a date of birth and now, counted as the backend counts them. */
const ageOf = (dateOfBirth: string) => {
  const born = new Date(dateOfBirth);
  const now = new Date();
  const years = now.getUTCFullYear() - born.getUTCFullYear();
  const months = now.getUTCMonth() - born.getUTCMonth();
  return months < 0 || (months === 0 && now.getUTCDate() < born.getUTCDate()) ? years - 1 : years;
};

/** An account this browser remembers before the test starts. It need not have a password the mock knows. */
export interface RememberedAccount {
  email: string;
  displayName: string;
  kind?: 'personal' | 'business';
  organisation?: string | null;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  signedIn?: boolean;
}

/** What a browser that has signed in before remembers, as the chooser drawings show it. */
export const rememberedByDefault: RememberedAccount[] = [
  { email: profile.email, displayName: profile.displayName, kind: 'business', organisation: 'Northwind Studio', role: 'MEMBER' },
  { email: `amara.okafor@yahel.example`, displayName: 'Amara Okafor' },
];

const MAX_ACCOUNTS = 10;
// As the backend decides `kind`: a membership, or an account type other than personal, makes a work account.
const seatKindOf = (account: Account | undefined) =>
  account && (account.membership || account.profile.accountType !== 'personal')
    ? { kind: 'business' as const, organisation: account.membership?.organisation ?? null, role: account.membership?.role ?? null }
    : { kind: 'personal' as const, organisation: null, role: null };
// Opaque and base64url-shaped, as the backend's are; the address part only makes test failures readable.
const handleFor = (slot: number, email: string) => `handle-${slot}-${email.split('@')[0]!.replace(/[^A-Za-z0-9_-]/g, '-')}`;

export interface MockApiOptions {
  /** The accounts this browser remembers at the start, signed out unless said. `[]` is a browser that never signed in. */
  remembered?: RememberedAccount[];
  /** Every request fails as if the connection had dropped. */
  offline?: boolean;
  /** Puts an account in a workspace with another role than the seeded one, by its address. */
  memberships?: Record<string, { organisation: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' }>;
  /** Sign-in attempts are refused by the rate limiter, which answers 429 under the general code `BAD_REQUEST`. */
  rateLimited?: boolean | { retryAfter: number; exposed: boolean };
  /** Accounts, by address, whose phone is already confirmed. */
  verifiedPhones?: string[];
}

/** Stands in for the backend. Tokens rotate on every refresh so tests can tell them apart. */
export async function mockApi(page: Page, options: MockApiOptions = {}): Promise<MockApi> {
  const failures = new Map<string, { how: number | 'lost'; code?: string; retry?: { retryAfter: number; exposed: boolean } }>();
  // The browser's accounts, as the server keeps them against its cookie: a slot each, kept while remembered.
  type Seat = Required<RememberedAccount> & { slot: number; handle: string };
  let seats: Seat[] = (options.remembered ?? rememberedByDefault).map((account, slot) => ({ kind: 'personal', organisation: null, role: null, signedIn: false, ...account, slot, handle: handleFor(slot, account.email) }));
  const state: MockApi = {
    calls: [],
    remembered: () => seats.map(({ slot, handle, email, signedIn }) => ({ slot, handle, email, signedIn })),
    signInAs: (email) => {
      let seat = seats.find((known) => known.email === email);
      if (!seat) {
        const slot = [...Array(MAX_ACCOUNTS).keys()].find((free) => !seats.some((known) => known.slot === free))!;
        const known = accounts.find((account) => account.profile.email === email);
        seat = { email, displayName: known?.profile.displayName ?? email, ...seatKindOf(known), signedIn: false, slot, handle: handleFor(slot, email) };
        seats = [...seats, seat].sort((a, b) => a.slot - b.slot);
      }
      seat.signedIn = true;
      return seat.slot;
    },
    failNext: (path, how, code, retry) => void failures.set(path, { how, code, retry }),
  };
  let issued = 0;
  // Which account each live access token belongs to. A slot signed out takes its tokens with it.
  const access = new Map<string, string>();
  const accounts: Account[] = [
    { profile, password: credentials.password, twoStep: false, emailVerified: true, membership: { organisation: 'Northwind Studio', role: 'MEMBER' } },
    { profile: twoStepProfile, password: twoStepCredentials.password, twoStep: true, emailVerified: true, membership: { organisation: 'Northwind Studio', role: 'MEMBER' } },
    { profile: { ...profile, id: '64f000000000000000000006', globalId: 'g-tunde-001', email: suspendedCredentials.email, firstName: 'Tunde', lastName: 'Bakare', displayName: 'Tunde Bakare', accountType: 'personal' }, password: suspendedCredentials.password, twoStep: false, emailVerified: true, suspended: true },
    { profile: { ...profile, id: '64f000000000000000000003', globalId: 'g-kemi-001', email: takenAddress, firstName: 'Kemi', lastName: 'Adeyemi', displayName: 'Kemi Adeyemi', accountType: 'personal' }, password: 'Harmattan-in-Ibadan-88', twoStep: false, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000004', globalId: 'g-kemi-002', email: registeredEmail, firstName: 'Kemi', lastName: 'Adeyemi', displayName: 'Kemi Adeyemi', accountType: 'personal' }, password: 'Harmattan-in-Ibadan-88', twoStep: false, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000007', globalId: 'g-kayode-001', email: newAdmin.email, firstName: newAdmin.firstName, lastName: 'Balogun', displayName: 'Kayode Balogun', accountType: 'business' }, password: newAdmin.password, twoStep: false, emailVerified: true, phoneRequired: true, membership: { organisation: 'Northwind Studio', role: 'OWNER' } },
    { profile: { ...profile, id: '64f000000000000000000005', globalId: 'g-pending-001', email: pendingEmail, firstName: 'Ngozi', lastName: 'Eze', displayName: 'Ngozi Eze', accountType: 'personal' }, password: pendingPassword, twoStep: false, emailVerified: false },
  ];
  for (const account of accounts) account.membership = options.memberships?.[account.profile.email] ?? account.membership;
  // Workspaces that exist: the seeded one, whose short name is taken too, and any made by a test.
  const tenants: { id: string; slug: string; domain: string }[] = [{ id: '64f000000000000000000200', slug: 'northwind-studio', domain: claimedDomain }];
  // Each account's passkeys by credential id, as the server stores them once a registration is verified.
  const passkeys = new Map<string, { credentialId: string; deviceName: string | null; createdAt: string }[]>();
  const passkeysOf = (email: string) => passkeys.get(email) ?? passkeys.set(email, []).get(email)!;
  // Amara has one already: the credential the stubbed device signs in with (`stubPasskeys`).
  passkeysOf(profile.email).push({ credentialId: signInCredentialId, deviceName: null, createdAt: '2026-11-01T09:00:00.000Z' });
  // Challenges the server handed out and has not yet consumed, by token. Each is used once.
  const webauthnChallenges = new Map<string, { kind: 'authentication' | 'registration'; email?: string }>();
  const webauthnChallengeFor = (kind: 'authentication' | 'registration', email?: string) => {
    const challengeToken = `webauthn-${kind}-${webauthnChallenges.size + 1}`;
    webauthnChallenges.set(challengeToken, { kind, email });
    return challengeToken;
  };
  const base64url = /^[A-Za-z0-9_-]+$/;
  const base64urlOf = (text: string) => Buffer.from(text, 'utf8').toString('base64url');
  const recovery = new Map<string, ReturnType<typeof emptyRecovery>>();
  const recoveryOf = (email: string) => recovery.get(email) ?? recovery.set(email, emptyRecovery()).get(email)!;
  for (const email of options.verifiedPhones ?? []) recoveryOf(email).phone = { ...emptyRecovery().phone, configured: true, verified: true, value: '***0199' };
  const challenges = new Map<string, { account: (typeof accounts)[number]; attempts: number }>();
  // Phone checks: issued by register-business and by a sign-in while the phone is unverified. Each takes one number and five tries.
  const phoneChecks = new Map<string, { account: (typeof accounts)[number]; phone: string | null; attempts: number; used: boolean }>();
  const phoneCheckFor = (account: (typeof accounts)[number]) => {
    const challengeToken = `phone-check-${phoneChecks.size + 1}`;
    phoneChecks.set(challengeToken, { account, phone: null, attempts: 0, used: false });
    return challengeToken;
  };

  await page.route('**/api/v1/**', async (incoming) => {
    const request = incoming.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const body = request.postDataJSON() as Record<string, string> | null;
    const { how: failure, code: failureCode, retry } = failures.get(path) ?? { how: undefined };
    failures.delete(path);
    // A lost answer: everything below still happens, but the browser never hears of it.
    const route = failure === 'lost' ? ({ fulfill: () => incoming.abort('connectionreset'), abort: (reason?: string) => incoming.abort(reason) } as unknown as Route) : incoming;
    const authorization = request.headers()['authorization'];
    const client = request.headers()['x-yahel-client'];
    state.calls.push({ method: request.method(), path, body, authorization, client });
    if (options.offline) return route.abort('internetdisconnected');
    // The backend refuses a browser that does not say it is the web client: it could not hold a session.
    if (client !== 'web') return fail(route, 400, 'CLIENT_NOT_REGISTERED');
    // Without a code of its own a failure carries what the backend sends for that status: the rate limiter's general code, or its own for the rest.
    if (typeof failure === 'number') return fail(route, failure, failureCode ?? (failure === 429 ? 'BAD_REQUEST' : failure === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR'), retry);

    const accessFor = (seat: Seat) => {
      const token = `access-${++issued}`;
      access.set(token, seat.email);
      return { accessToken: token, expiresIn: 3600, tokenType: 'Bearer', slot: seat.slot, handle: seat.handle };
    };
    const signOutSeat = (seat: Seat) => {
      seat.signedIn = false;
      for (const [token, email] of access) if (email === seat.email) access.delete(token);
    };
    // A sign-in takes the account's remembered slot, or the lowest free one; the refresh token goes into a cookie, never the body.
    const issue = (account: (typeof accounts)[number]) => {
      let seat = seats.find((known) => known.email === account.profile.email);
      if (!seat) {
        if (seats.length >= MAX_ACCOUNTS) return null;
        const slot = [...Array(MAX_ACCOUNTS).keys()].find((free) => !seats.some((known) => known.slot === free))!;
        seat = { email: account.profile.email, displayName: account.profile.displayName, ...seatKindOf(account), signedIn: false, slot, handle: handleFor(slot, account.profile.email) };
        seats = [...seats, seat].sort((a, b) => a.slot - b.slot);
      }
      seat.signedIn = true;
      return accessFor(seat);
    };
    const tokensFor = (account: (typeof accounts)[number]) => {
      const issuedTokens = issue(account);
      return issuedTokens ? ok(route, issuedTokens, 201) : fail(route, 409, 'TOO_MANY_ACCOUNTS');
    };

    // Advice only, as the backend gives it: whether a Yahel address is free, and checked alternatives. Names reserved
    // by the platform read as taken; so does any name with an account. `register` is still where a name is claimed.
    if (path === '/v1/auth/address-availability') {
      const name = String(body?.name ?? '').toLowerCase();
      const reserved = ['amara', 'admin', 'hello', 'info', 'okafor', 'amara.o', 'support'];
      const taken = (candidate: string) => reserved.includes(candidate) || accounts.some((known) => known.profile.email === `${candidate}@${mailDomain}`);
      const [first = name, ...rest] = name.split('.');
      const last = rest.join('');
      const candidates = last ? [`${last}.${first}`, `${first}${last}`, `${first}.${last}1`, `${first}.${last.charAt(0)}`] : [`${first}.mail`, `${first}1`, `hello.${first}`];
      return ok(route, { available: !taken(name), alternatives: candidates.filter((candidate) => candidate.length >= 4 && !taken(candidate)).slice(0, 3) }, 201);
    }
    // Advice only, as the backend gives it (`tenants.controller.ts`, `checkDomainClaim`): the same answers register-business would give for the domain.
    if (path === '/v1/tenants/domain-claims/check') {
      const domain = String(body?.domain ?? '').trim().replace(/^@/, '').toLowerCase();
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return fail(route, 422, 'VALIDATION_ERROR');
      const standing = domain === publicEmailDomain || domain === mailDomain ? 'public' : tenants.some((tenant) => tenant.domain === domain) ? 'claimed' : 'free';
      return ok(route, { standing });
    }
    if (path === '/v1/auth/register') {
      const email = (body?.email ?? '').toLowerCase();
      const domain = email.split('@')[1] ?? '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || /^\.|\.\.|\.@/.test(email) || !body?.firstName || typeof body.lastName !== 'string' || Number.isNaN(Date.parse(body.dateOfBirth ?? '')) || !meetsPasswordPolicy(body.password ?? '')) {
        return fail(route, 422, 'VALIDATION_ERROR');
      }
      if ((body.recoveryEmail !== undefined && !body.recoveryEmail.includes('@')) || (body.phone !== undefined && !wellFormedPhone(body.phone))) return fail(route, 422, 'VALIDATION_ERROR');
      if (ageOf(body.dateOfBirth ?? '') < MIN_AGE) return fail(route, 403, 'USER_UNDERAGE');
      if (accounts.some((known) => known.profile.email === email)) return fail(route, 409, 'EMAIL_ALREADY_EXISTS');
      if (domain !== mailDomain && domain !== publicEmailDomain) return fail(route, 400, 'PERSONAL_SIGNUP_REQUIRES_PUBLIC_EMAIL');
      const displayName = body.displayName ?? `${body.firstName} ${body.lastName}`;
      accounts.push({
        profile: { id: `64f00000000000000000010${accounts.length}`, globalId: `g-new-${accounts.length}`, email, firstName: body.firstName, lastName: body.lastName, displayName, photo: null, accountType: 'personal' },
        password: body.password ?? '',
        twoStep: false,
        // An address on the platform's own domain is the person's by being claimed; any other has to be confirmed.
        emailVerified: domain === mailDomain,
      });
      // The ways back in travel with the registration: the recovery email is staged, the phone waits for its texted code.
      const methods = recoveryOf(email);
      if (body.recoveryEmail) {
        const [local = '', host = ''] = body.recoveryEmail.split('@');
        methods.recoveryEmail.pending = staged(`${local.charAt(0)}***@${host.toLowerCase()}`);
      }
      if (body.phone) methods.phone.pending = { ...staged(`***${body.phone.slice(-4)}`), verified: false };
      return ok(route, { message: domain === mailDomain ? 'Registration successful.' : 'Registration successful. Please verify your email.' }, 201);
    }
    if (path === '/v1/auth/register-business') {
      // The order of the checks is the backend's (`auth.service.ts`, `registerBusiness`): the body, the age, a public domain, the address, the domain.
      const sent = (request.postDataJSON() ?? {}) as { email?: string; password?: string; firstName?: string; lastName?: string; businessName?: string; slug?: string; country?: { name?: string; code?: string; currency?: string }; dateOfBirth?: string; employeeCount?: number; domain?: string; contactEmail?: string };
      const email = (sent.email ?? '').toLowerCase();
      const domain = (sent.domain ?? '').toLowerCase();
      const wellFormed =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && meetsPasswordPolicy(sent.password ?? '') && Boolean(sent.firstName) && typeof sent.lastName === 'string' && Boolean(sent.businessName) && (sent.businessName ?? '').length <= 100 &&
        /^[a-z0-9-]{2,50}$/.test(sent.slug ?? '') && Boolean(sent.country?.name) && /^[A-Z]{2,3}$/.test(sent.country?.code ?? '') && /^[A-Z]{3}$/.test(sent.country?.currency ?? '') && (sent.dateOfBirth === undefined || !Number.isNaN(Date.parse(sent.dateOfBirth))) &&
        (sent.contactEmail === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(sent.contactEmail)) &&
        Number.isInteger(sent.employeeCount) && (sent.employeeCount ?? 0) >= 1 && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain);
      if (!wellFormed) return fail(route, 422, 'VALIDATION_ERROR');
      // The date of birth is optional for a business; when given, the age is still checked.
      if (sent.dateOfBirth !== undefined && ageOf(sent.dateOfBirth) < (sent.country?.code === strictCountry ? 16 : MIN_AGE)) return fail(route, 403, 'USER_UNDERAGE');
      if (domain === publicEmailDomain || domain === mailDomain) return fail(route, 400, 'PUBLIC_EMAIL_NOT_ALLOWED');
      if (accounts.some((known) => known.profile.email === email)) return fail(route, 409, 'EMAIL_ALREADY_EXISTS');
      if (tenants.some((tenant) => tenant.domain === domain)) return fail(route, 409, 'DOMAIN_CONFLICT');
      // The short name is unique among workspaces; a second one of the same name collides at the database.
      if (tenants.some((tenant) => tenant.slug === sent.slug)) return fail(route, 409, 'DUPLICATE_RECORD');
      const id = `64f0000000000000000002${tenants.length}0`;
      tenants.push({ id, slug: sent.slug ?? '', domain });
      // The address is taken as verified and no email is sent; the session comes once a texted code meets the phone check.
      const made = { profile: { id: `64f00000000000000000011${accounts.length}`, globalId: `g-admin-${accounts.length}`, email, firstName: sent.firstName ?? '', lastName: sent.lastName ?? '', displayName: `${sent.firstName} ${sent.lastName}`, photo: null, accountType: 'business' }, password: sent.password ?? '', twoStep: false, emailVerified: true, phoneRequired: true, membership: { organisation: sent.businessName ?? '', role: 'OWNER' } };
      accounts.push(made);
      return ok(route, { message: 'Workspace created. Verify a phone number to sign in.', phoneRequired: true, challengeToken: phoneCheckFor(made), identity: { id: made.profile.id, email, emailVerified: true }, tenant: { id, slug: sent.slug, displayName: sent.businessName, status: 'pending_setup' }, domain: { domain, status: 'pending', verification: { type: 'TXT', host: `_yahel-verify.${domain}`, value: 'yahel-verify=e2e' } } }, 201);
    }
    if (path === '/v1/auth/phone-challenge/send') {
      const check = phoneChecks.get(body?.challengeToken ?? '');
      if (!check || check.used) return fail(route, 401, 'INVALID_TOKEN');
      const digits = (body?.phone ?? '').replace(/\D/g, '');
      if (digits.length < 8) return fail(route, 400, 'BAD_REQUEST');
      check.phone = digits;
      return ok(route, { message: 'Code sent.', resendInSeconds: 30, sendsLeft: 4 });
    }
    if (path === '/v1/auth/phone-challenge/verify') {
      const check = phoneChecks.get(body?.challengeToken ?? '');
      if (!check || check.used || !check.phone) return fail(route, 401, 'INVALID_TOKEN');
      if (body?.code !== phoneCode) {
        check.attempts += 1;
        if (check.attempts < MAX_SECOND_STEP_ATTEMPTS) return fail(route, 401, 'INVALID_TOKEN');
        check.used = true;
        return fail(route, 429, 'TOKEN_MAX_ATTEMPTS');
      }
      check.used = true;
      check.account.phoneRequired = false;
      const methods = recoveryOf(check.account.profile.email);
      methods.phone = { ...methods.phone, configured: true, verified: true, value: `***${check.phone.slice(-4)}` };
      return tokensFor(check.account);
    }
    if (path === '/v1/auth/verify-email') {
      const account = accounts.find((known) => known.profile.email === body?.email?.toLowerCase());
      if (!account || account.emailVerified || body?.token !== emailCode) return fail(route, 401, 'INVALID_TOKEN');
      account.emailVerified = true;
      return ok(route, { message: 'Email verified successfully' }, 201);
    }
    // Answers the same way whether or not the address has an account waiting to be confirmed.
    if (path === '/v1/auth/verify-email/resend') return ok(route, { message: 'If this email exists and is unverified, a new link has been sent' }, 201);
    if (path === '/v1/auth/login') {
      if (options.rateLimited) return fail(route, 429, 'BAD_REQUEST', options.rateLimited === true ? undefined : options.rateLimited);
      const account = accounts.find((known) => known.profile.email === body?.email?.toLowerCase() && known.password === body.password);
      if (!account) return fail(route, 401, 'INVALID_CREDENTIALS');
      if (!account.emailVerified) return fail(route, 403, 'EMAIL_NOT_VERIFIED');
      if (account.suspended) return fail(route, 403, 'FORBIDDEN');
      // Before the second step: an administrator whose phone is unverified gets a phone check, not a session.
      if (account.phoneRequired) return ok(route, { phoneRequired: true, challengeToken: phoneCheckFor(account) }, 201);
      if (!account.twoStep) return tokensFor(account);
      const challengeToken = `challenge-${challenges.size + 1}`;
      challenges.set(challengeToken, { account, attempts: 0 });
      return ok(route, { mfaRequired: true, challengeToken }, 201);
    }
    // No credentials are listed, whatever the address: the server never says which passkeys an account has.
    if (path === '/v1/auth/passkey/authenticate/begin') return ok(route, { options: { challenge: 'c2lnbi1pbi1jaGFsbGVuZ2U', timeout: 60000, rpId: 'localhost', userVerification: 'required' }, challengeToken: webauthnChallengeFor('authentication') });
    if (path === '/v1/auth/passkey/authenticate/finish') {
      const sent = request.postDataJSON() as { challengeToken?: string; response?: { id?: string; rawId?: string; type?: string; response?: Record<string, string> } } | null;
      const challenge = webauthnChallenges.get(sent?.challengeToken ?? '');
      webauthnChallenges.delete(sent?.challengeToken ?? '');
      if (challenge?.kind !== 'authentication') return fail(route, 400, 'PASSKEY_CHALLENGE_INVALID');
      // What @simplewebauthn/server checks before anything else: one id in base64url, said twice, of a public key.
      const answer = sent?.response;
      const fields = [answer?.response?.clientDataJSON, answer?.response?.authenticatorData, answer?.response?.signature];
      if (!answer?.id || answer.id !== answer.rawId || answer.type !== 'public-key' || !base64url.test(answer.id) || !fields.every((field) => field && base64url.test(field))) return fail(route, 401, 'PASSKEY_VERIFICATION_FAILED');
      const account = accounts.find((known) => passkeysOf(known.profile.email).some((passkey) => passkey.credentialId === answer.id));
      if (!account) return fail(route, 401, 'PASSKEY_VERIFICATION_FAILED');
      if (account.suspended) return fail(route, 403, 'FORBIDDEN');
      if (account.phoneRequired) return ok(route, { phoneRequired: true, challengeToken: phoneCheckFor(account) }, 201);
      return tokensFor(account);
    }
    if (path === '/v1/auth/mfa/challenge') {
      const challenge = challenges.get(body?.challengeToken ?? '');
      if (!challenge) return fail(route, 401, 'INVALID_TOKEN');
      if (body?.code !== secondStepCode && body?.code !== backupCode) {
        challenge.attempts += 1;
        if (challenge.attempts < MAX_SECOND_STEP_ATTEMPTS) return fail(route, 401, 'MFA_INVALID');
        challenges.delete(body?.challengeToken ?? '');
        return fail(route, 429, 'MFA_MAX_ATTEMPTS');
      }
      challenges.delete(body.challengeToken ?? '');
      return tokensFor(challenge.account);
    }
    // Answers the same way whether or not the address has an account.
    if (path === '/v1/auth/forgot-password') return ok(route, { message: 'If this email exists, a reset link has been sent' }, 201);
    if (path === '/v1/auth/reset-password') {
      if (!meetsPasswordPolicy(body?.password ?? '')) return fail(route, 400, 'VALIDATION_ERROR');
      const account = accounts.find((known) => known.profile.email === body?.email);
      if (!account || body?.token !== resetCode) return fail(route, 401, 'INVALID_TOKEN');
      account.password = body.password ?? '';
      return ok(route, { message: 'Password reset successfully. Please log in again.' }, 201);
    }
    // The browser's own accounts, by its cookie: no access token is asked for.
    const slotted = seats.find((seat) => seat.slot === Number((body as { slot?: unknown } | null)?.slot));
    if (path === '/v1/auth/refresh') return slotted?.signedIn ? ok(route, accessFor(slotted), 201) : fail(route, 401, 'SESSION_EXPIRED');
    if (path === '/v1/auth/logout') {
      if (!slotted?.signedIn) return fail(route, 401, 'SESSION_EXPIRED');
      signOutSeat(slotted);
      return ok(route, { slot: slotted.slot }, 201);
    }
    if (path === '/v1/auth/logout-browser') {
      seats.forEach(signOutSeat);
      return ok(route, null, 201);
    }
    if (path === '/v1/auth/accounts') {
      return ok(route, seats.map(({ handle, slot, displayName, email, kind, organisation, role, signedIn }) => ({ handle, slot, displayName, initials: displayName.split(/\s+/).map((word) => word.charAt(0)).join('').slice(0, 2).toUpperCase(), avatarUrl: null, email, kind, organisation, role, signedIn })));
    }
    if (path.startsWith('/v1/auth/accounts/') && request.method() === 'DELETE') {
      const handle = decodeURIComponent(path.slice('/v1/auth/accounts/'.length));
      const gone = seats.find((seat) => seat.handle === handle);
      if (gone) signOutSeat(gone);
      seats = seats.filter((seat) => seat.handle !== handle);
      return ok(route, { handle });
    }
    // What the backend's auth guard answers for a missing, expired or revoked access token.
    const owner = authorization?.startsWith('Bearer ') ? access.get(authorization.slice('Bearer '.length)) : undefined;
    const signedIn = accounts.find((known) => known.profile.email === owner)?.profile;
    if (!signedIn) return fail(route, 401, 'SESSION_EXPIRED');
    if (path === '/v1/me') return ok(route, signedIn);
    // A member's session is in their workspace; anyone else's is personal.
    if (path === '/v1/auth/contexts') {
      const membership = accounts.find((known) => known.profile === signedIn)?.membership;
      const personal = { type: 'personal', tenantId: null, displayName: null, logoUrl: null, role: null, isCurrent: !membership };
      return ok(route, membership ? [personal, { type: 'tenant', tenantId: '64f000000000000000000200', displayName: membership.organisation, logoUrl: null, role: membership.role, isCurrent: true }] : [personal]);
    }
    if (path === '/v1/auth/passkey/register/begin') {
      const excludeCredentials = passkeysOf(signedIn.email).map(({ credentialId }) => ({ id: credentialId, type: 'public-key', transports: ['internal'] }));
      const options = { challenge: 'cmVnaXN0ZXItY2hhbGxlbmdl', rp: { name: 'Yahel', id: 'localhost' }, user: { id: base64urlOf(signedIn.id), name: signedIn.email, displayName: signedIn.displayName }, pubKeyCredParams: [{ alg: -8, type: 'public-key' }, { alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }], timeout: 60000, attestation: 'none', excludeCredentials, authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' } };
      return ok(route, { options, challengeToken: webauthnChallengeFor('registration', signedIn.email) });
    }
    if (path === '/v1/auth/passkey/register/finish') {
      const sent = request.postDataJSON() as { challengeToken?: string; deviceName?: string; response?: { id?: string; rawId?: string; type?: string; response?: Record<string, unknown> } } | null;
      const challenge = webauthnChallenges.get(sent?.challengeToken ?? '');
      webauthnChallenges.delete(sent?.challengeToken ?? '');
      // A challenge is bound to the session that asked for it.
      if (challenge?.kind !== 'registration' || challenge.email !== signedIn.email) return fail(route, 400, 'PASSKEY_CHALLENGE_INVALID');
      const answer = sent?.response;
      const fields = [answer?.response?.clientDataJSON, answer?.response?.attestationObject];
      if (!answer?.id || answer.id !== answer.rawId || answer.type !== 'public-key' || !base64url.test(answer.id) || !fields.every((field) => typeof field === 'string' && base64url.test(field))) return fail(route, 401, 'PASSKEY_VERIFICATION_FAILED');
      if ([...passkeys.values()].flat().some((passkey) => passkey.credentialId === answer.id)) return fail(route, 401, 'PASSKEY_VERIFICATION_FAILED');
      passkeysOf(signedIn.email).push({ credentialId: answer.id, deviceName: sent?.deviceName ?? null, createdAt: new Date().toISOString() });
      return ok(route, { credentialId: answer.id, aaguid: null, deviceName: sent?.deviceName ?? null }, 201);
    }
    if (path === '/v1/auth/passkey/list') return ok(route, passkeysOf(signedIn.email).map((passkey) => ({ ...passkey, aaguid: null, transports: ['internal'], lastUsedAt: null })));
    const methods = recoveryOf(signedIn.email);
    if (path === '/v1/auth/phone/send-otp') {
      if (!wellFormedPhone(body?.phone)) return fail(route, 400, 'BAD_REQUEST');
      methods.phone.pending = { ...staged(`***${(body?.phone ?? '').slice(-4)}`), verified: false };
      return ok(route, { message: 'Verification code sent' }, 201);
    }
    if (path === '/v1/auth/phone/verify') {
      if (!methods.phone.pending) return fail(route, 403, 'FORBIDDEN');
      if (body?.code !== phoneCode) return fail(route, 401, 'INVALID_TOKEN');
      methods.phone.pending.verified = true;
      return ok(route, { message: 'Phone verified' }, 201);
    }
    if (path === '/v1/me/recovery') return ok(route, methods);
    if (path === '/v1/me/recovery/trusted-contact') {
      if (!(body?.trustedContactEmail ?? '').includes('@')) return fail(route, 422, 'VALIDATION_ERROR');
      return ok(route, methods);
    }
    if (path === '/v1/me/recovery/email') {
      const [local = '', domain] = (body?.recoveryEmail ?? '').split('@');
      if (!domain) return fail(route, 422, 'VALIDATION_ERROR');
      methods.recoveryEmail.pending = staged(`${local.charAt(0)}***@${domain.toLowerCase()}`);
      return ok(route, methods);
    }
    if (path === '/v1/me/recovery/phone') {
      if (!wellFormedPhone(body?.phone)) return fail(route, 400, 'BAD_REQUEST');
      methods.phone.pending = { ...staged(`***${(body?.phone ?? '').slice(-4)}`), verified: false };
      return ok(route, methods);
    }
    if (path === '/v1/me/recovery/phone/verify') {
      if (!methods.phone.pending) return fail(route, 403, 'FORBIDDEN');
      if (body?.code !== phoneCode) return fail(route, 401, 'INVALID_TOKEN');
      methods.phone.pending.verified = true;
      return ok(route, methods, 201);
    }
    return fail(route, 404, 'NOT_FOUND');
  });

  mocks.set(page, state);
  return state;
}

const mocks = new WeakMap<Page, MockApi>();

/** The accounts app, as the shell's local build names it (`VITE_ACCOUNTS_URL` unset): the shell's browser tests stand in for it. */
export const shellAccountsUrl = 'http://localhost:5175';

/**
 * Opens the shell signed in. The shell has no sign-in page of its own (F-93): the account is signed in as the
 * accounts app would have done it, and the shell opens at its slot. Call `mockApi` first.
 */
export async function signIn(page: Page, account = credentials) {
  const slot = mocks.get(page)!.signInAs(account.email);
  await page.goto(`/u/${slot}/`);
  await page.getByRole('heading', { name: 'Home' }).waitFor();
}
