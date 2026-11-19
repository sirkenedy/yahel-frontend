import { resolveAppUrl, signInUrlFor } from './app-url';

const address = import.meta.env.VITE_APP_URL;

function appUrl() {
  // While the pages are written at build time there is no host to judge by: `renderSite` refuses the address there.
  if (typeof window === 'undefined') return resolveAppUrl(address, { production: false, siteHost: '' });
  try {
    return resolveAppUrl(address, { production: import.meta.env.PROD, siteHost: window.location.hostname });
  } catch (error) {
    // A build that refuses to start takes the written page down with it: its account links were written for another place.
    document.getElementById('root')?.replaceChildren();
    throw error;
  }
}

export const signInUrl = signInUrlFor(appUrl());
