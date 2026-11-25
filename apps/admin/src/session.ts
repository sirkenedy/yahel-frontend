import { accountsAppAddresses, createBrowserSession } from '@yahel/auth';
import { config } from './config';

export const session = createBrowserSession(config.apiUrl);

// Signing in happens in the accounts app, which is asked for an administrator account and sends the person back to Admin's home as that account.
export const accountsApp = accountsAppAddresses({ accountsUrl: config.accountsUrl, home: new URL('/', window.location.origin).href, purpose: 'admin' });
