const env = import.meta.env;

// An address from settings must not become a script or data link.
const webAddress = (value: string | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

const appUrl = webAddress(env.VITE_APP_URL) ?? 'http://localhost:5173/';

export const config = {
  apiUrl: env.VITE_API_URL ?? 'http://localhost:3200/api',
  /** The accounts app: signing in, adding an account and choosing one all happen there (F-93). */
  accountsUrl: webAddress(env.VITE_ACCOUNTS_URL) ?? 'http://localhost:5175/',
  /** The main app as the account in `slot`, for "Go to Yahel". */
  appHome: (slot: number) => new URL(`u/${slot}/`, appUrl).href,
  helpUrl: webAddress(env.VITE_HELP_URL),
} as const;
