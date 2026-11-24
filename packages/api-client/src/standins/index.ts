// Stand-ins for account features the backend does not have yet. Nothing here touches the network.
// Imported only by an app built with VITE_STAND_INS=on; a normal build must not contain this module.
import type { StandIns } from '../account-capabilities';
import { createDomainMarketStandIn } from './domain-market';
import { createHelpDeskStandIn } from './help-desk';
import { createPasskeyRegistrationStandIn } from './passkey-registration';
import { createPasskeyStandIn } from './passkeys';
import { createPreferencesStandIn } from './preferences';
import { createRecoveryByPhoneStandIn } from './recovery-by-phone';
import { createServiceStatusStandIn } from './service-status';
import { createTextCodeStandIn } from './text-codes';
import { createWorkspaceBillingStandIn } from './workspace-billing';
import { realDelay } from './timing';
import type { Delay } from './timing';

export const createStandIns = (delay: Delay = realDelay): StandIns => {
  const passkeyRegistration = createPasskeyRegistrationStandIn(delay);
  return {
    passkeys: createPasskeyStandIn(delay),
    textCodes: createTextCodeStandIn(delay),
    recoveryByPhone: createRecoveryByPhoneStandIn(delay),
    helpDesk: createHelpDeskStandIn(delay),
    passkeyRegistration,
    preferences: createPreferencesStandIn(delay),
    serviceStatus: createServiceStatusStandIn(delay),
    domainMarket: createDomainMarketStandIn(delay),
    workspaceBilling: createWorkspaceBillingStandIn(delay),
  };
};

export { demoProfile } from './demo-data';
