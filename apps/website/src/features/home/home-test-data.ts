import type { HomeProduct } from './home-types';

/** The route supplies the real list; these stand in for it in this feature's tests. */
export const testProducts: readonly HomeProduct[] = [
  { id: 'mail', name: 'Mail', host: 'mail.yahel.com', line: 'Email on your personal address or your organisation’s domain.' },
  { id: 'calendar', name: 'Calendar', host: 'calendar.yahel.com', line: 'Plan your day and find time with other people.' },
  { id: 'drive', name: 'Drive', host: 'drive.yahel.com', line: 'Keep your files in one place, find them from anywhere and share them safely.' },
];

export const signInUrl = 'https://app.yahel.example/sign-in';

/** What can be reached: content inside an inert panel is in the page but out of reach. */
export const reachable = <T extends Element>(elements: T[]) => elements.filter((element) => element.closest('[inert]') === null);
