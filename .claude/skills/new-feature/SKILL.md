---
name: new-feature
description: Scaffold a new feature inside an app in the standard shape (messages, components, data hooks, route, unit and browser tests). Use when starting any user-facing feature.
argument-hint: <app> <feature-name>
---

Create feature `$1` in `apps/$0`. Read `docs/architecture.md` §3 and `docs/rulebook.md` first.

1. Create `apps/$0/src/features/$1/` with:
   - `messages.ts`: every user-facing string, as a typed constant object. No string literals in components.
   - one file per component, kebab-case, exporting named components. Presentational components take data and callbacks as props; they do not fetch.
   - `use-<thing>.ts` for data: TanStack Query hooks that call `@yahel/api-client` through the session. Query keys start with the feature name and include the account context.
   - `<component>.test.tsx` beside each component with behaviour.
2. Add the route under `apps/$0/src/routes/`. Signed-in pages go under `_signed-in/`. Routes compose feature components; they hold no business logic.
3. Design every state: loading (skeleton shaped like the content), empty, error (what happened and how to fix it), offline. See `design-system/docs/patterns/feedback-and-status.md`.
4. Add browser tests in `e2e/<feature>.spec.ts` that run on desktop and mobile, extending `e2e/support/api.ts` with the endpoints the feature calls. Add each new screen to the `screens` list in `e2e/quality.spec.ts` so it gets accessibility and layout checks in all four themes.
5. Run `pnpm verify`.

Use only `@yahel/ui` components. If one is missing, run `/new-component` first.
