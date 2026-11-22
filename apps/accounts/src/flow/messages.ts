/** Words every flow shares: the connection, the server, waits and the whole-screen states. A flow's own words stay in its feature. */
const locale = 'en-NG';
const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
const moment = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });

export const flowMessages = {
  pageTitle: (heading: string) => `${heading.replace(/[.?…]$/, '')} · Yahel`,
  /** A time for the person: the hour when it is today, the date with it on any other day, and `null` for a value that is not a time. Never throws. */
  timeOf: (at: number | string, now: number = Date.now()) => {
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) return null;
    return date.toDateString() === new Date(now).toDateString() ? time.format(date) : moment.format(date);
  },
  momentOf: (at: number) => moment.format(new Date(at)),
  /** Seconds as "0:24", for a wait shown in a control. */
  clock: (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,

  offlineLead: 'You’re offline.',
  offlineBar: 'What you’ve typed is safe on this device. We’ll carry on when you’re back.',
  offlineTitle: 'You’re offline',
  offlineText: 'We couldn’t send this step because there’s no connection. Everything you typed is still here.',
  unreachableTitle: 'We can’t reach Yahel right now',
  unreachableText: 'This step didn’t get through. Everything you typed is still here. Try again in a moment.',
  backOnline: 'You’re back online.',
  dismiss: 'Dismiss',
  slow: 'Still working. Your connection seems slow, so this is taking longer than usual.',
  tryAgain: 'Try again',
  serverErrorTitle: 'Something went wrong on our side',
  serverErrorText: 'We couldn’t finish this step. Nothing was lost.',
  reference: (id: string) => `Reference ${id}.`,
  tooManyTitle: 'Too many tries',
  tooManyText: 'Wait a few minutes, then try again.',
  tryAgainIn: (clock: string) => `Try again in ${clock}.`,
  tryAgainNow: 'You can try again now.',
  thingsToFix: (count: number) => `${count} things to fix before you continue`,
  listOf: (names: readonly string[]) => `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}.`,

  lockedTitle: 'Sign-in is paused for a while.',
  lockedLede: 'There were too many sign-in tries, so we’ve paused sign-in for a while. This keeps accounts safe.',
  lockedUntil: (at: string) => `You can try again at ${at}.`,
  lockedNote: 'Wait a few minutes, then try again.',
  resetPassword: 'Reset your password',
  backToSignIn: 'Back to sign in',
  suspendedTitle: 'This account is turned off.',
  suspendedLede: (email: string | null) => `${email ?? 'This account'} can’t sign in right now. Its mail and files are kept safe.`,
  suspendedNote: 'If you think this is a mistake, tell us and we’ll look into it. We usually reply within one working day.',
  contactSupport: 'Contact support',
  useAnotherAccount: 'Use another account',
  pausedTitle: 'Your organisation is paused.',
  pausedLede: (email: string | null) => `Your organisation’s workspace is paused, so ${email ?? 'this account'} can’t sign in right now. Nothing has been deleted.`,
  pausedNote: 'Ask your admin to reactivate the workspace.',
  linkExpiredTitle: 'This link has expired.',
  linkExpiredLede: 'For your safety, links in our emails only work for a limited time. Ask the person who sent it for a new one, or sign in if you already have an account.',
  linkUsedTitle: 'This invitation has already been used.',
  linkUsedLede: 'An invitation works once. Sign in if you already have an account, or ask the person who sent it for a new one.',
  signIn: 'Sign in',
  createAccount: 'Create an account',
  sessionEndedTitle: 'Your session has ended.',
  sessionEndedLede: 'For your security, Yahel signs you out after a while without activity. Sign in again to carry on.',
  signedOutTitle: 'We signed you out everywhere.',
  signedOutLede: 'Someone tried to use an old sign-in for this account, so we ended every session to keep it safe. Sign in again, then check your recent security activity.',
  signedOutNote: 'If this wasn’t you, change your password after you sign in.',
  signInAgain: 'Sign in again',
  maintenanceTitle: 'Yahel is getting an upgrade.',
  maintenanceLede: (until: string | null) => `${until ? `We’ll be back by ${until}.` : 'We’ll be back soon.'} Mail sent to you keeps arriving and nothing is lost.`,
  maintenanceWindow: (from: string, until: string) => `Planned maintenance runs from ${from} to ${until}.`,
  errorTitle: 'Something went wrong on our side.',
  errorLede: 'It’s not you. Try again, or go back to the start.',
  errorPageTitle: 'Something went wrong · Yahel',
  quoteThis: 'If you contact us, quote this',
  referenceLabel: 'Reference',
  timeLabel: 'Time',
  copy: 'Copy',
  copied: 'Copied',
} as const;
