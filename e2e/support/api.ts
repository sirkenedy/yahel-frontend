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
// The backend's rule for a new password: at least 8 characters with upper case, lower case, a number and a symbol.
const meetsPasswordPolicy = (password: string) => password.length >= 8 && [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].every((pattern) => pattern.test(password));

const ok = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta: { requestId: 'e2e' } }) });
const fail = (route: Route, status: number, code: string) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, code, message: code, meta: { requestId: 'e2e' } }) });

export interface MockApi {
  calls: { method: string; path: string; body: unknown; authorization: string | undefined }[];
  /**
   * Makes the next request to `path` go wrong, once. A status answers with that failure and does nothing.
   * `lost` does what was asked and then drops the answer, as when a connection dies after the server has acted.
   */
  failNext(path: string, how: number | 'lost', code?: string): void;
}

interface Account {
  profile: typeof profile;
  password: string;
  twoStep: boolean;
  emailVerified: boolean;
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

export interface MockApiOptions {
  /** Every request fails as if the connection had dropped. */
  offline?: boolean;
  /** Sign-in attempts are refused as too many. */
  rateLimited?: boolean;
}

/** Stands in for the backend. Tokens rotate on every refresh so tests can tell them apart. */
export async function mockApi(page: Page, options: MockApiOptions = {}): Promise<MockApi> {
  const failures = new Map<string, { how: number | 'lost'; code?: string }>();
  const state: MockApi = { calls: [], failNext: (path, how, code) => void failures.set(path, { how, code }) };
  let issued = 0;
  const tokens = () => ({ accessToken: `access-${++issued}`, refreshToken: `refresh-${issued}`, expiresIn: 900, tokenType: 'Bearer' });
  let validRefresh: string | null = null;
  let validAccess: string | null = null;
  let signedIn = profile;
  const accounts: Account[] = [
    { profile, password: credentials.password, twoStep: false, emailVerified: true },
    { profile: twoStepProfile, password: twoStepCredentials.password, twoStep: true, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000003', globalId: 'g-kemi-001', email: takenAddress, firstName: 'Kemi', lastName: 'Adeyemi', displayName: 'Kemi Adeyemi' }, password: 'Harmattan-in-Ibadan-88', twoStep: false, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000004', globalId: 'g-kemi-002', email: registeredEmail, firstName: 'Kemi', lastName: 'Adeyemi', displayName: 'Kemi Adeyemi' }, password: 'Harmattan-in-Ibadan-88', twoStep: false, emailVerified: true },
    { profile: { ...profile, id: '64f000000000000000000005', globalId: 'g-pending-001', email: pendingEmail, firstName: 'Ngozi', lastName: 'Eze', displayName: 'Ngozi Eze' }, password: pendingPassword, twoStep: false, emailVerified: false },
  ];
  const recovery = new Map<string, ReturnType<typeof emptyRecovery>>();
  const recoveryOf = (email: string) => recovery.get(email) ?? recovery.set(email, emptyRecovery()).get(email)!;
  const challenges = new Map<string, { account: (typeof accounts)[number]; attempts: number }>();

  await page.route('**/api/v1/**', async (incoming) => {
    const request = incoming.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const body = request.postDataJSON() as Record<string, string> | null;
    const { how: failure, code: failureCode } = failures.get(path) ?? { how: undefined };
    failures.delete(path);
    // A lost answer: everything below still happens, but the browser never hears of it.
    const route = failure === 'lost' ? ({ fulfill: () => incoming.abort('connectionreset'), abort: (reason?: string) => incoming.abort(reason) } as unknown as Route) : incoming;
    const authorization = request.headers()['authorization'];
    state.calls.push({ method: request.method(), path, body, authorization });
    if (options.offline) return route.abort('internetdisconnected');
    if (typeof failure === 'number') return fail(route, failure, failureCode ?? (failure === 429 ? 'TOO_MANY_REQUESTS' : 'INTERNAL_SERVER_ERROR'));

    const issue = (account: (typeof accounts)[number]) => {
      const next = tokens();
      validRefresh = next.refreshToken;
      validAccess = next.accessToken;
      signedIn = account.profile;
      return next;
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
    if (path === '/v1/auth/verify-email') {
      const account = accounts.find((known) => known.profile.email === body?.email?.toLowerCase());
      if (!account || account.emailVerified || body?.token !== emailCode) return fail(route, 401, 'INVALID_TOKEN');
      account.emailVerified = true;
      return ok(route, { message: 'Email verified successfully' }, 201);
    }
    // Answers the same way whether or not the address has an account waiting to be confirmed.
    if (path === '/v1/auth/verify-email/resend') return ok(route, { message: 'If this email exists and is unverified, a new link has been sent' }, 201);
    if (path === '/v1/auth/login') {
      if (options.rateLimited) return fail(route, 429, 'TOO_MANY_REQUESTS');
      const account = accounts.find((known) => known.profile.email === body?.email?.toLowerCase() && known.password === body.password);
      if (!account) return fail(route, 401, 'INVALID_CREDENTIALS');
      if (!account.emailVerified) return fail(route, 403, 'EMAIL_NOT_VERIFIED');
      if (!account.twoStep) return ok(route, issue(account), 201);
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
      return ok(route, issue(challenge.account), 201);
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
    if (path === '/v1/auth/refresh') {
      return body?.refreshToken && body.refreshToken === validRefresh ? ok(route, issue(accounts.find((known) => known.profile === signedIn)!), 201) : fail(route, 401, 'INVALID_REFRESH_TOKEN');
    }
    // What the backend's auth guard answers for a missing, expired or revoked access token.
    if (authorization !== `Bearer ${validAccess}`) return fail(route, 401, 'SESSION_EXPIRED');
    if (path === '/v1/auth/logout') {
      validRefresh = null;
      validAccess = null;
      return ok(route, null, 201);
    }
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

export async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'Home' }).waitFor();
}
