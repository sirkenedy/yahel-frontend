// STAND-IN. Missing endpoints: GET /v1/auth/known-accounts and DELETE /v1/auth/known-accounts/{email}
// (the accounts that have signed in on this device, kept by the server against the device id so the
// chooser survives reloads and needs nothing in web storage). This list lives in memory and starts with
// two demo accounts. Removing an address that is not listed fails with 404.
//
// With the real endpoints the server records an account against the device at sign-in and marks it at
// sign-out. The client must not assert names, addresses or kinds, so `remember` leaves the interface then.
// The device id is the only key to the list and must be treated as a secret.
import type { AccountDirectory, KnownAccount } from '../capabilities';
import { ApiError } from '../errors';
import { demoAccounts } from './demo-data';
import type { Delay } from './timing';

export const createDirectoryStandIn = (delay: Delay): AccountDirectory => {
  let accounts: KnownAccount[] = [...demoAccounts];
  return {
    async list() {
      await delay(200);
      return accounts;
    },
    async remember(account) {
      await delay(150);
      accounts = [account, ...accounts.filter((known) => known.email !== account.email)];
    },
    async remove(email) {
      await delay(300);
      if (!accounts.some((known) => known.email === email)) throw new ApiError({ status: 404, code: 'RESOURCE_NOT_FOUND', message: 'Account not found' });
      accounts = accounts.filter((known) => known.email !== email);
    },
  };
};
