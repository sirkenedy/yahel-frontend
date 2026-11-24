import type { Page, Route } from '@playwright/test';

export const profile = {
  id: '64f000000000000000000001',
  globalId: 'g-amara-001',
  email: 'amara@northwind.example',
  firstName: 'Amara',
  lastName: 'Okafor',
  displayName: 'Amara Okafor',
  photo: null,
};

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
 * The administrator of the seeded workspace (`claimedDomain`), made by workspace sign-up and never confirmed:
 * the backend keeps such an identity, checks its password and then answers `EMAIL_NOT_VERIFIED`, as it does
 * for any unconfirmed registration. The admin-access stand-in names the demo workspace, Northwind Studio.
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
    headers: retry ? { 'Retry-After': String(retry.retryAfter), 'Access-Control-Allow-Origin': '*', ...(retry.exposed ? { 'Access-Control-Expose-Headers': 'Retry-After' } : {}) } : undefined,
    body: JSON.stringify({ success: false, error: { code, message: `Server said: ${code}` }, meta: { requestId } }),
  });

export interface MockApi {
  calls: { method: string; path: string; body: unknown; authorization: string | undefined; client: string | undefined }[];
  /** The accounts this browser remembers, by slot, as the server keeps them. */
  remembered: () => { slot: number; handle: string; email: string; signedIn: boolean }[];
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
}

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

export interface MockApiOptions {
  /** The accounts this browser remembers at the start, signed out unless said. `[]` is a browser that never signed in. */
  remembered?: RememberedAccount[];
  /** Every request fails as if the connection had dropped. */
  offline?: boolean;
  /** Sign-in attempts are refused by the rate limiter, which answers 429 under the general code `BAD_REQUEST`. */
  rateLimited?: boolean | { retryAfter: number; exposed: boolean };
}

/** Stands in for the backend. Tokens rotate on every refresh so tests can tell them apart. */
export async function mockApi(page: Page, options: MockApiOptions = {}): Promise<MockApi> {
  const failures = new Map<string, { how: number | 'lost'; code?: string; retry?: { retryAfter: number; exposed: boolean } }>();
  // The browser's accounts, as the server keeps them against its cookie: a slot each, kept while remembered.
  type Seat = Required<RememberedAccount> & { slot: number; handle: string };
  let seats: Seat[] = (options.remembered ?? rememberedByDefault).map((account, slot) => ({ kind: 'personal', organisation: null, role: null, signedIn: false, ...account, slot, handle: `handle-${slot}-${account.email.split('@')[0]}` }));
  const state: MockApi = {
    calls: [],
    remembered: () => seats.map(({ slot, handle, email, signedIn }) => ({ slot, handle, email, signedIn })),
    failNext: (path, how, code, retry) => void failures.set(path, { how, code, retry }),
  };
  let issued = 0;
  // Which account each live access token belongs to. A slot signed out takes its tokens with it.
  const access = new Map<string, string>();
  const accounts: Account[] = [
    { profile, password: credentials.password, twoStep: false, emailVerified: true },
    { profile: twoStepProfile, password: twoStepCredentials.password, twoStep: true, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000006', globalId: 'g-tunde-001', email: suspendedCredentials.email, firstName: 'Tunde', lastName: 'Bakare', displayName: 'Tunde Bakare' }, password: suspendedCredentials.password, twoStep: false, emailVerified: true, suspended: true },
    { profile: { ...profile, id: '64f000000000000000000003', globalId: 'g-kemi-001', email: takenAddress, firstName: 'Kemi', lastName: 'Adeyemi', displayName: 'Kemi Adeyemi' }, password: 'Harmattan-in-Ibadan-88', twoStep: false, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000004', globalId: 'g-kemi-002', email: registeredEmail, firstName: 'Kemi', lastName: 'Adeyemi', displayName: 'Kemi Adeyemi' }, password: 'Harmattan-in-Ibadan-88', twoStep: false, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000007', globalId: 'g-kayode-001', email: newAdmin.email, firstName: newAdmin.firstName, lastName: 'Balogun', displayName: 'Kayode Balogun' }, password: newAdmin.password, twoStep: false, emailVerified: false },
    { profile: { ...profile, id: '64f000000000000000000005', globalId: 'g-pending-001', email: pendingEmail, firstName: 'Ngozi', lastName: 'Eze', displayName: 'Ngozi Eze' }, password: pendingPassword, twoStep: false, emailVerified: false },
  ];
  // Workspaces that exist: the seeded one, whose short name is taken too, and any made by a test.
  const tenants: { id: string; slug: string; domain: string }[] = [{ id: '64f000000000000000000200', slug: 'northwind-studio', domain: claimedDomain }];
  const recovery = new Map<string, ReturnType<typeof emptyRecovery>>();
  const recoveryOf = (email: string) => recovery.get(email) ?? recovery.set(email, emptyRecovery()).get(email)!;
  const challenges = new Map<string, { account: (typeof accounts)[number]; attempts: number }>();

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
      return { accessToken: token, expiresIn: 900, tokenType: 'Bearer', slot: seat.slot, handle: seat.handle };
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
        seat = { email: account.profile.email, displayName: account.profile.displayName, kind: 'personal', organisation: null, role: null, signedIn: false, slot, handle: `handle-${slot}-${account.profile.email.split('@')[0]}` };
        seats = [...seats, seat].sort((a, b) => a.slot - b.slot);
      }
      seat.signedIn = true;
      return accessFor(seat);
    };
    const tokensFor = (account: (typeof accounts)[number]) => {
      const issuedTokens = issue(account);
      return issuedTokens ? ok(route, issuedTokens, 201) : fail(route, 409, 'TOO_MANY_ACCOUNTS');
    };

    if (path === '/v1/auth/register') {
      const email = (body?.email ?? '').toLowerCase();
      const domain = email.split('@')[1] ?? '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || /^\.|\.\.|\.@/.test(email) || !body?.firstName || typeof body.lastName !== 'string' || Number.isNaN(Date.parse(body.dateOfBirth ?? '')) || !meetsPasswordPolicy(body.password ?? '')) {
        return fail(route, 422, 'VALIDATION_ERROR');
      }
      if (ageOf(body.dateOfBirth ?? '') < MIN_AGE) return fail(route, 403, 'USER_UNDERAGE');
      if (accounts.some((known) => known.profile.email === email)) return fail(route, 409, 'EMAIL_ALREADY_EXISTS');
      if (domain !== mailDomain && domain !== publicEmailDomain) return fail(route, 400, 'PERSONAL_SIGNUP_REQUIRES_PUBLIC_EMAIL');
      const displayName = body.displayName ?? `${body.firstName} ${body.lastName}`;
      accounts.push({
        profile: { id: `64f00000000000000000010${accounts.length}`, globalId: `g-new-${accounts.length}`, email, firstName: body.firstName, lastName: body.lastName, displayName, photo: null },
        password: body.password ?? '',
        twoStep: false,
        // An address on the platform's own domain is the person's by being claimed; any other has to be confirmed.
        emailVerified: domain === mailDomain,
      });
      return ok(route, { message: domain === mailDomain ? 'Registration successful.' : 'Registration successful. Please verify your email.' }, 201);
    }
    if (path === '/v1/auth/register-business') {
      // The order of the checks is the backend's (`auth.service.ts`, `registerBusiness`): the body, the age, a public domain, the address, the domain.
      const sent = (request.postDataJSON() ?? {}) as { email?: string; password?: string; firstName?: string; lastName?: string; businessName?: string; slug?: string; country?: { name?: string; code?: string; currency?: string }; dateOfBirth?: string; employeeCount?: number; domain?: string };
      const email = (sent.email ?? '').toLowerCase();
      const domain = (sent.domain ?? '').toLowerCase();
      const wellFormed =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && meetsPasswordPolicy(sent.password ?? '') && Boolean(sent.firstName) && typeof sent.lastName === 'string' && Boolean(sent.businessName) && (sent.businessName ?? '').length <= 100 &&
        /^[a-z0-9-]{2,50}$/.test(sent.slug ?? '') && Boolean(sent.country?.name) && /^[A-Z]{2,3}$/.test(sent.country?.code ?? '') && /^[A-Z]{3}$/.test(sent.country?.currency ?? '') && !Number.isNaN(Date.parse(sent.dateOfBirth ?? '')) &&
        Number.isInteger(sent.employeeCount) && (sent.employeeCount ?? 0) >= 1 && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain);
      if (!wellFormed) return fail(route, 422, 'VALIDATION_ERROR');
      if (ageOf(sent.dateOfBirth ?? '') < (sent.country?.code === strictCountry ? 16 : MIN_AGE)) return fail(route, 403, 'USER_UNDERAGE');
      if (domain === publicEmailDomain || domain === mailDomain) return fail(route, 400, 'PUBLIC_EMAIL_NOT_ALLOWED');
      if (accounts.some((known) => known.profile.email === email)) return fail(route, 409, 'EMAIL_ALREADY_EXISTS');
      if (tenants.some((tenant) => tenant.domain === domain)) return fail(route, 409, 'DOMAIN_CONFLICT');
      // The short name is unique among workspaces; a second one of the same name collides at the database.
      if (tenants.some((tenant) => tenant.slug === sent.slug)) return fail(route, 409, 'DUPLICATE_RECORD');
      const id = `64f0000000000000000002${tenants.length}0`;
      tenants.push({ id, slug: sent.slug ?? '', domain });
      accounts.push({ profile: { id: `64f00000000000000000011${accounts.length}`, globalId: `g-admin-${accounts.length}`, email, firstName: sent.firstName ?? '', lastName: sent.lastName ?? '', displayName: `${sent.firstName} ${sent.lastName}`, photo: null }, password: sent.password ?? '', twoStep: false, emailVerified: false });
      return ok(route, { message: 'Registration successful. Verify your email to complete setup, then add the DNS record shown below.', identity: { id: `64f00000000000000000011${accounts.length - 1}`, email, emailVerified: false }, tenant: { id, slug: sent.slug, displayName: sent.businessName, status: 'pending_setup' }, domain: { domain, status: 'pending', verification: { type: 'TXT', host: `_yahel-verify.${domain}`, value: 'yahel-verify=e2e' } } }, 201);
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
      if (!account.twoStep) return tokensFor(account);
      const challengeToken = `challenge-${challenges.size + 1}`;
      challenges.set(challengeToken, { account, attempts: 0 });
      return ok(route, { mfaRequired: true, challengeToken }, 201);
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
    const methods = recoveryOf(signedIn.email);
    const staged = (value: string) => ({ value, requestedAt: new Date().toISOString(), usableAt: new Date(Date.now() + 7 * 86_400_000).toISOString() });
    if (path === '/v1/me/recovery') return ok(route, methods);
    if (path === '/v1/me/recovery/email') {
      const [local = '', domain] = (body?.recoveryEmail ?? '').split('@');
      if (!domain) return fail(route, 422, 'VALIDATION_ERROR');
      methods.recoveryEmail.pending = staged(`${local.charAt(0)}***@${domain.toLowerCase()}`);
      return ok(route, methods);
    }
    if (path === '/v1/me/recovery/phone') {
      const digits = (body?.phone ?? '').replace(/\D/g, '');
      if (!body?.phone?.startsWith('+') || digits.length < 8) return fail(route, 400, 'BAD_REQUEST');
      methods.phone.pending = { ...staged(`***${digits.slice(-4)}`), verified: false };
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

  return state;
}

export async function signIn(page: Page, account = credentials) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'Home' }).waitFor();
}
