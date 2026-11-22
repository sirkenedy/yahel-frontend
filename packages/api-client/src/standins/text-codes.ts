// STAND-IN. Missing endpoint: POST /v1/auth/mfa/challenge/sms (send the second-step code by text for an
// open challenge). Nothing is sent. The code is still checked by the real POST /v1/auth/mfa/challenge.
// The fourth request in a page session is refused as rate limited.
import type { TextCodeSender } from '../capabilities';
import { DEMO_PHONE } from './demo-data';
import { createLimiter } from './timing';
import type { Delay } from './timing';

export const createTextCodeStandIn = (delay: Delay): TextCodeSender => {
  const count = createLimiter(3);
  return {
    async send() {
      await delay(500);
      count();
      return { destination: DEMO_PHONE };
    },
  };
};
