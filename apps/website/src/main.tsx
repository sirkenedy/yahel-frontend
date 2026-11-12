import { RouterProvider } from '@tanstack/react-router';
import '@yahel/ui/styles.css';
import '@yahel/ui/site.css';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { isPrerenderedFor } from './prerendered';
import { createSiteRouter } from './router';
import './site.css';

const root = document.getElementById('root')!;
const router = createSiteRouter();
const site = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

if (isPrerenderedFor(root.dataset.page, window.location)) {
  // The page is already drawn. The router is told so, which stops it wrapping the page in a pending boundary the
  // written HTML does not have, and the page's own code is loaded before React takes the markup over.
  router.ssr = { manifest: undefined };
  void router.load().then(() => hydrateRoot(root, site));
} else {
  createRoot(root).render(site);
}
