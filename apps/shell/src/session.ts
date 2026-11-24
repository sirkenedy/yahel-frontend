import { accountsAppAddresses, createBrowserSession } from '@yahel/auth';
import { config } from './config';

export const session = createBrowserSession(config.apiUrl);

// Where the accounts app sends the person back to once signed in: this app's home, which it gives the account's slot.
export const accountsApp = accountsAppAddresses({ accountsUrl: config.accountsUrl, home: new URL('/', window.location.origin).href });
