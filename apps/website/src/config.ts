const allowedSchemes = ['http:', 'https:'];

/** The origin of the signed-in app. Anything but an http or https address is a configuration mistake, never a link. */
export function resolveAppUrl(value: string | undefined): string {
  const raw = value?.trim() || 'http://localhost:5173';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('VITE_APP_URL must be an absolute http or https address');
  }
  if (!allowedSchemes.includes(url.protocol)) throw new Error('VITE_APP_URL must be an absolute http or https address');
  return url.origin;
}

export const signInUrlFor = (appUrl: string) => `${appUrl}/sign-in`;

export const signInUrl = signInUrlFor(resolveAppUrl(import.meta.env.VITE_APP_URL));
