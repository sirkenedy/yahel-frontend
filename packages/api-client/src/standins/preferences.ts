// STAND-IN. Missing endpoint: PATCH /v1/me/preferences (session; whether the person asked for product
// news by email, and for their activity to be kept to improve suggestions). The choices go nowhere.
//
// The real endpoint must record each choice with when it was made, treat a missing choice as "no", and
// never be switched on by anything but the person.
import type { SignUpPreferences } from '../capabilities';
import type { Delay } from './timing';

export const createPreferencesStandIn = (delay: Delay): SignUpPreferences => ({
  async save() {
    await delay(200);
  },
});
