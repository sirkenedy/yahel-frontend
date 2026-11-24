export const consoleMessages = {
  loading: 'Loading',
  brand: 'Yahel',
  product: 'Admin',
  home: 'Go to Admin home',
  navigation: 'Admin',
  navHome: 'Home',
  navDomains: 'Domains',
  navUsers: 'Users',
  comingSoon: 'Coming soon',
  goToYahel: 'Go to Yahel',
  switchToDark: 'Use dark theme',
  switchToLight: 'Use light theme',
  workspace: (name: string) => `Workspace: ${name}`,
  failedTitle: 'Admin could not be opened',
  failed: 'Check your connection, then try again.',
  tryAgain: 'Try again',
} as const;

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
