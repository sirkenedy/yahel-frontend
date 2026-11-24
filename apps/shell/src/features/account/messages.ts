export const menuMessages = {
  trigger: (email: string) => `Account: ${email}`,
  panel: 'Accounts',
  signedInAs: 'Signed in as',
  manage: 'Manage your account',
  signOut: 'Sign out',
  others: 'Other accounts on this device',
  switchTo: 'Switch to',
  signInTo: 'Sign in to',
  signOutOf: (email: string) => `Sign out of ${email}`,
  signIn: 'Sign in',
  add: 'Add another account',
  signOutAll: 'Sign out of all accounts',
  privacy: 'Privacy',
  terms: 'Terms',
} as const;

export const accountWords = {
  personalAccount: 'Personal account',
  personal: 'Personal',
  signedOut: 'Signed out',
  admin: (organisation: string) => `Admin · ${organisation}`,
} as const;
