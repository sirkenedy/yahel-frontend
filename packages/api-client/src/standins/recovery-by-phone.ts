// STAND-IN. Missing endpoints: POST /v1/auth/recovery/options (the masked destinations a reset code can
// go to, answering identically for unknown addresses) and a `channel` field on POST /v1/auth/forgot-password
// so the code can be texted. Every address is offered the same masked demo number; nothing is sent.
// The fourth text in a page session is refused as rate limited.
import type { RecoveryChannels } from '../capabilities';
import { DEMO_PHONE } from './demo-data';
import { createLimiter } from './timing';
import type { Delay } from './timing';

export const createRecoveryByPhoneStandIn = (delay: Delay): Pick<RecoveryChannels, 'options' | 'send'> => {
  const count = createLimiter(3);
  return {
    async options() {
      await delay(250);
      return [{ method: 'phone', destination: DEMO_PHONE }];
    },
    async send() {
      await delay(500);
      count();
    },
  };
};
