# Roadmap

What exists and what is next. Tick items when they merge; never delete or reorder them. Each unticked item becomes a spec issue, then task issues, when a maintainer approves it.

## Done

- [x] Monorepo, task runner, strict TypeScript, lint with accessibility and architecture rules
- [x] Design tokens package (four themes, contrast enforced) and component CSS layer
- [x] `@yahel/ui`: Button, TextField, Card, Banner, Avatar
- [x] `@yahel/api-client`: typed client generated from the backend description; error and envelope handling; token refresh
- [x] `@yahel/auth`: sign-in, session restore, sign-out
- [x] Shell app: sign-in, home, account (read-only), sign-out
- [x] Show and hide password on the sign-in form (`PasswordField` in `@yahel/ui`)
- [x] Browser tests on desktop and mobile with accessibility scans in four themes
- [x] CI, security scanning, protected paths, agent definitions, skills and workflows

## Next: foundation (in this order)

- [ ] Two-step sign-in (`POST /v1/auth/mfa/challenge`): code entry, backup code, trust this device
- [x] Account creation: personal (`/v1/auth/register`) and email verification (in the accounts app)
- [x] Forgot and reset password (in the accounts app)
- [ ] Translation and locale formatting; pseudo-locale and Arabic test runs
- [ ] UI components from specs, in the order features need them: dialog, toast, menu, list, toggle, checkbox, tabs, skeleton, empty state
- [ ] Account: edit profile, change password, sessions and devices, recovery options, two-step set-up
- [x] Account switcher: several accounts per browser, the chooser and the account menu, addresses carrying the slot (`/u/<slot>/`) (`decisions.md` F-89 to F-92)
- [ ] Personal versus organisation context
- [ ] App launcher and the shared top bar
- [ ] Error reporting and a top-level error boundary
- [ ] Staging smoke test against the real backend as a required check
- [ ] Component workshop (Storybook or equivalent) with visual regression

## Accounts app (`apps/accounts`, the Daylight designs)

- [x] Slice 1: the app, the Daylight tokens and flow components, sign in (email, password, passkey, second-step code from an app, a text or a backup code, account chooser, signed in), recovery (destination, code, new password) and account help
- [x] Slice 2: personal account creation (15 screens): type, name, date of birth, a new Yahel address or an existing email, password, passkey, ways back in, review, creating, the emailed and texted codes, ready, trusted contact
- [x] Slice 3: business workspace creation (13 screens): the business, the person, a domain owned or bought, the administrator’s sign-in, the plan, checkout and the bank’s code (both over stand-ins), creating, ready. Without stand-ins: a domain already owned, then the workspace
- [x] Slice 4: an administrator's first sign-in (6 screens): the password (with the emailed code when the address is still to be confirmed), a phone and its texted code, the welcome, and the passkey Admin requires. Since reshaped: the phone check before any session, no sign-in or emailed code of its own, and a passkey recommended with "Not now" (`decisions.md` F-96 to F-98). First built as F-80 to F-85; it is now reached wherever workspace sign-up is offered or sign-in holds a phone challenge, and the passkey is offered only where something saves one
- [x] Hand the shell's sign-in over to the accounts app (`VITE_ACCOUNTS_URL`, `decisions.md` F-93)
- [ ] "Trust this device" on the second step, "Keep me signed in", the language menu (decisions O-10). The account menu is done (F-91)

## Then: organisations

- [ ] Business sign-up and upgrade to business
- [x] Domain verification flow: Admin's Domains (status, the record, Verify, make primary, add, remove; F-110)
- [ ] Members: invite, bulk invite, suspend, reactivate, remove
- [ ] Accept invite and set password
- [ ] Notifications inbox and preferences

## Products (each needs its backend first)

- [ ] Mail
- [ ] Chat
- [ ] Drive
- [ ] Calendar
- [ ] Docs, Sheets, Slides (engine evaluation before any build)
- [ ] Meet
- [ ] Maps
- [ ] Admin console. Started (F-110): `apps/admin`, entered through the accounts app's chooser with an administrator account; Home and Domains. Next: Users (members), the designer's console, browser tests and a bundle budget (maintainer: `playwright.config.ts`, `scripts/check-bundle-budget.mjs`)

## Needs the backend team

- [ ] Refresh token as an `HttpOnly` cookie
- [ ] Response bodies declared in the OpenAPI description
- [ ] A pending TXT domain's record that can be shown again: `GET /tenants/{id}/domains` never carries the value (the token is stored hashed), so Admin can show it only in the page session that added the domain. Either keep the plaintext value (it is published in DNS anyway) or add a `POST …/domains/{domainId}/reissue` that answers with new instructions
- [ ] A dispatch to this repository when the API changes, so the contract watcher runs immediately
- [ ] `POST /v1/auth/register-business` and the workspace design brought into line (`decisions.md` O-16): the short name, an idempotency key, the display name, and the address checked before the domain remain. Done: `contactEmail` with the address taken as verified and a phone check before any session (F-96, F-97, F-99), no date of birth (F-100), and a domain check before creating (F-101). Business sign-up stays off in release builds unless `VITE_BUSINESS_SIGN_UP=on` (F-78) until O-16 (8) is met
- [ ] Registration that cannot be used to take over an address: a new registration replaces a pending one, or each emailed code is bound to the registration that issued it; unconfirmed identities expire; the answer does not depend on whether the address has an account, including for domains outside the public-provider list (`decisions.md` O-12, F-50)

### Stand-ins waiting for an endpoint

Each is in `packages/api-client/src/standins/`, behind an interface in `capabilities.ts`. When the endpoint exists: add the client method, select it in `createAccountCapabilities`, extend `e2e/support/api.ts`, delete the stand-in.

- [x] Passkey sign-in: now real, `POST /v1/auth/passkey/authenticate/begin` and `/finish` (simplewebauthn JSON; the challenge token goes from begin to finish; a phone check can come before the session, as after a password). The stand-in is removed (`decisions.md` F-107)
- [ ] Second-step code by text (`text-codes.ts`): `POST /v1/auth/mfa/challenge/sms` for an open challenge; the code is then accepted by the existing `POST /v1/auth/mfa/challenge`
- [x] Accounts known on this device: now real, `GET /v1/auth/accounts` and `DELETE /v1/auth/accounts/{handle}`, scoped to the browser's own cookie (the stand-in is removed, F-91)
- [ ] Recovery destinations and a texted reset code (`recovery-by-phone.ts`): `POST /v1/auth/recovery/options` returning masked destinations, identical for unknown addresses, and a `channel` on `POST /v1/auth/forgot-password`
- [ ] Help finding an account (`help-desk.ts`): `POST /v1/auth/account-help`
- [x] Address availability: now real, `POST /v1/auth/address-availability` (the name in the body; the stand-in is removed)
- [x] Passkey creation: now real for a signed-in account, `POST /v1/auth/passkey/register/begin` and `/finish` (session). There is no session-less creation: personal sign-up offers the passkey once the account exists (`decisions.md` F-107, F-108). The stand-in is removed
- [x] Trusted contact: now real, `PATCH /v1/me/recovery/trusted-contact` (the stand-in is removed)
- [ ] The two review choices (`preferences.ts`): `PATCH /v1/me/preferences`, or fields on `RegisterDto`
- [x] To add with slice 3: domain search and purchase, plans, checkout and the card code (the three below)
- [x] Whether a domain can be claimed: now real, `POST /v1/tenants/domain-claims/check` (the domain in the body; the stand-in is removed, `decisions.md` F-101)
- [ ] Domains to buy (`domain-market.ts`): `GET /v1/domains/search?q=`, with yearly prices; the purchase and the registrant’s details go with the workspace order
- [ ] Plans, prices, promo codes, quotes and checkout (`workspace-billing.ts`): `GET /v1/billing/plans?country=`, `POST /v1/billing/promo-codes/check`, `POST /v1/billing/quotes`, and a checkout session with a payment provider. **This stand-in is not a payment implementation, and the two screens built on it (checkout, the bank’s code) are the design only**
- [x] Admin access: now real, from `GET /v1/auth/contexts` (the current tenant context: its name and the member's role) and `GET /v1/auth/passkey/list` (whether there is a passkey). `passkeyRequired` is false until the server enforces the passkey rule (`decisions.md` F-86, F-106). The stand-in is removed
- [ ] The maintenance window (`service-status.ts`): `GET /v1/status`, answered while the API is down, with the window in progress; or `Retry-After` on the 503

### Placeholders the business must confirm

Everything below is copied from the design boards into the stand-ins (`workspace-billing.ts`, `domain-market.ts`) so the screens can be seen. None of it is a decision.

- [ ] The plan’s name, "Yahel Business", and its six listed features
- [ ] ₦5,000 a person a month; ₦4,200 a person a month when paid by the year ("Save 16%")
- [ ] A 14-day free trial for teams of up to 10; larger teams billed from the first day
- [ ] 7.5% VAT, not included in any price shown
- [ ] The promo code LAUNCH: 20% off for 3 months
- [ ] Domain prices a year: .com ₦18,500, .ng ₦9,000, .africa ₦22,000
- [ ] "Over 300 people? Talk to us about Enterprise" (the link goes to the help address)
- [ ] The currency for each country (the app sends an ISO 4217 code with the country; prices exist in naira only)

### Signals the feedback states need

The designs' map of answers to messages (`design-system/canvas/project/accounts/states/FeedbackCodeMap.dc.html`) depends on things the backend does not send today. Until each exists the app shows the nearest honest state (`decisions.md` F-57 to F-59).

- [ ] **`Retry-After` readable by browsers.** The rate limiter sends it, but CORS does not expose it (`exposedHeaders`), so the locked screen cannot say "You can try again at 14:32" and a 429 elsewhere cannot count down. The limiter's 429 should also carry `TOO_MANY_REQUESTS` (it arrives as `BAD_REQUEST`; the app goes by the status)
- [ ] **A code for a suspended account**, `ACCOUNT_SUSPENDED`, answered only after the password has matched. Today it is 403 `FORBIDDEN`, the same as an inactive membership, so the screen cannot say which
- [ ] **`TENANT_SUSPENDED` at login**, with the organisation's name (`meta.organisationName`). The code exists but login never raises it
- [ ] **Tries left on a code** (`meta.attemptsLeft` on `MFA_INVALID` and on a wrong emailed, texted or reset code), and whether a reset code was wrong or has expired
- [ ] **A pause after repeated wrong passwords**, if one is wanted: its length and how many tries are left, answered identically for an address with no account
- [ ] **Field codes in `VALIDATION_ERROR`** (`meta.fields: { field, code }[]`), so a refused registration can be told beside the right field
- [ ] **The single sign-on address** on `SSO_REQUIRED` (`meta.ssoUrl`, `meta.provider`)
- [ ] **A confirm-email path for sign-in**: built against today’s endpoints (`decisions.md` F-68). Better from the backend: `POST /v1/auth/verify-email` returning tokens when it is called with a proof of the password (a short-lived ticket on the `EMAIL_NOT_VERIFIED` answer), so the app need not hold the password while the code is fetched
- [ ] **A way to complete `FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED`** (a short-lived token in the answer); until then the person is sent to reset the password
- [ ] **A maintenance window** (see the stand-in above), and 503 rather than a dropped connection while the API is down, so "getting an upgrade" can be told from "not answering"
- [ ] **Error reporting** (already under Foundation): the error screen's reference is only shown when the failure carries a request id

### What each real endpoint must do

These are requirements on the backend, written down so the stand-ins are not mistaken for the contract. The same notes head each stand-in file.

- **Recovery destinations** (`POST /v1/auth/recovery/options`): for an address with no account, answer with a decoy of the same shape (the same number and kinds of destination, plausibly masked, stable for that address) and in the same time as for a real one. Otherwise the endpoint tells anyone whether an address has an account, and part of its phone number. Rate limit by address and by caller.
- **Passkey sign-in** (`/v1/auth/passkey/authenticate/begin` and `/finish`, real): the server uses its own relying-party id and checks the origin itself (`WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGINS`). `allowCredentials` must not differ between an address with passkeys, one without, and one with no account: return an empty list for everyone. Challenges are single use and short lived. `verify` issues the session the way `/auth/login` does: a slot in this browser and its refresh cookie.
- **Address availability** (`POST /v1/auth/address-availability`): it is a way to list who has an account. Answer only `available` true or false, with no reason; take the same time either way; rate limit by caller and by device strictly enough that walking a list of names is impractical; take the name in the body, never the address; offer only alternatives the server has itself checked. It is advice: `POST /v1/auth/register` remains the one place a name is claimed.
- **Passkey creation for someone signed in** (`POST /v1/auth/passkey/register/begin`, session, real): it answers with the account’s own stable user handle, lists the account’s existing passkeys in `excludeCredentials` (the app passes them to the device, so one device does not hold two), and binds the challenge to the session, so `verify` accepts it only from that session. For an administrator, the rules under “Admins must use a passkey” decide whether registering is allowed at all.
- **Trusted contact** (`POST /v1/me/recovery/contact`): answer the same way whether or not the invited address has an account, refuse the person’s own addresses, ask the contact’s consent by email before they count, and rate limit.
- **Review choices** (`PATCH /v1/me/preferences`): record each choice with when it was made; a missing choice is "no".
- **Register and email confirmation** (`POST /v1/auth/register`, `/auth/verify-email`, `/auth/verify-email/resend`), existing endpoints: today anyone can register someone else’s address with their own password and wait for the owner’s code to switch the account on. A new registration must replace a pending one, or a code must only confirm the registration that issued it; pending registrations must expire; and the answer to register must not depend on whether the address has an account. Until then the personal flow confirms only registrations it made itself or whose password it holds (`decisions.md` F-50). See also O-11 and O-12.
- **Workspace checkout** (`workspace-billing.ts`): card number, expiry, security code and the bank’s one-time code must never reach this app’s JavaScript or Yahel’s servers. The card form must be the payment provider’s hosted fields or a redirect, and the bank’s challenge the provider’s own page; `pay` and `confirm` then leave the interface. Prices and what is due are computed by the server from the order and never trusted from the client. The payment is authorised first and money is taken only once the workspace exists; creating the workspace and capturing the payment are one server-side operation keyed by the checkout session, so a retry or a lost answer can neither make a second workspace nor charge twice; an authorisation whose workspace was refused is released by the server; and the outcome is read from the server (the provider’s webhook, then a status endpoint), never inferred in the browser.
- **Domains to buy** (`GET /v1/domains/search`): list only names just checked with the registrar, priced by the server; hold nothing for the asker; register and charge only with the workspace order, with privacy protection on for the registrant’s details.
- **Register a business** (`POST /v1/auth/register-business`), an existing endpoint: see `decisions.md` O-16. `contactEmail` and the phone check before a session exist (F-96, F-97); the app still offers the flow in a release only when `VITE_BUSINESS_SIGN_UP=on` (F-78), until claims are proven (below). It still needs an idempotency key (or an answer to a repeated registration that names its tenant): today a lost answer is recovered only by trying the password, which cannot tell a workspace from an unconfirmed personal sign-up (F-72).
- **Claims made through register-business** (`decisions.md` O-16 (8)): today any `username@domain` and any domain are accepted and the domain is held as pending. Needed before release builds offer workspace sign-up by default: proof of the domain, or at least of a contact mailbox, before a claim blocks anyone else (`DOMAIN_CONFLICT`); rate limiting by caller; and no sign-in lockout (`DOMAIN_NOT_VERIFIED`, login “Case B”) for existing users of a domain whose claim is unverified.
- **Admins must use a passkey** (`decisions.md` F-81, F-106): the interface only guides. Each of these is needed, or a stolen password still reaches Admin (sign in with it, register the thief’s own passkey, then sign in with that):
  1. Refuse every Admin endpoint, and any token scoped to Admin, to a workspace administrator with no passkey, except signing out and registering a passkey under (2) and (3); once one exists, require a user-verified passkey sign-in for Admin; and record when the requirement was met.
  2. Once the administrator has a passkey, allow another to be registered only within minutes of a user-verified passkey sign-in, never on a password-only session. The password is not a way into Admin: recovery without a passkey (a lost device) goes through a slower path that emails the account, and the workspace’s other administrators where there are any, and does not grant Admin at once.
  3. Before the first passkey, allow registration only within minutes of a second factor the server verified itself **and that was bound to the account before the current session**. A phone set or confirmed on a password-only session does not count (a thief with the password can add their own number), nor does an emailed code to a mailbox the same password opens (a Yahel-hosted address). What counts: a phone confirmed in an earlier session and unchanged for a cooling-off period, where changing or adding an administrator’s phone needs a passkey or the current phone’s code, emails the account and restarts the period; or an emailed code to an address the same password cannot open (the first confirmation of a new workspace’s address, or an external recovery address). An administrator with neither goes through rule 2’s slower, notified path. The order of the app’s steps is not that check. A refusal needs a code of its own, so the app can ask for the texted code again rather than say the passkey could not be saved (O-18).
  4. Refuse an attestation whose authenticator data lacks the user-verified (UV) flag.
  5. Email the account every time a passkey is added.
  6. Issue a signed-in administrator’s registration challenge from the session endpoint (above): the account’s own user handle, `excludeCredentials`, and the challenge bound to the session.

  Until then nothing stops an administrator without a passkey from opening Admin's address directly, and the app keeps `passkeyRequired: false` (below).
- **Admin access** (`GET /v1/auth/contexts` and `GET /v1/auth/passkey/list`, real): the current context comes from the session's token, never from the request. `passkeyRequired` must become the server’s own statement that every rule under “Admins must use a passkey” is enforced for this workspace; until there is one the app assumes `false`.
- **Still missing** (stand-ins remain): the second-step code by text, recovery by phone, account help, the sign-up choices, the maintenance window, domains to buy, and plans, prices and checkout.
- **Second-step code by text** and **account help**: rate limit by challenge or by caller, and answer the same way whether or not anything was sent.
