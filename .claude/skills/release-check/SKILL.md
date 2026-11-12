---
name: release-check
description: Run the full definition-of-done checklist on the current branch before opening or approving a pull request.
---

Run each step and report the actual result. Do not summarise a step you did not run.

1. `pnpm verify` (boundaries, tokens, API contract, lint, types, unit tests, build, bundle budget, browser tests on desktop and mobile). Paste the final counts.
2. `pnpm check:security`.
3. `git diff --stat origin/main...HEAD`: confirm every changed file belongs to the task, and no protected path changed (`.github/`, `.claude/`, `scripts/agent/`, `CLAUDE.md`, `docs/rulebook.md`, `docs/agents.md`, `eslint.config.mjs`, `scripts/check-*`, `playwright.config.ts`).
4. Acceptance criteria: list each one with the test that proves it on desktop and on mobile.
5. Screen checklist from `design-system/docs/governance.md`: one primary action; loading, empty, error and offline states; destructive actions undoable or confirmed; account context visible; strings follow the writing rules; only system components and tokens.
6. No test deleted, skipped or loosened; no budget raised; no new dependency without a stated reason.
7. Docs updated where behaviour changed.

Finish with a single line: READY or NOT READY, and for the latter the exact failing items.
