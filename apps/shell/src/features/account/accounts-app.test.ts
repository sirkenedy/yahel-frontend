import { describe, expect, it } from 'vitest';
import { accountsAppAddresses } from './accounts-app';

const app = accountsAppAddresses({ accountsUrl: 'https://accounts.yahel.example/', home: 'https://app.yahel.example/' });

describe('accountsAppAddresses', () => {
  it('sends sign-in and adding an account to the accounts app, asking to come back here', () => {
    expect(app.signIn()).toBe('https://accounts.yahel.example/signin?return=https%3A%2F%2Fapp.yahel.example%2F');
    expect(app.addAccount()).toBe('https://accounts.yahel.example/signin/email?return=https%3A%2F%2Fapp.yahel.example%2F');
  });

  it('names a signed-out account by its handle, never its address, and drops a handle of the wrong shape', () => {
    expect(app.signInTo('k7Qd3rLm0pA2bXyZw9TcVe')).toBe('https://accounts.yahel.example/signin?account=k7Qd3rLm0pA2bXyZw9TcVe&return=https%3A%2F%2Fapp.yahel.example%2F');
    expect(app.signInTo('amara@yahel.example')).toBe(app.signIn());
    expect(app.signInTo('short')).toBe(app.signIn());
  });
});
