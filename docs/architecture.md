# Architecture

How the frontend is organised, and why. The rules that follow from it are in `rulebook.md`.

## 1. Shape

A pnpm monorepo. Nx runs tasks and caches them. Apps are client-rendered React applications built with Vite; each app builds and deploys on its own.

```
apps/
  shell/            sign-in, home, account. Later: app launcher, account switcher
  accounts/         sign in, account recovery. Later: personal sign-up, business sign-up, first admin sign-in
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
    use-step-field.ts           one field of a step: value, problem, submit, focus on the problem
    failure.ts, validation.ts   failures and field problems in plain words
    steps/<step>-step.tsx       presentational; reads the provider's context and nothing else
  features/chrome/              the frame around every flow: brand, theme control, footer
  config.ts                     every outbound address, from `VITE_*` settings; nothing is derived from the host
```

- **Every step has an address**, so Back, Forward and links work. **Flow state is never in the address or in web storage.** A reload therefore starts the flow again, except that a restored session goes straight to the signed-in screen.
- **Steps do not call the API, the session or the router.** The flow's requests do (`requests.ts`), each through `useFlowRequest`: a TanStack mutation that ignores a second press, cannot be stranded by leaving the step, and keeps no password, code or token after it settles.
- **A release build names its addresses.** `apps/accounts/src/build/build-guards.ts` fails a build that would fall back to a development address or ship stand-ins; `pnpm build` opts into local addresses, `build:release` does not.
- **Sign-in, personal and business are separate route groups** (`/signin`, `/personal`, `/business`) because they will be served from different addresses. Where someone goes after signing in is decided by `resolveReturnAddress` in `@yahel/auth`, which accepts only origins listed in `VITE_APP_URL` and `VITE_RETURN_ORIGINS`.

### 3.2 Capabilities and stand-ins

Some designed features have no backend endpoint yet: passkeys, the account chooser, a texted code, help finding an account. Each is a small interface in `packages/api-client/src/capabilities.ts`. `createAccountCapabilities` is the one place that decides what answers each: the real endpoint, nothing (`null`, and the interface then does not offer the feature), or a stand-in.

Stand-ins live in `packages/api-client/src/standins/`, each headed by the endpoint it is waiting for. They touch no network and are reachable only through the separate entry `@yahel/api-client/standins`, which an app imports behind `VITE_STAND_INS=on`. Three things keep them from shipping by accident: a normal build does not contain the module at all; a build with the flag on fails unless `VITE_STAND_INS_ALLOW_BUILD=demo` is also set (`apps/accounts/src/build/build-guards.ts`); and while any stand-in is active the app shows a fixed "Demo data" label. The stand-ins and the endpoint each needs are listed in `roadmap.md`.

## 4. Data

- **Server state** lives in TanStack Query. Query keys start with the feature name and include the account context, so personal and organisation data can never share a cache entry.
- **Session state** lives in `@yahel/auth` (a small store). The access token is held in memory only. The refresh token is in session storage, so it is gone when the tab closes. See `decisions.md`, F-4, for why and what should replace it.
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

Recorded so nobody assumes otherwise: personal and business sign-up and the first admin sign-in (slices 2 to 4 of the accounts app), a session shared between the accounts app and the others (needs the refresh token as a cookie, `decisions.md` O-1), translation and locale handling, the account switcher and app launcher, offline storage, real-time (Socket.IO) wiring, error reporting, and every product app. They are in `roadmap.md`.
