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
- [ ] Forgot and reset password
- [ ] Translation and locale formatting; pseudo-locale and Arabic test runs
- [ ] UI components from specs, in the order features need them: dialog, toast, menu, list, toggle, checkbox, tabs, skeleton, empty state
- [ ] Account: edit profile, change password, sessions and devices, recovery options, two-step set-up
- [ ] Account switcher and personal versus organisation context
- [ ] App launcher and the shared top bar
- [ ] Error reporting and a top-level error boundary
- [ ] Staging smoke test against the real backend as a required check
- [ ] Component workshop (Storybook or equivalent) with visual regression

## Public website

- [x] Site scaffold (`apps/website`), motion primitives in `@yahel/ui`, and the About page
- [x] Careers page with the team filter, and static prerendering
- [ ] Home page with every product, scroll motion and the Products menu

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
