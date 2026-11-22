// STAND-IN. Missing endpoint: POST /v1/me/recovery/contact (session; invite someone the person trusts to
// vouch for them if every other way back in is lost). Nothing is sent. The fourth invitation in a page
// session is refused as rate limited.
//
// The real endpoint must answer the same way whether or not the invited address has a Yahel account,
// refuse the person's own addresses, email the contact for consent before they count, and be rate limited.
import type { TrustedContacts } from '../capabilities';
import { createLimiter } from './timing';
import type { Delay } from './timing';

export const createTrustedContactsStandIn = (delay: Delay): TrustedContacts => {
  const count = createLimiter(3);
  return {
    async invite() {
      await delay(600);
      count();
    },
  };
};
