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
// passkey from using Admin: the interface's passkey step can be left, and Admin's address can be opened
// directly. What the backend must do: refuse every Admin endpoint (and any token scoped to Admin) to an
// administrator of a workspace who has no passkey, except the endpoints that register one and sign out;
// require a user-verified passkey sign-in for Admin once one exists, with the password left as a recovery
// path only; and record when the requirement was met. See docs/roadmap.md.
import type { AdminAccess } from '../capabilities';
import type { Delay } from './timing';

export const DEMO_ORGANISATION = 'Northwind Studio';

export const createAdminAccessStandIn = (delay: Delay, passkeys: { hasSaved(): boolean }): AdminAccess => ({
  async membership() {
    await delay(250);
    return { organisation: DEMO_ORGANISATION, administrator: true, hasPasskey: passkeys.hasSaved() };
  },
});
