export const menuMessages = {
  trigger: (email: string) => `Account: ${email}`,
  panel: 'Accounts',
  signedInAs: 'Signed in as',
  manage: 'Manage your account',
  signOut: 'Sign out',
  others: 'Other accounts on this device',
  showOthers: 'Show more accounts',
  hideOthers: 'Hide more accounts',
  switchTo: 'Switch to',
  signInTo: 'Sign in to',
  signOutOf: (email: string) => `Sign out of ${email}`,
  signOutThis: 'Sign out of this account',
  signedOut: 'Signed out',
  add: 'Add another account',
  signOutAll: 'Sign out of all accounts',
  privacy: 'Privacy',
  terms: 'Terms',
} as const;

export const accountWords = {
  personalAccount: 'Personal account',
  workAccount: 'Work account',
  admin: (organisation: string) => `Admin · ${organisation}`,
} as const;
