// STAND-IN. Missing endpoint: GET /v1/me/workspace (session). The demo answers that the signed-in person
// is the administrator of the demo organisation, and that they have a passkey once one has been saved
// through the passkey-registration stand-in in this page session.
//
// The real endpoint reads the workspace from the session's own token, never from anything the client
// sends: the tenant's display name, whether the member's role is owner or admin, and whether the identity
// has at least one passkey. It answers `null` for a personal session.
//
// "Admins must use a passkey" (the design brief) is a rule the SERVER has to enforce; this answer only lets
// the interface guide people. Until the backend enforces it, nothing stops an administrator without a
// passkey from using Admin: Admin's address can be opened directly. All of these are needed, or a stolen
// password still reaches Admin (sign in with it, register the thief's own passkey, sign in with that):
// 1. Refuse every Admin endpoint, and any token scoped to Admin, to an administrator of a workspace who has
//    no passkey, except signing out and registering a passkey as 2 and 3 allow; once one exists, require a
//    user-verified passkey sign-in for Admin; record when the requirement was met.
// 2. Once the administrator has a passkey, allow another only within minutes of a user-verified passkey
//    sign-in, never on a password-only session. The password is not a way into Admin: recovery without a
//    passkey goes through a slower path that emails the account, and the workspace's other administrators
//    where there are any, and does not grant Admin at once.
// 3. Before the first passkey, allow registration only within minutes of a second factor the server
//    verified itself AND that was bound to the account before the current session. A phone set or confirmed
//    on a password-only session does not count (a thief with the password can add their own number), nor
//    does an emailed code to a mailbox the same password opens (a Yahel-hosted address). What counts:
//    - a phone confirmed in an earlier session and unchanged for a cooling-off period; changing or adding an
//      administrator's phone needs a passkey or the current phone's code, emails the account, and restarts
//      the period;
//    - an emailed code to an address the same password cannot open: the first confirmation of a new
//      workspace's address, or an external recovery address.
//    An administrator with neither goes through 2's slower, notified path, not straight to a passkey and
//    Admin. The order of the app's steps is not that check.
// 4. Refuse an attestation whose authenticator data lacks the user-verified (UV) flag: the client's
//    `userVerification: 'required'` asks the device, it does not enforce anything.
// 5. Email the account every time a passkey is added.
// 6. Issue a signed-in administrator's challenge from the session endpoint (`beginForAccount`), with the
//    account's own user handle, its passkeys in `excludeCredentials`, and bound to the session.
// See docs/roadmap.md, "Admins must use a passkey".
//
// `passkeyRequired` is the server saying it enforces all of that. The real endpoint may answer `true` only
// once enforcement has shipped, and answers `false` until then; the interface then recommends a passkey
// without claiming Admin is closed (decisions F-86). This stand-in answers `true`, so the demo shows the
// designed screens.
import type { AdminAccess } from '../capabilities';
import type { Delay } from './timing';

export const DEMO_ORGANISATION = 'Northwind Studio';

export const createAdminAccessStandIn = (delay: Delay, passkeys: { hasSaved(): boolean }): AdminAccess => ({
  async membership() {
    await delay(250);
    return { organisation: DEMO_ORGANISATION, administrator: true, hasPasskey: passkeys.hasSaved(), passkeyRequired: true };
  },
});
