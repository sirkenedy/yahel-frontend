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
- [ ] Account creation: personal (`/v1/auth/register`) and email verification
- [x] Forgot and reset password (in the accounts app)
- [ ] Translation and locale formatting; pseudo-locale and Arabic test runs
- [ ] UI components from specs, in the order features need them: dialog, toast, menu, list, toggle, checkbox, tabs, skeleton, empty state
- [ ] Account: edit profile, change password, sessions and devices, recovery options, two-step set-up
- [ ] Account switcher and personal versus organisation context
- [ ] App launcher and the shared top bar
- [ ] Error reporting and a top-level error boundary
- [ ] Staging smoke test against the real backend as a required check
- [ ] Component workshop (Storybook or equivalent) with visual regression

## Accounts app (`apps/accounts`, the Daylight designs)

- [x] Slice 1: the app, the Daylight tokens and flow components, sign in (email, password, passkey, second-step code from an app, a text or a backup code, account chooser, signed in), recovery (destination, code, new password) and account help
- [ ] Slice 2: personal account creation (15 screens)
- [ ] Slice 3: business workspace creation (13 screens)
- [ ] Slice 4: an administrator's first sign-in (6 screens)
- [ ] Hand the shell's sign-in over to the accounts app (needs the refresh token as a cookie on a shared parent domain)
- [ ] "Trust this device" on the second step, "Keep me signed in", the language menu, the account menu on the signed-in screen (decisions O-10)

## Then: organisations

- [ ] Business sign-up and upgrade to business
- [ ] Domain verification flow
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
- [ ] Admin console

## Needs the backend team

- [ ] Refresh token as an `HttpOnly` cookie
- [ ] Response bodies declared in the OpenAPI description
- [ ] A dispatch to this repository when the API changes, so the contract watcher runs immediately

### Stand-ins waiting for an endpoint

Each is in `packages/api-client/src/standins/`, behind an interface in `capabilities.ts`. When the endpoint exists: add the client method, select it in `createAccountCapabilities`, extend `e2e/support/api.ts`, delete the stand-in.

- [ ] Passkey sign-in (`passkeys.ts`): `POST /v1/auth/passkeys/assertion/options` (challenge, relying-party id, allowed credentials) and `POST /v1/auth/passkeys/assertion/verify` (returns tokens as `/auth/login` does)
- [ ] Second-step code by text (`text-codes.ts`): `POST /v1/auth/mfa/challenge/sms` for an open challenge; the code is then accepted by the existing `POST /v1/auth/mfa/challenge`
- [ ] Accounts known on this device (`directory.ts`): `GET /v1/auth/known-accounts` and `DELETE /v1/auth/known-accounts/{email}`, scoped to the device id
- [ ] Recovery destinations and a texted reset code (`recovery-by-phone.ts`): `POST /v1/auth/recovery/options` returning masked destinations, identical for unknown addresses, and a `channel` on `POST /v1/auth/forgot-password`
- [ ] Help finding an account (`help-desk.ts`): `POST /v1/auth/account-help`
- [ ] To add with slice 2: address availability (`GET /v1/auth/address-availability`) and passkey registration (`/v1/me/passkeys/registration/options` and `/verify`)
- [ ] To add with slice 3: domain search and purchase, plans, checkout and the card code
