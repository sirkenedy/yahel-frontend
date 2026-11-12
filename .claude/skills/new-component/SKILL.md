---
name: new-component
description: Build a design-system component in packages/ui from its written spec, with styles on tokens, React Aria behaviour and tests. Use when an app needs a component that @yahel/ui does not export yet.
argument-hint: <component-name>
---

Build `$0` in `packages/ui`.

1. Read the spec at `design-system/docs/components/$0.md` in full, plus the foundations it cites. The spec is the requirement. If the spec is missing or contradicts another doc, stop and report it.
2. Styles go in `packages/ui/src/styles/components.css` as a `.ws-<name>` block with `--modifier` variants. Rules:
   - every value is a `--ws-*` token; no raw colours, sizes, radii, durations or z-index;
   - style native elements and ARIA or React Aria state attributes (`[data-hovered]`, `[data-pressed]`, `[data-focus-visible]`, `[data-disabled]`, `[aria-invalid]`), not custom state classes;
   - logical properties only (`inline`, `block`), so right to left works;
   - cover the reader-preference media queries at the foot of the file.
   If a token is missing, add it to `packages/tokens/tokens/*.json` with light, dark and both increased-contrast values where it is a colour, add a contrast pair if it carries text, and record the addition in `design-system/docs/decisions.md`.
3. The React component goes in `packages/ui/src/components/$0.tsx`, built on `react-aria-components`. Props mirror the spec's variants. Accessible names are required by the type, not optional. Export it from `packages/ui/src/index.ts`.
4. Tests in `packages/ui/src/components/`: role and name, keyboard operation, each state, and that invalid or disabled states are exposed to assistive technology.
5. Run `pnpm check:tokens`, then `pnpm --filter @yahel/ui test`, then `pnpm verify`.
6. Set the component's status in `design-system/docs/components/README.md`.
