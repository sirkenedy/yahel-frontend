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

const ok = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta: { requestId: 'e2e' } }) });
const fail = (route: Route, status: number, code: string) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: false, code, message: code, meta: { requestId: 'e2e' } }) });

export interface MockApi {
  calls: { method: string; path: string; body: unknown; authorization: string | undefined }[];
}

/** Stands in for the backend. Tokens rotate on every refresh so tests can tell them apart. */
export async function mockApi(page: Page, options: { offline?: boolean } = {}): Promise<MockApi> {
  const state: MockApi = { calls: [] };
  let issued = 0;
  const tokens = () => ({ accessToken: `access-${++issued}`, refreshToken: `refresh-${issued}`, expiresIn: 900, tokenType: 'Bearer' });
  let validRefresh: string | null = null;
  let validAccess: string | null = null;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const body = request.postDataJSON() as Record<string, string> | null;
    const authorization = request.headers()['authorization'];
    state.calls.push({ method: request.method(), path, body, authorization });
    if (options.offline) return route.abort('internetdisconnected');

    const issue = () => {
      const next = tokens();
      validRefresh = next.refreshToken;
      validAccess = next.accessToken;
      return next;
    };

    if (path === '/v1/auth/login') {
      return body?.email === credentials.email && body.password === credentials.password ? ok(route, issue(), 201) : fail(route, 401, 'INVALID_CREDENTIALS');
    }
    if (path === '/v1/auth/refresh') {
      return body?.refreshToken && body.refreshToken === validRefresh ? ok(route, issue(), 201) : fail(route, 401, 'INVALID_REFRESH_TOKEN');
    }
    if (authorization !== `Bearer ${validAccess}`) return fail(route, 401, 'UNAUTHORIZED');
    if (path === '/v1/auth/logout') {
      validRefresh = null;
      validAccess = null;
      return ok(route, null, 201);
    }
    if (path === '/v1/me') return ok(route, profile);
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
