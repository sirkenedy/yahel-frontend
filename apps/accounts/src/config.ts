import type { ReturnAddressPolicy } from '@yahel/auth';

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
  signUpUrl: webAddress(env.VITE_SIGN_UP_URL),
  helpUrl: webAddress(env.VITE_HELP_URL),
  privacyUrl: webAddress(env.VITE_PRIVACY_URL),
  termsUrl: webAddress(env.VITE_TERMS_URL),
} as const;

export type AppConfig = typeof config;
