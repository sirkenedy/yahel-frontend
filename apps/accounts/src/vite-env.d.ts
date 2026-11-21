interface ImportMetaEnv {
  /** The backend, ending in `/api`. */
  readonly VITE_API_URL?: string;
  /** Where a signed-in person is sent when no other address was asked for. */
  readonly VITE_APP_URL?: string;
  /** Further origins a `return` address may point to, comma separated. */
  readonly VITE_RETURN_ORIGINS?: string;
  /** Where "Create an account" leads. The link is hidden while this is unset. */
  readonly VITE_SIGN_UP_URL?: string;
  readonly VITE_HELP_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
  readonly VITE_TERMS_URL?: string;
  /** `on` serves features the backend lacks from stand-ins. Never set for a real build. */
  readonly VITE_STAND_INS?: string;
  /** `local` lets a build fall back to development addresses. Set by `pnpm build`; never by a release. */
  readonly VITE_LOCAL_BUILD?: string;
}
