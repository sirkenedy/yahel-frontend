# Architecture

How the frontend is organised, and why. The rules that follow from it are in `rulebook.md`.

## 1. Shape

A pnpm monorepo. Nx runs tasks and caches them. Apps are client-rendered React applications built with Vite; each app builds and deploys on its own.

```
apps/
  shell/            home, account, the account menu; addresses carry the account's slot (/u/<slot>/); signing in is the accounts app's (VITE_ACCOUNTS_URL). Later: app launcher
  accounts/         sign in, account recovery, personal sign-up, workspace sign-up, an administrator's first sign-in
  <product>/        one app per product (mail, drive, calendar, …), added when its backend exists
packages/
  tokens/           design tokens: JSON source, build script, generated CSS and JSON
  ui/               component styles (CSS on tokens) and React components on React Aria; icons, fonts;
                    the Daylight flow components used by the accounts app
  api-client/       the only code that talks to the backend; types generated from its OpenAPI description;
                    account capabilities and the stand-ins for those the backend lacks
  auth/             session: sign-in, second step, token refresh, sign-out; passkeys (WebAuthn);
                    the return-address check; the only code that touches web storage
e2e/                browser tests: desktop, mobile, mobile Safari; accessibility and layout checks
design-system/      the written design system: principles, foundations, patterns, 60 component specs
docs/               this file, the rulebook, decisions, roadmap, agent pipeline
scripts/            deterministic checks used by CI and agents
.claude/            agent definitions, skills, permissions and hooks
.github/            CI and the agent workflows
```

One app per product keeps bundles small and failures contained: a broken Sheets build cannot stop Mail shipping. Apps share everything through packages and never import each other. Runtime micro-frontends are deliberately not used; build-time packages give the same independence with far less machinery.

## 2. Package boundaries

Each package declares one kind in `package.json` (`nx.tags`). `scripts/check-boundaries.mjs` enforces what may depend on what.

| Kind | Packages | May depend on |
|---|---|---|
| `type:app` | `apps/*` | `type:ui`, `type:data`, `type:tokens` |
| `type:ui` | `ui` | `type:tokens` |
| `type:data` | `api-client`, `auth` | `type:data` |
| `type:tokens` | `tokens` | nothing |

The check also rejects imports that reach into another package's `src/`, relative imports that leave a package, and imports of a workspace package that is not declared as a dependency. UI never depends on data: components take data and callbacks as props, so they can be tested and reused without a backend.

A further kind is planned as products arrive: `type:feature`, for logic shared by several apps (for example a file picker with its data), allowed to depend on ui and data.

## 3. Feature shape

Inside an app, code is grouped by feature, not by technical type.

```
apps/<app>/src/
  routes/                     file-based routes (TanStack Router). Compose features; no business logic
    __root.tsx
    sign-in.tsx
    _signed-in.tsx            layout route that requires a session
    _signed-in/…
  features/<feature>/
    messages.ts               every user-facing string
    <component>.tsx           presentational: props in, events out
    use-<thing>.ts            data hooks (TanStack Query) calling the API client
    <component>.test.tsx      unit tests beside the code
  session.ts, router.tsx, main.tsx
```

A feature exposes what routes need and nothing else. Features do not import other features; shared pieces move down into a package.

### 3.1 Flows (the accounts app)

A flow is a sequence of one-question screens: sign in, create an account, create a workspace. Each flow is a feature with the same parts.

```
apps/accounts/src/
  routes/<flow>/route.tsx       layout: loads the facts the guards need, mounts the provider and the frame
  routes/<flow>/<step>.tsx      one route per step; `beforeLoad` redirects to the step that can honestly be shown
  features/<flow>/
    machine.ts                  pure: typed steps, `reduce(state, event)`, `resumeStep`, `backOf`, step addresses
    store.ts                    the flow state for this page session (memory only)
    requests.ts                 every request the flow makes and where each outcome leads (`useFlowRequest`)
    <flow>-flow.tsx             the provider: joins the store and the requests into `{ state, actions, meta }`
    feedback.ts, validation.ts  the flow's rows of the feedback map, and field problems in plain words
    steps/<step>-step.tsx       presentational; reads the provider's context and nothing else
  flow/                         what every flow is built from; no feature's wording or state lives here
    use-flow-request.ts         a request owned by a flow (see below)
    feedback.ts                 the one mapping from a failure to what the person sees (see below)
    messages.ts                 words every flow shares: connection, server, waits, the whole-screen states
    state-screen.tsx            the whole-screen states a server answer can lead to
    resend-link.tsx, use-waits.ts, toasts.ts   the resend cool-down, slow and countdown clocks, the connection, the toast
    use-step-field.ts           one field of a step: value, problem, a server refusal, submit, focus on the problem; `useStepFields` for several
    use-step-travel.ts          which way the person moved and how many steps they have seen
    flow-store.ts               the in-memory store a flow's `reduce` drives
    email-confirmation.ts       signing in with a password still to be confirmed, and confirming it with the emailed code (F-50, F-68)
    phone-country-select.tsx    a phone number's country
    step-frame.tsx              the way back, the question, the page title, and whatever a request has to tell
  features/chrome/              the frame around every flow: brand, theme control, footer
  config.ts                     every outbound address, from `VITE_*` settings; nothing is derived from the host
```

- **Every step has an address**, so Back, Forward and links work. **Flow state is never in the address or in web storage.** A reload therefore starts the flow again, except that a restored session goes straight to the signed-in screen.
- **Flows share code through `src/flow/`, never through each other.** A feature may import `flow/` and packages; it may not import another feature (rulebook 1.3). What goes in `flow/` takes its words and its state as arguments.
- **Steps do not call the API, the session or the router.** The flow's requests do (`requests.ts`), each through `useFlowRequest`: a TanStack mutation that ignores a second press, cannot be stranded by leaving the step, and keeps no password, code or token after it settles.
- **A release build names its addresses.** `apps/accounts/src/build/build-guards.ts` fails a build that would fall back to a development address or ship stand-ins; `pnpm build` opts into local addresses, `build:release` does not. A demo build is exempt only with stand-ins on. And a built bundle checks where it is running before it mounts (`deployment.ts`): served from anywhere but this machine without https addresses for the backend and the app, it logs why and renders nothing.
- **Sign-in, personal, business and admin are separate route groups** (`/signin`, `/personal`, `/business`, `/admin`) because they will be served from different addresses. Where someone goes after signing in is decided by `resolveReturnAddress` in `@yahel/auth`, which accepts only origins listed in `VITE_APP_URL` and `VITE_RETURN_ORIGINS`. Someone sent with a `return` (as the shell sends everyone) goes back as soon as they are signed in; the app's own home becomes that account's `/u/<slot>/`. The shell names one of this browser's accounts only by its handle (`/signin?account=<handle>`), never by its address (F-93).

- **A flow that creates something does it in one resumable request.** Personal sign-up collects every answer first and creates the account only on "Agree and create account" (`features/personal/requests.ts`, `create`): register, sign in, set up. Each part is recorded in the flow state as it completes, so a retry skips what is done and the account is created once. What needs the account (the emailed code for an existing address, the texted code, saving the passkey) comes after it, whatever the drawings' order (`decisions.md` F-39, F-43).
- **One mapping from a failure to feedback** (`flow/feedback.ts`, from the designs' `FeedbackCodeMap`). `answerOf(error)` names the answer: the backend's code where the map names one, otherwise the status, and for no answer at all whether the device is offline or the service is not answering (both are banners on the step; only a declared outage takes its place). A row describes the feedback: where it shows (`field`, `banner` or `screen`), the tone, the words, the next action. `describeFailure(error, rows)` picks the row and adds only an id to quote and when to try again. A flow's `feedback.ts` holds its rows per thing attempted, spread over `commonRows`; `useFlowRequest` keeps the described feedback, and steps hand their requests to the step frame. The frame shows a banner above the form, replaces the step with a whole-screen state, or leaves a `field` feedback to the field that names it (`forField`, `useStepField({ refusal })`). Nothing the server wrote reaches the screen, and no row says whether an account exists.
- **A failed screen never shows the router's own error page.** A step that throws is replaced inside the frame by a plain message with a retry (the "Error" whole-screen state, `features/chrome/error-screen.tsx`); a layout or guard that throws gets the same with the frame; a boundary around the router catches the rest.
- **A flow offers only what something answers for.** Workspace sign-up is designed around plans, a checkout and a domain registrar, none of which the backend has. Its machine takes those as facts (`BusinessFacts`, from the capabilities): with them, the designed steps (the account is created before the plan, and payment follows the phone check, F-97); without them, a domain already owned and then the workspace, which is what `POST /auth/register-business` does. A release build therefore has a real flow and no pretend payment.
- **Card details are a step's, not the flow's.** The checkout screen (demo builds only) holds the card in its fields, hands it once to a request, and keeps of it the network and last four digits. Nothing about a card or a bank's code is in the flow state, an address, web storage or the query client (`decisions.md` F-73).
- **Each flow's screens are one file** (`vite.config.ts`, `codeSplitting`), loaded when the flow is first shown; the entry contains none. What only steps are built from (fields, the step frame, the whole-screen states) is a third file, `step-kit`. A layout's error screen travels with the layout (F-85).
- **An administrator's first steps** (`features/admin/`, F-80, F-97) are reached from workspace sign-up's Ready, which hands over the address, the business's name, the phone challenge registration answered with and, for a bought domain, the business phone, through the `/admin` guard; and from sign-in, when it is answered with a phone challenge. No session exists until the texted code is checked (`completePhoneCheck`); the challenge token is held in memory only. Once signed in, its guards land on the first thing not done (phone, welcome, passkey); after the welcome a new workspace goes on to its plan and checkout and comes back for the passkey, which is recommended, with "Not now" (F-98).

### 3.2 Capabilities and stand-ins

Some designed features have no backend endpoint yet: a texted second-step code, recovery by phone, help finding an account, the two choices on the sign-up review, the window of planned maintenance, and for a new workspace domains to buy, and plans, prices and checkout. Passkey sign-in, passkey creation for a signed-in account and an administrator's access are real in every build (`decisions.md` F-106, F-107). Each is a small interface in `packages/api-client/src/capabilities.ts`. `createAccountCapabilities` is the one place that decides what answers each: the real endpoint, nothing (`null`, and the interface then does not offer the feature), or a stand-in.

Stand-ins live in `packages/api-client/src/standins/`, each headed by the endpoint it is waiting for. They touch no network and are reachable only through the separate entry `@yahel/api-client/standins`, which an app imports behind `VITE_STAND_INS=on`. Three things keep them from shipping by accident: a normal build does not contain the module at all; a build with the flag on fails unless `VITE_STAND_INS_ALLOW_BUILD=demo` is also set (`apps/accounts/src/build/build-guards.ts`); and while any stand-in is active the app shows a fixed "Demo data" label. The stand-ins and the endpoint each needs are listed in `roadmap.md`.

## 4. Data

- **Server state** lives in TanStack Query. Query keys start with the feature name and include the account context, so personal and organisation data can never share a cache entry.
- **Session state** lives in `@yahel/auth` (a small store). A browser holds up to ten accounts; each has a **slot** (0 to 9, in app addresses as `/u/<slot>/`) and a **handle** (an opaque name for it in this browser only). The refresh token of each is an `HttpOnly` cookie set by the API (`__Host-yahel_rt_<slot>`), so no script ever holds one; every request goes with `credentials: 'include'` and `X-Yahel-Client: web`. A tab uses one slot at a time and keeps, in memory only, an access token per slot it has used. Refreshing is by slot, one at a time per slot across tabs (Web Locks); an answer naming another handle means the slot changed hands, and the tab drops it rather than carry on as someone else. Tabs tell each other of sign-ins, sign-outs and removals over a `BroadcastChannel`, never with a token. The accounts app keeps the tab's slot in session storage so a reload returns to it; nothing else about a session is stored. See `decisions.md` F-89 to F-92.
- **Local interface state** stays in components. Add a store only when several distant components need the same state.
- **The API client** unwraps the backend's `{ success, data, meta }` envelope, turns failures into `ApiError` (status, backend code, request id, validation errors), and retries once after refreshing an expired token.
- **The contract.** `packages/api-client/spec/openapi.json` is a committed snapshot of the backend's description; `src/schema.d.ts` is generated from it. `pnpm api:check` fails if they drift. The backend does not yet describe response bodies, so response types in `src/types.ts` are written by hand from the backend source. Asking the backend to declare responses is on the roadmap.

## 5. Interface

- Apps use `@yahel/ui` components only. Each component is built from its spec in `design-system/docs/components/`.
- Styles are plain CSS on `--ws-*` tokens. There is no CSS-in-JS and no utility framework: the token layer is the abstraction.
- Behaviour and accessibility come from React Aria Components, wrapped so apps never import it directly.
- Light, dark and increased-contrast versions of both come from the token CSS and follow system settings.
- **Daylight** is the look of the account flows: paper canvas, one indigo action, Bricolage Grotesque headlines. It is a named set of tokens beside the existing ones (`color.daylight.*`, `flow.*`, type roles `flow-*`) with its own stylesheet, `@yahel/ui/daylight.css`, so apps that show no flow do not load it. Its contrast pairs are checked by the token build like every other.

## 6. Quality gates

Every pull request must pass all of these. They are what makes unattended merging acceptable.

| Gate | What it proves | Where |
|---|---|---|
| Boundaries | Packages depend only on what they may | `scripts/check-boundaries.mjs` |
| Tokens | Contrast holds in four themes; component CSS uses only real tokens | `packages/tokens`, `packages/ui/scripts` |
| Contract | Generated API types match the committed description | `scripts/api-sync.mjs --check` |
| Lint | Accessibility rules, no `fetch`, storage or raw React Aria in apps, no `any` | `eslint.config.mjs` |
| Types | Strict TypeScript across every package | `tsc` |
| Unit tests | Behaviour of the client, session, components and features | Vitest |
| Build and budget | It builds; bundles stay within size budgets | `scripts/check-bundle-budget.mjs` |
| Browser tests | Each flow works on desktop, mobile and mobile Safari. The accounts app is tested as a demo build (stand-ins on) served on its own port | Playwright |
| Accessibility and layout | Every screen in four themes; no sideways scroll; touch targets; 200% text; right to left | `e2e/quality.spec.ts` |
| Security | No known-vulnerable shipped dependency, no secret in history, static analysis clean | CI `security`, `codeql` |
| Protected paths | The rules themselves did not change without a maintainer | `scripts/agent/check-protected-paths.mjs` |
| Agent review | Four independent reviewers approved: code, design, security, QA | `.github/workflows/agent-review.yml` |

## 7. Not built yet

Recorded so nobody assumes otherwise: any enforcement of passkeys for Admin (the backend's, F-81, F-98), payment for a workspace (the checkout is a design stand-in, `decisions.md` F-73), translation and locale handling, the app launcher, offline storage, real-time (Socket.IO) wiring, error reporting, and every product app. They are in `roadmap.md`.
