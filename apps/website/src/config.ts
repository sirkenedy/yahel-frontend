import { resolveAppUrl, signInUrlFor } from './app-url';

export const signInUrl = signInUrlFor(resolveAppUrl(import.meta.env.VITE_APP_URL, { production: import.meta.env.PROD, siteHost: window.location.hostname }));
