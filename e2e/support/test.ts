import { test as base, expect } from '@playwright/test';
import type { Request } from '@playwright/test';

/** How Chromium, Firefox and WebKit report a request the page itself cancelled. A test's own `route.abort(...)` reads differently. */
const CANCELLED = /ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i;

const isApi = (url: string) => new URL(url).pathname.startsWith('/api/');
const nameOf = (request: Request) => `${request.method()} ${request.url()}`;

export interface RequestGuard {
  /**
   * Turns the guard off for this test, for one where a cancelled request is the behaviour under test.
   * The reason is required, so a reader can tell why.
   */
  allowCancelledRequests: (reason: string) => void;
}

/**
 * Every test fails when the app cancels a request to the API and then sends it again, as when cached data is
 * cleared during the navigation or mount that is loading it (CLAUDE.md). A request abandoned because the page
 * is leaving for another document is not sent again, so it does not count, whatever order the browser reports
 * the two in (WebKit reports the cancel before the next document's request).
 */
export const test = base.extend<{ requestGuard: RequestGuard }>({
  requestGuard: [
    async ({ page }, use) => {
      const repeated: string[] = [];
      let allowed = false;
      // What the current document has cancelled and not yet sent again; a new document starts empty.
      let cancelled = new Set<string>();
      const sent = (request: Request) => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) cancelled = new Set();
        else if (isApi(request.url()) && cancelled.delete(nameOf(request))) repeated.push(nameOf(request));
      };
      const failed = (request: Request) => {
        if (isApi(request.url()) && CANCELLED.test(request.failure()?.errorText ?? '')) cancelled.add(nameOf(request));
      };
      page.on('request', sent);
      page.on('requestfailed', failed);
      await use({
        allowCancelledRequests: (reason) => {
          if (!reason.trim()) throw new Error('allowCancelledRequests needs a reason');
          allowed = true;
        },
      });
      page.off('request', sent);
      page.off('requestfailed', failed);
      if (!allowed) expect(repeated, 'API requests the app cancelled and sent again').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
