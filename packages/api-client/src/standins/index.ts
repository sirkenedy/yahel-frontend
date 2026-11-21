// Stand-ins for account features the backend does not have yet. Nothing here touches the network.
// Imported only by an app built with VITE_STAND_INS=on; a normal build must not contain this module.
import type { StandIns } from '../account-capabilities';
import { createAddressStandIn } from './addresses';
import { createDirectoryStandIn } from './directory';
import { createHelpDeskStandIn } from './help-desk';
import { createPasskeyRegistrationStandIn } from './passkey-registration';
import { createPasskeyStandIn } from './passkeys';
import { createPreferencesStandIn } from './preferences';
import { createRecoveryByPhoneStandIn } from './recovery-by-phone';
import { createTextCodeStandIn } from './text-codes';
import { createTrustedContactsStandIn } from './trusted-contacts';
import { realDelay } from './timing';
import type { Delay } from './timing';

export const createStandIns = (delay: Delay = realDelay): StandIns => ({
  passkeys: createPasskeyStandIn(delay),
  textCodes: createTextCodeStandIn(delay),
  directory: createDirectoryStandIn(delay),
  recoveryByPhone: createRecoveryByPhoneStandIn(delay),
  helpDesk: createHelpDeskStandIn(delay),
  passkeyRegistration: createPasskeyRegistrationStandIn(delay),
  addresses: createAddressStandIn(delay),
  trustedContacts: createTrustedContactsStandIn(delay),
  preferences: createPreferencesStandIn(delay),
});

export { demoAccounts, demoProfile } from './demo-data';
