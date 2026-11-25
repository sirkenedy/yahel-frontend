interface ImportMetaEnv {
  /** The backend, ending in `/api`. */
  readonly VITE_API_URL?: string;
  /** The accounts app, where people sign in and choose an account. Unset, it is the accounts app's development address. */
  readonly VITE_ACCOUNTS_URL?: string;
  /** The main app, for "Go to Yahel". Unset, it is the app's development address. */
  readonly VITE_APP_URL?: string;
  /** Where "Learn more" and help lead, if anywhere. */
  readonly VITE_HELP_URL?: string;
  /** `local` lets a build fall back to development addresses. Set by `pnpm build`; never by a release. */
  readonly VITE_LOCAL_BUILD?: string;
}
