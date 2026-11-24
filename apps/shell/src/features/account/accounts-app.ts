/** A handle names an account in this browser only; the accounts app looks it up. It is opaque, so only its shape is checked. */
const HANDLE = /^[A-Za-z0-9_-]{8,64}$/;

export interface AccountsAppAddresses {
  /** The accounts app, with a trailing slash. */
  accountsUrl: string;
  /** Where the accounts app sends the person once signed in: this app's home, which it gives the account's slot. */
  home: string;
}

/**
 * The addresses in the accounts app the shell sends people to. Never an email address: only the account's
 * opaque handle, which means nothing outside this browser (rulebook 4.1).
 */
export function accountsAppAddresses({ accountsUrl, home }: AccountsAppAddresses) {
  const at = (path: string, search: Record<string, string> = {}) => {
    const url = new URL(path, accountsUrl);
    for (const [name, value] of Object.entries({ ...search, return: home })) url.searchParams.set(name, value);
    return url.href;
  };
  return {
    /** Sign-in; its chooser decides between the list and the email step. */
    signIn: () => at('signin'),
    /** The email step, empty: adding an account beside the others. */
    addAccount: () => at('signin/email'),
    /** The password step for a signed-out account of this browser, or the chooser if the handle is not one. */
    signInTo: (handle: string) => (HANDLE.test(handle) ? at('signin', { account: handle }) : at('signin')),
  };
}

export type AccountsApp = ReturnType<typeof accountsAppAddresses>;
