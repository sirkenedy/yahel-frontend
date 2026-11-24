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

export const config = {
  apiUrl: env.VITE_API_URL ?? 'http://localhost:3200/api',
  /** The accounts app: sign-in, adding an account and the chooser all happen there (F-93). */
  accountsUrl: webAddress(env.VITE_ACCOUNTS_URL) ?? 'http://localhost:5175/',
  /** Admin as the account in `slot`, for an administrator's "Admin console"; `null` while Admin has no address. */
  adminHome: (slot: number) => {
    const admin = webAddress(env.VITE_ADMIN_URL);
    return admin ? new URL(`u/${slot}/`, admin).href : null;
  },
} as const;
