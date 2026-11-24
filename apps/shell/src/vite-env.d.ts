interface ImportMetaEnv {
  /** The backend, ending in `/api`. */
  readonly VITE_API_URL?: string;
  /** The accounts app, where people sign in, add an account and choose one. Unset, it is the accounts app's development address. */
  readonly VITE_ACCOUNTS_URL?: string;
  /** `local` lets a build fall back to development addresses. Set by `pnpm build`; never by a release. */
  readonly VITE_LOCAL_BUILD?: string;
}
