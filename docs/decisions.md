# Decisions

Append only. Each entry says what was decided, why, and what was rejected. Design-system decisions are in `design-system/docs/decisions.md`.

| ID | Date | Decision | Why | Rejected |
|---|---|---|---|---|
| F-1 | 2026-11-12 | React 19, TypeScript, Vite, client-rendered. One app per product in a pnpm monorepo with Nx as task runner. | Every app sits behind sign-in and is highly interactive; server rendering adds cost without benefit. One app per product keeps bundles and failures separate. | Next.js; one large app; runtime micro-frontends. |
| F-2 | 2026-11-12 | TypeScript pinned to 5.9. | TypeScript 7 broke the API type generator (needs the 5.x compiler API) and is outside the range the lint tooling supports. | Latest TypeScript. Revisit when `openapi-typescript` and `typescript-eslint` support it. |
| F-3 | 2026-11-12 | Package boundaries are enforced by `scripts/check-boundaries.mjs`, not by Nx's lint rule. | In testing, the Nx rule skipped itself with a warning when its project graph cache was missing. A guard that can silently not run is not a guard. The script is deterministic and was tested against planted violations. | `@nx/enforce-module-boundaries`. |
| F-4 | 2026-11-12 | Access token in memory only; refresh token in session storage. | The backend returns both tokens in the response body. Memory-only access tokens limit what script injection can steal; session storage limits the refresh token to the tab's lifetime. | Local storage (survives longer, larger theft window). **Better, needs backend work:** deliver the refresh token as an `HttpOnly`, `Secure`, `SameSite` cookie so no script can read it. Until then a successful script injection could steal a refresh token. |
| F-5 | 2026-11-12 | Response types are hand-written in `packages/api-client/src/types.ts`. | The backend's OpenAPI description declares request bodies but no response bodies. | Guessing shapes; skipping types. **Needs backend work:** add response decorators so these can be generated. |
| F-6 | 2026-11-12 | Browser tests run against a mock backend in `e2e/support/api.ts`. | Fast, deterministic, no database needed in CI. | Running the real backend in CI for every pull request. A staging smoke test against the real backend is still needed (roadmap). |
| F-7 | 2026-11-12 | Mobile Safari (WebKit) tests run in CI only by default. | The current WebKit build does not run on the development machine's macOS version. Locally: `E2E_WEBKIT=1 pnpm e2e` on a supported system. | Dropping WebKit coverage. |
| F-8 | 2026-11-12 | The design system moved into this repository: tokens and UI code as packages, written docs under `design-system/`. This copy is canonical. | Agents here need the specs and tokens beside the code they govern. | Keeping it in the backend repository. The copy there should be removed to avoid two sources of truth. |
| F-9 | 2026-11-12 | Plain CSS on tokens; no CSS-in-JS, no utility framework. | The token layer already is the abstraction, and a check proves every value is a token. | Tailwind; styled-components. |
| F-10 | 2026-11-12 | Agents merge through GitHub auto-merge behind three required checks; no agent holds merge permission. | The owner asked for unattended merging once QA, desktop and mobile tests, all other tests and security checks pass with reviewer approval. Auto-merge makes GitHub, not an agent, the one that decides the checks are green. | Agents calling merge directly; requiring a human approval on every pull request. |
| F-11 | 2026-11-12 | The accessibility scan excludes React Aria's hidden live-announcer node. | After a pending button unmounts, the announcer keeps a reference to its label, which the scanner reports. It is invisible library plumbing, not product markup. | Disabling the rule everywhere. |
| F-12 | 2026-11-12 | Translation is not set up yet; strings are collected in per-feature `messages.ts` files. | Keeps every string in one place per feature so a translation library can be added without touching components. | Adding a translation library before there is a second language. |
| F-13 | 2026-11-12 | The product name is **Yahel**. | Decided by the owner. The interface, docs and design system in this repository now say Yahel. The backend's API title still says "WorkSync Space", so the committed API snapshot does too; design tokens keep the `--ws-` prefix, which is an internal name and not shown to anyone. | Keeping "WorkSync Space". |
| F-14 | 2026-11-12 | No AI attribution anywhere: no `Co-Authored-By` trailer and no "Generated with" line in commits or pull requests, from people or agents. | Decided by the owner. `scripts/check-attribution.mjs` fails CI if one appears. | Default tool attribution. |
| F-15 | 2026-11-12 | The backend announces API changes to this repository (event plus summary, and an issue when breaking); the design system is read by the backend from here. | Each side has one source of truth it owns and a push notice to the other, instead of copies that drift. | Copying the design system into the backend; polling a deployed backend only. |
| F-16 | 2026-11-12 | Agent reviews run on the author's machine before a pull request opens (`/pre-pr`), not in GitHub Actions. A `Review receipt` check proves all four reviewers approved the exact change. In-CI agents remain available but are off by default. | The owner has a Claude subscription, not an API key, and wants pull requests opened only for changes that already passed review. It is also cheaper and faster: problems are fixed before CI runs. | Requiring an API key in the repository. |

## Open

| ID | Item |
|---|---|
| O-1 | Backend: refresh token as an `HttpOnly` cookie (see F-4). |
| O-2 | Backend: declare response bodies in the OpenAPI description (see F-5). |
| O-3 | A staging environment and a required smoke test against the real backend (see F-6). |
| O-4 | Content Security Policy and other security headers, set where the apps are hosted. Hosting is undecided. |
| O-5 | Closed by F-13. |
| O-6 | Two-step sign-in: the backend supports it; the sign-in form says it cannot complete it yet. First item on the roadmap. |
