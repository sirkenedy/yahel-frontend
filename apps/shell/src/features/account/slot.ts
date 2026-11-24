/** The account's slot in an address (`/u/<slot>/…`), 0 to 9, or `null` when the address carries none. */
export const slotOf = (value: string | undefined): number | null => (value !== undefined && /^\d$/.test(value) ? Number(value) : null);

/** The slot in a whole path, for restoring the session before the router starts. */
export const slotInPath = (pathname: string) => slotOf(/^\/u\/(\d)(?:\/|$)/.exec(pathname)?.[1]);
