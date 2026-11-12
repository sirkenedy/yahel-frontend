# Typography

Values: `tokens/type.json`, `tokens/scale.json` (`font`, `weight`). CSS: `--ws-type-<role>-size|line|weight|weight-emphasized|tracking`, `--ws-font-sans`, `--ws-font-mono`.

## Typeface

System first: San Francisco on Apple platforms through `-apple-system`, Inter elsewhere, then the platform default. No San Francisco files ship. Inter Variable is self-hosted from `assets/fonts/` (48 KB Latin, 85 KB Latin Extended, loaded by unicode range). Because it sits behind the system font in the stack, Apple devices never download it. Decision D-3.

Monospace (`--ws-font-mono`) is for code, identifiers and aligned numbers.

## Roles

Sizes are `size / line-height` in px at the default setting; tokens are emitted in rem so they scale.

| Role | Touch | Pointer | Weight | Use |
|---|---|---|---|---|
| Large Title | 34 / 41 | 28 / 34 | Bold | Top of a root screen |
| Title 1 | 28 / 34 | 22 / 28 | Bold | Page and document titles |
| Title 2 | 22 / 28 | 18 / 24 | Bold | Section titles |
| Title 3 | 20 / 25 | 16 / 22 | Semibold | Group titles |
| Headline | 17 / 22 | 14 / 20 | Semibold | Emphasised row text, card titles |
| Body | 17 / 22 | 14 / 20 | Regular | Default text |
| Callout | 16 / 21 | 13 / 18 | Regular | Secondary body |
| Subhead | 15 / 20 | 13 / 18 | Regular | Supporting lines under a headline |
| Footnote | 13 / 18 | 12 / 16 | Regular | Help text, metadata |
| Caption 1 | 12 / 16 | 11 / 14 | Regular | Timestamps, tags |
| Caption 2 | 11 / 13 | 11 / 14 | Regular | Tab labels, smallest text |

**Emphasized weight.** Every role has a second, heavier weight for emphasis within that role (`weight-emphasized`): Bold for the titles and Headline, Semibold for Body and below. This mirrors the emphasized weights Apple added to its text styles in December 2025. Apple's titles default to Regular with Bold as the emphasized weight; ours default to the heavier weight, because workspace screens are dense and titles are the main scanning aid. Never use weights lighter than Regular.

**Touch** matches the iOS text styles at the default Dynamic Type size, so a native iOS build maps each role to the system style directly. **Pointer** applies under `(hover: hover) and (pointer: fine)` and is denser for desktop work. Nothing goes below 11 px, on any platform (Apple allows 10 on macOS).

Long-form reading (a mail body, a document) may use Body at 15 / 24 on pointer for comfort; that is a content style owned by the app, not a new role.

## Rules

- Pick a role; do not set raw sizes. A missing size is a proposal for `decisions.md`, not a one-off.
- Hierarchy comes from weight first, size second, colour last.
- Tracking in the tokens is an adjustment on top of the font's own. San Francisco already adjusts its tracking by size (slightly negative around 13 to 22, positive from 24), and the system applies that automatically. Our title roles add a small further tightening, a deliberate choice that also suits Inter; Body and below add none. All-caps labels add 0.04 to 0.06em.
- Three or more lines of text never use tight line height, even where space is short.
- Text must survive 200% zoom and the largest Dynamic Type sizes: containers grow, rows wrap, nothing truncates to meaninglessness.
- Numbers in tables and meters use tabular figures.
