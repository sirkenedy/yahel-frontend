# Rulebook

Mandatory. If a shortcut conflicts with a rule, the rule wins. Most rules are enforced by tooling; the rest are enforced by the reviewers. Changing this file needs a maintainer.

## 1. Structure

1.1 Code goes where `architecture.md` says. Do not add a top-level folder or a package kind without a decision recorded in `decisions.md`.
1.2 Apps never import other apps. Packages obey the dependency table in `architecture.md` §2. Import a package by name through its public entry point, never through `src/`.
1.3 Features do not import other features. Shared code moves into a package.
1.4 Routes compose features. No business logic, data fetching details or string literals in route files.
1.5 A file does one thing. Components are named exports in kebab-case files.

## 2. Data

2.1 Only `@yahel/api-client` talks to the backend. Apps never call `fetch`, `XMLHttpRequest` or a socket directly.
2.2 Every backend call is a typed method on the client, with a unit test. Request types come from the generated schema. Response types are generated where the backend declares them and hand-written from evidence where it does not; never guessed.
2.3 Server data lives in TanStack Query. Do not copy it into component state or a store.
2.4 Query keys start with the feature name and include the account context. Personal and organisation data never share a key.
2.5 Handle every outcome: loading, empty, success, failure, offline. A failure tells the person what happened and what to do.
2.6 Mutations that can be reversed apply optimistically and roll back with a message on failure. Double submission is impossible: the control shows progress and ignores further presses.
2.7 On sign-out and account switch, clear every cache.

## 3. Interface

3.1 Apps use `@yahel/ui` only. A missing component is built in `packages/ui` from its spec, not improvised in an app.
3.2 No raw design values anywhere: colours, sizes, radii, shadows, durations, z-index and breakpoints are tokens.
3.3 No user-facing string literals in components. Text lives in the feature's `messages.ts` and follows `design-system/docs/foundations/writing.md`.
3.4 Layout uses logical properties (`inline`, `block`) so right to left works.
3.5 Every interactive element is a native control or a React Aria component, reachable and operable by keyboard, with a visible focus ring and an accessible name.
3.6 Every field has a visible label. Errors sit beside the field and say how to fix it.
3.7 Touch targets are at least 44 by 44; pointer targets at least 28 tall.
3.8 One primary action per view; at most two prominent buttons. A destructive action is never the prominent choice and is undoable or confirmed.
3.9 The current account context (personal, or which organisation) is visible on every signed-in screen.
3.10 Respect reduced motion, reduced transparency and increased contrast.

## 4. Security

4.1 The access token is held in memory only. Nothing sensitive goes in web storage, URLs, logs, error reports or analytics. Only `@yahel/auth` touches `localStorage` or `sessionStorage`.
4.2 Never render untrusted HTML. `dangerouslySetInnerHTML`, `innerHTML`, `eval` and `new Function` are forbidden. Rich content (mail bodies, documents) goes through one sanctioned sanitiser, added with a security review, and is displayed in a sandbox.
4.3 Validate the scheme of any URL that comes from data before using it in `href`, `src` or navigation. Only `https:`, `http:`, `mailto:` and `tel:` are allowed.
4.4 Never trust the interface to enforce permission. If the interface hides an action, the API must still refuse it; flag any place where that is unverified.
4.5 Redirects after sign-in go only to paths inside the app.
4.6 No request to a third-party origin (scripts, fonts, images, telemetry) without a recorded decision.
4.7 Every new dependency is justified in the pull request: purpose, licence, size, maintenance. Install scripts are off by default; `allowBuilds` grows only with a recorded reason.
4.8 No secrets, tokens or real personal data in code, tests, fixtures, commits or logs. Test data uses `.example` domains.
4.9 Error messages never reveal whether an account exists, and never show server internals.

## 5. Testing

5.1 Every behaviour has a unit test. Every acceptance criterion has a browser test that runs on the `desktop` and `mobile` projects.
5.2 Every new screen is added to the `screens` list in `e2e/quality.spec.ts`, which scans it for accessibility in all four themes and checks layout, touch targets, 200% text and right to left.
5.3 Tests exercise behaviour through the interface, by role and accessible name. Do not assert on class names, internal state or implementation detail.
5.4 Browser tests run against the mock in `e2e/support/api.ts`, which must stay faithful to the real backend. Extend it when a feature calls a new endpoint.
5.5 A test must be able to fail. If removing the feature leaves the test green, the test is wrong.
5.6 Never delete, skip or loosen a test to make a change pass. Never fix flakiness with a retry or a longer timeout without finding the cause.
5.7 Budgets in `scripts/check-bundle-budget.mjs` are not raised without a decision in `decisions.md`.

## 6. Process

6.1 Scope comes from `roadmap.md` and task issues. Do not build what was not asked.
6.2 One task is one pull request, small enough to review in fifteen minutes.
6.3 `pnpm verify` passes before a pull request opens. Its output goes in the description.
6.4 Docs change in the same pull request as the behaviour they describe.
6.5 Decisions that are not obvious from the code are recorded in `decisions.md` with what was rejected and why.
6.6 Protected paths change only with a maintainer's `human-approved` label: `.github/`, `.claude/`, `scripts/agent/`, `CLAUDE.md`, this file, `docs/agents.md`, `eslint.config.mjs`, `scripts/check-*`, `playwright.config.ts`, `pnpm-workspace.yaml`.
6.7 Conventional Commits. No force-push. No push to `main`.
