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

/** The name of the environment flag that marks a build as one that stays on this machine: a local preview, or the browser tests. */
export const localBuildFlag = 'WEBSITE_LOCAL_BUILD';

/**
 * Pages written at build time carry the app's address in their links, for every reader and before any script runs.
 * So the build itself refuses an address a deployment cannot use, unless it was explicitly marked as a local build.
 */
export function assertWritable(appUrl: string, localBuild: string | undefined): void {
  if (appUrl.startsWith('https://') || localBuild === '1') return;
  throw new Error(`The pages would link account actions to ${appUrl}. Set VITE_APP_URL to the https address of the app, or set ${localBuildFlag}=1 for a build that is not deployed.`);
}

export const signInUrlFor = (appUrl: string) => `${appUrl}/sign-in`;
