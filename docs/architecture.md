# Architecture

How the frontend is organised, and why. The rules that follow from it are in `rulebook.md`.

## 1. Shape

A pnpm monorepo. Nx runs tasks and caches them. Apps are client-rendered React applications built with Vite; each app builds and deploys on its own. The public website is the one exception planned: it will be prerendered to static HTML (decisions F-19).

```
apps/
  shell/            sign-in, home, account. Later: app launcher, account switcher
  website/          the public site: home (every product, accounts, security, plans), about. No session and no backend calls; links out to the shell for sign-in
  <product>/        one app per product (mail, drive, calendar, …), added when its backend exists
packages/
  tokens/           design tokens: JSON source, build script, generated CSS and JSON
  ui/               component styles (CSS on tokens) and React components on React Aria; icons, fonts
  api-client/       the only code that talks to the backend; types generated from its OpenAPI description
  auth/             session: sign-in, token refresh, sign-out; the only code that touches web storage
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
| `type:app` | `apps/*` except the website | `type:ui`, `type:data`, `type:tokens` |
| `type:site` | `apps/website` | `type:ui`, `type:tokens` |
| `type:ui` | `ui` | `type:tokens` |
| `type:data` | `api-client`, `auth` | `type:data` |
| `type:tokens` | `tokens` | nothing |

The check also rejects imports that reach into another package's `src/`, relative imports that leave a package, and imports of a workspace package that is not declared as a dependency. UI never depends on data: components take data and callbacks as props, so they can be tested and reused without a backend. The public website is `type:site`, not `type:app`, so that adding the API client or the session to it fails the check.

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
- The public website adds one more stylesheet, `@yahel/ui/site.css` (display type, the site bar, link buttons, scroll reveal). Product apps do not import it. App CSS is held to the same token check as component CSS.

## 6. Quality gates

Every pull request must pass all of these. They are what makes unattended merging acceptable.

| Gate | What it proves | Where |
|---|---|---|
| Boundaries | Packages depend only on what they may | `scripts/check-boundaries.mjs` |
| Tokens | Contrast holds in four themes; component and app CSS use only real tokens | `packages/tokens`, `packages/ui/scripts` |
| Contract | Generated API types match the committed description | `scripts/api-sync.mjs --check` |
| Lint | Accessibility rules, no `fetch`, storage or raw React Aria in apps, no `any` | `eslint.config.mjs` |
| Types | Strict TypeScript across every package | `tsc` |
| Unit tests | Behaviour of the client, session, components and features | Vitest |
| Build and budget | It builds; bundles stay within size budgets | `scripts/check-bundle-budget.mjs` |
| Browser tests | Each flow works on desktop, mobile and mobile Safari | Playwright |
| Accessibility and layout | Every screen in four themes; no sideways scroll; touch targets; 200% text; right to left | `e2e/quality.spec.ts` |
| Security | No known-vulnerable shipped dependency, no secret in history, static analysis clean | CI `security`, `codeql` |
| Protected paths | The rules themselves did not change without a maintainer | `scripts/agent/check-protected-paths.mjs` |
| Agent review | Four independent reviewers approved: code, design, security, QA | `.github/workflows/agent-review.yml` |

## 7. Not built yet

Recorded so nobody assumes otherwise: translation and locale handling, the account switcher and app launcher, offline storage, real-time (Socket.IO) wiring, error reporting, and every product app. They are in `roadmap.md`.
