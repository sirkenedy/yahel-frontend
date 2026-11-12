import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { signInUrl } from './config';
import { createSiteRouter } from './router';

/** The pages written to disk as HTML when the site is built. */
export const pages = ['/', '/about', '/careers'];

/** Where the written pages send account actions. The build says so when it is not an address a deployment can use. */
export const accountLinksTo = signInUrl;

const emptyRoot = '<div id="root"></div>';
const title = /^<title>[^<]*<\/title>/;

/**
 * One page as a whole document: the built `index.html` with the page drawn into its root and the page's title
 * in its head. The root is marked with the address it was drawn for, so the browser takes the markup over only there.
 */
export async function renderDocument(template: string, path: string) {
  if (!template.includes(emptyRoot) || !template.includes('</head>')) throw new Error('The built index.html has no empty root element to draw the page into');
  // The server's router keeps no scroll positions: it would add an inline script to the page to restore them.
  const router = createSiteRouter(createMemoryHistory({ initialEntries: [path] }), { scrollRestoration: false });
  await router.load();
  const markup = renderToString(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  const pageTitle = title.exec(markup)?.[0];
  if (!pageTitle) throw new Error(`The page at ${path} has no title`);
  return template.replace('</head>', () => `${pageTitle}\n  </head>`).replace(emptyRoot, () => `<div id="root" data-page="${path}">${markup.slice(pageTitle.length)}</div>`);
}
