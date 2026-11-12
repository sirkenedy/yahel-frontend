import { RouterProvider } from '@tanstack/react-router';
import '@yahel/ui/styles.css';
import '@yahel/ui/site.css';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { createSiteRouter } from './router';
import './site.css';

const root = document.getElementById('root')!;
const router = createSiteRouter();
const site = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

// The script in the head marks the root when the page written into it is the one for this address.
if (root.hasAttribute('data-page-current')) {
  // The page is already drawn. The router is told so, which stops it wrapping the page in a pending boundary the
  // written HTML does not have, and the page's own code is loaded before React takes the markup over.
  router.ssr = { manifest: undefined };
  // The bundler reports here when a page's own code cannot be fetched. The router does not: it would have React
  // draw the failure over a page that is already readable.
  let pageCodeArrived = true;
  window.addEventListener('vite:preloadError', () => (pageCodeArrived = false), { once: true });
  router
    .load()
    .then(() => {
      if (!pageCodeArrived) throw new Error('The page could not be loaded');
      hydrateRoot(root, site);
    })
    // What was written stays as it is, readable, with links that load their pages whole. The bar goes back to its
    // links, since nothing can open the menu.
    .catch(() => document.documentElement.removeAttribute('data-scripts'));
} else {
  createRoot(root).render(site);
}
