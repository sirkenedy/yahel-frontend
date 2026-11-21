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

const MAX_SECOND_STEP_ATTEMPTS = 5;
// The backend's rule for a new password: at least 8 characters with upper case, lower case, a number and a symbol.
const meetsPasswordPolicy = (password: string) => password.length >= 8 && [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].every((pattern) => pattern.test(password));

const ok = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta: { requestId: 'e2e' } }) });
const fail = (route: Route, status: number, code: string) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, code, message: code, meta: { requestId: 'e2e' } }) });

export interface MockApi {
  calls: { method: string; path: string; body: unknown; authorization: string | undefined }[];
}

export interface MockApiOptions {
  /** Every request fails as if the connection had dropped. */
  offline?: boolean;
  /** Sign-in attempts are refused as too many. */
  rateLimited?: boolean;
}

/** Stands in for the backend. Tokens rotate on every refresh so tests can tell them apart. */
export async function mockApi(page: Page, options: MockApiOptions = {}): Promise<MockApi> {
  const state: MockApi = { calls: [] };
  let issued = 0;
  const tokens = () => ({ accessToken: `access-${++issued}`, refreshToken: `refresh-${issued}`, expiresIn: 900, tokenType: 'Bearer' });
  let validRefresh: string | null = null;
  let validAccess: string | null = null;
  let signedIn = profile;
  const accounts = [
    { profile, password: credentials.password, twoStep: false },
    { profile: twoStepProfile, password: twoStepCredentials.password, twoStep: true },
  ];
  const challenges = new Map<string, { account: (typeof accounts)[number]; attempts: number }>();

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const body = request.postDataJSON() as Record<string, string> | null;
    const authorization = request.headers()['authorization'];
    state.calls.push({ method: request.method(), path, body, authorization });
    if (options.offline) return route.abort('internetdisconnected');

    const issue = (account: (typeof accounts)[number]) => {
      const next = tokens();
      validRefresh = next.refreshToken;
      validAccess = next.accessToken;
      signedIn = account.profile;
      return next;
    };

    if (path === '/v1/auth/login') {
      if (options.rateLimited) return fail(route, 429, 'TOO_MANY_REQUESTS');
      const account = accounts.find((known) => known.profile.email === body?.email && known.password === body.password);
      if (!account) return fail(route, 401, 'INVALID_CREDENTIALS');
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
    if (authorization !== `Bearer ${validAccess}`) return fail(route, 401, 'UNAUTHORIZED');
    if (path === '/v1/auth/logout') {
      validRefresh = null;
      validAccess = null;
      return ok(route, null, 201);
    }
    if (path === '/v1/me') return ok(route, signedIn);
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
