export interface ReturnAddressPolicy {
  /** Where a signed-in person goes when no acceptable address was asked for. Its origin is always allowed. */
  fallback: string;
  /** Other origins a return address may point to, for example `https://mail.yahel.example`. */
  allowedOrigins: readonly string[];
}

const originOf = (address: string) => {
  try {
    return new URL(address).origin;
  } catch {
    return null;
  }
};

const isUnsafeCharacter = (char: string) => char === '\\' || char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f;

/**
 * Decides where to send someone after sign-in. An address from the page's query string is attacker
 * controlled, so it is used only when it is an absolute http(s) address, carries no credentials, and its
 * origin is on the list. Anything else gets the fallback.
 */
export function resolveReturnAddress(candidate: string | null | undefined, policy: ReturnAddressPolicy): string {
  if (!candidate) return policy.fallback;
  // Browsers read a backslash as a slash and strip tabs and newlines, which lets "https:\\evil.example" past naive checks.
  if ([...candidate].some(isUnsafeCharacter)) return policy.fallback;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return policy.fallback;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return policy.fallback;
  if (url.username || url.password) return policy.fallback;
  const allowed = [policy.fallback, ...policy.allowedOrigins].map(originOf);
  return allowed.includes(url.origin) ? url.href : policy.fallback;
}
