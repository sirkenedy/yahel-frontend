interface ImportMetaEnv {
  /** The backend, ending in `/api`. */
  readonly VITE_API_URL?: string;
  /** Where a signed-in person is sent when no other address was asked for. */
  readonly VITE_APP_URL?: string;
  /** Further origins a `return` address may point to, comma separated. */
  readonly VITE_RETURN_ORIGINS?: string;
  /** Where "Create an account" leads. Unset, it is `/personal` in this app. */
  readonly VITE_SIGN_UP_URL?: string;
  /** Where "Have an account? Sign in" leads. Unset, it is `/signin` in this app. */
  readonly VITE_SIGN_IN_URL?: string;
  /** `on` offers workspace sign-up in a release build; `off` withholds it from a demo build. Unset, only a demo build offers it. */
  readonly VITE_BUSINESS_SIGN_UP?: string;
  /** Where "For my business or team" leads, when workspace sign-up is offered. Unset, it is `/business` in this app. */
  readonly VITE_BUSINESS_SIGN_UP_URL?: string;
  /** Where a new workspace's administrator signs in. Unset, it is the sign-in address. */
  readonly VITE_ADMIN_SIGN_IN_URL?: string;
  /** The agreements a workspace's administrator accepts. Unset, each is named without a link. */
  readonly VITE_BUSINESS_TERMS_URL?: string;
  readonly VITE_TRIAL_TERMS_URL?: string;
  readonly VITE_DOMAIN_TERMS_URL?: string;
  /** The domain of a new Yahel address, without the @. Unset, it is `yahel.com`. */
  readonly VITE_MAIL_DOMAIN?: string;
  readonly VITE_HELP_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
  readonly VITE_TERMS_URL?: string;
  /** `on` serves features the backend lacks from stand-ins. Never set for a real build. */
  readonly VITE_STAND_INS?: string;
  /** `local` lets a build fall back to development addresses. Set by `pnpm build`; never by a release. */
  readonly VITE_LOCAL_BUILD?: string;
}
