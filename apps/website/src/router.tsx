import { createRouter } from '@tanstack/react-router';
import type { RouterHistory } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// A link to a section glides there; a reader who asks for reduced motion is taken there at once.
const sectionScroll = () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? true : ({ behavior: 'smooth' } as const));

/** A new page starts at the top, Back returns to where the reader was, and pages cross-fade where the browser can. */
export const createSiteRouter = (history?: RouterHistory) =>
  createRouter({ routeTree, history, defaultPreload: 'intent', scrollRestoration: true, defaultViewTransition: true, defaultHashScrollIntoView: sectionScroll() });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createSiteRouter>;
  }
}
