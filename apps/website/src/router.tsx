import { createRouter } from '@tanstack/react-router';
import type { RouterHistory } from '@tanstack/react-router';
import { PageError } from './features/site-chrome/page-error';
import { routeTree } from './routeTree.gen';

/** A new page starts at the top, Back returns to where the reader was, and pages cross-fade where the browser can. */
export const createSiteRouter = (history?: RouterHistory, { scrollRestoration = true } = {}) =>
  createRouter({ routeTree, history, defaultPreload: 'intent', scrollRestoration, defaultViewTransition: true, defaultErrorComponent: PageError });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createSiteRouter>;
  }
}
