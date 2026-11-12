const localApp = 'http://localhost:5173';
const localHosts = ['localhost', '127.0.0.1', '[::1]'];

export interface AppUrlContext {
  /** A production build, as opposed to the development server or a test run. */
  production: boolean;
  /** The host the site itself is being served from. */
  siteHost: string;
}

/** A production build served from the developer's own machine: a local preview, or the browser tests. */
const isLocalPreview = (siteHost: string) => localHosts.includes(siteHost);

/**
 * The origin of the signed-in app, which every account action links to.
 * Development falls back to the local app. A deployed production build does not: with no address, or one
 * that is not https, the site refuses to start rather than send people who want to sign in somewhere else.
 */
export function resolveAppUrl(value: string | undefined, { production, siteHost }: AppUrlContext): string {
  const deployed = production && !isLocalPreview(siteHost);
  const raw = value?.trim();
  if (!raw) {
    if (deployed) throw new Error('VITE_APP_URL is not set. A deployed build needs the https address of the app.');
    return localApp;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('VITE_APP_URL must be an absolute http or https address');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('VITE_APP_URL must be an absolute http or https address');
  if (deployed && url.protocol !== 'https:') throw new Error('VITE_APP_URL must be an https address in a deployed build');
  return url.origin;
}

export const signInUrlFor = (appUrl: string) => `${appUrl}/sign-in`;
