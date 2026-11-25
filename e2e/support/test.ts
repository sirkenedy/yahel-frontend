import { test as base, expect } from '@playwright/test';
import type { Request } from '@playwright/test';

/** How Chromium, Firefox and WebKit report a request the page itself cancelled. A test's own `route.abort(...)` reads differently. */
const CANCELLED = /ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i;

const isApi = (url: string) => new URL(url).pathname.startsWith('/api/');

export interface RequestGuard {
  /**
   * Turns the guard off for this test, for one where a cancelled request is the behaviour under test.
   * The reason is required, so a reader can tell why.
   */
  allowCancelledRequests: (reason: string) => void;
}

/**
 * Every test fails when the app cancels a request to the API, as when cached data is cleared during the
 * navigation or mount that is loading it: the request shows as cancelled and is sent again (CLAUDE.md).
 */
export const test = base.extend<{ requestGuard: RequestGuard }>({
  requestGuard: [
    async ({ page }, use) => {
      const cancelled: string[] = [];
      let allowed = false;
      // While the page loads another document, what the old one had under way is abandoned with it, not sent again: it does not count.
      let leaving = false;
      const sent = (request: Request) => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) leaving = true;
      };
      const arrived = () => void (leaving = false);
      const failed = (request: Request) => {
        if (leaving || !isApi(request.url())) return;
        if (CANCELLED.test(request.failure()?.errorText ?? '')) cancelled.push(`${request.method()} ${request.url()}`);
      };
      page.on('request', sent);
      page.on('domcontentloaded', arrived);
      page.on('requestfailed', failed);
      await use({
        allowCancelledRequests: (reason) => {
          if (!reason.trim()) throw new Error('allowCancelledRequests needs a reason');
          allowed = true;
        },
      });
      page.off('request', sent);
      page.off('domcontentloaded', arrived);
      page.off('requestfailed', failed);
      if (!allowed) expect(cancelled, 'API requests the app cancelled (and so sent twice)').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
