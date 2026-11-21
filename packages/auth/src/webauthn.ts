// WebAuthn speaks in bytes; the server speaks in base64url text.

export const toBytes = (base64url: string) => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

export const toBase64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Closing the prompt and letting it time out are not errors to show. */
export const isDismissal = (error: unknown) => error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError');
