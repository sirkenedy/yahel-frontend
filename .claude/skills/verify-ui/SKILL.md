---
name: verify-ui
description: Run and look at a UI change in a real browser on desktop and mobile, in light, dark, increased contrast and right to left. Use before claiming any visual change works.
argument-hint: [route]
---

Prove the change by observing it, not by reading the code.

1. `pnpm build`, then run the focused browser tests: `pnpm exec playwright test --project=desktop --project=mobile`.
2. For the route `$ARGUMENTS` (or each route the change touches), capture screenshots with a short Playwright script under `.agent/` (never committed), using `e2e/support/api.ts` for data:
   - desktop 1440 wide and mobile, each in light and dark;
   - `contrast: 'more'` in both;
   - `document.documentElement.dir = 'rtl'`;
   - `document.documentElement.style.fontSize = '200%'`.
3. Read every screenshot. Check against the component specs: alignment, spacing on the 4-point grid, nothing clipped or overlapping, focus ring visible, text contrast, no sideways scroll, targets large enough to touch.
4. Report what you saw, per screenshot, including anything that looks wrong even if no test fails. If you could not capture a state, say so; do not describe it from the code.
