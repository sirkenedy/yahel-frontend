// STAND-IN. Missing endpoint: POST /v1/auth/account-help (a request from someone who cannot tell which
// account is theirs; support replies by email). The request goes nowhere. The fourth in a page session
// is refused as rate limited.
import type { AccountHelpDesk } from '../capabilities';
import { createLimiter } from './timing';
import type { Delay } from './timing';

export const createHelpDeskStandIn = (delay: Delay): AccountHelpDesk => {
  const count = createLimiter(3);
  return {
    async request() {
      await delay(700);
      count();
    },
  };
};
