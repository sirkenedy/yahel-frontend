import type { ReturnAddressPolicy } from '@yahel/auth';
import { isMailDomain } from './build/addresses';

const env = import.meta.env;

// Addresses come from deployment settings, but a mistyped one must not become a script or data link.
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
  returnPolicy: {
    fallback: appUrl,
    allowedOrigins: (env.VITE_RETURN_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
  } satisfies ReturnAddressPolicy,
  // Sign-in and sign-up may be served from different addresses; until they are, each is a path in this app.
  signInUrl: webAddress(env.VITE_SIGN_IN_URL) ?? '/signin',
  signUpUrl: webAddress(env.VITE_SIGN_UP_URL) ?? '/personal',
  /** Where "For my business or team" leads. Unset until that flow exists; the choice then says so. */
  businessSignUpUrl: webAddress(env.VITE_BUSINESS_SIGN_UP_URL),
  /** The domain of a new Yahel address. Must match the backend's `PLATFORM_EMAIL_DOMAIN`. */
  // A value that is not a domain is ignored rather than shown to people as the address they will get.
  mailDomain: isMailDomain(env.VITE_MAIL_DOMAIN) ? env.VITE_MAIL_DOMAIN!.trim().toLowerCase() : 'yahel.com',
  helpUrl: webAddress(env.VITE_HELP_URL),
  privacyUrl: webAddress(env.VITE_PRIVACY_URL),
  termsUrl: webAddress(env.VITE_TERMS_URL),
} as const;

export type AppConfig = typeof config;
