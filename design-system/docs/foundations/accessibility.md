# Accessibility

Target: WCAG 2.2 AA on web, and full support for the platform accessibility settings on iOS and Android. These are requirements for a component to be marked Stable.

| Area | Requirement |
|---|---|
| Contrast | All text roles 4.5:1 at every size (Apple and WCAG AA allow 3:1 for large or bold text; we do not rely on that). Control borders and meaningful icons 3:1. In increased contrast: text 7:1, borders 4.5:1. Enforced for token pairs by `scripts/build-tokens.mjs` in all four themes. |
| Colour independence | Status, selection and errors carry an icon, word or shape as well as colour. |
| Text size | Layouts hold at 200% zoom and the largest Dynamic Type sizes. |
| Targets | Touch 44 by 44 (never below; Apple permits 28 as a minimum). Pointer 32 preferred, 28 minimum (Apple: 28 and 20). About 12 of clear space around bordered controls and 24 around borderless ones. |
| Keyboard | Every action reachable and operable by keyboard; visible focus ring of 2 px in `accent.default` with 2 px offset; logical order; no traps. |
| Semantics | Native elements first (`button`, `a`, `input` with `label`). ARIA only where no native element exists. |
| Motion | `prefers-reduced-motion` replaces movement with cross-fades. |
| Transparency | `prefers-reduced-transparency` replaces glass with solid surfaces. |
| Contrast preference | `prefers-contrast: more` applies the increased-contrast token overrides: stronger labels, separators, borders and accent. On web it is also selectable in Appearance settings; native builds follow the system setting only. |
| Time | Nothing that carries information or an action disappears on a timer without a way to recall it. Sessions warn before expiring. |
| Hard-to-undo actions | Confirmed, and reversible wherever technically possible. |
| Hearing | Captions for Meet and any video; visual equivalents for every sound. |
| Cognitive | Consistent placement, plain language, one primary action, no forced time pressure. |
| Screen readers | Every icon-only control has a name; live regions announce new mail, chat messages and save state without stealing focus. |
| Language | Layouts mirror for right-to-left scripts; no text baked into images. |
