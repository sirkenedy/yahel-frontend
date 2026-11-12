# Checkbox

Status: Specified

## Purpose

A checkbox picks any number of items from a set, or marks one choice that applies when a form is confirmed. Use a toggle when the change takes effect at once, and radio buttons when only one option can be chosen. Checkboxes also mark rows in selection mode (see `../foundations/input.md`).

## Anatomy

- **Box.** Square with a rounded corner.
- **Mark.** A check when on, a dash when mixed.
- **Label.** Required, at the trailing side. In a selection list the row's content is the label.
- **Description.** Optional, under the label.
- **Group label.** Required when the relationship between several checkboxes is not obvious.

## Variants and sizes

| Size | Box | Target |
|---|---|---|
| Touch | Larger box | Box plus label, at least `target.touch` high |
| Pointer | Smaller box | Box plus label, at least `target.pointer-min` high |

- Token: `size.indicator` (touch and pointer values) — the box size for checkboxes and radio buttons; the canvas draws 22 and 20, which match no existing token.
- A parent checkbox controls a set of children. Children are indented by `space.24` and aligned on their leading edge.

## States

| State | Treatment |
|---|---|
| Off | `border.control` outline in `color.border.control`; background `color.bg.base` |
| On (selected) | Fill `color.accent.solid`; check in `color.label.on-accent` |
| Mixed | Fill `color.accent.solid`; dash in `color.label.on-accent`. Parent only, when children differ |
| Hover (pointer) | Halo of `color.fill.tertiary` behind the box |
| Pressed | Box at `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Disabled | `opacity.disabled`, with the reason nearby |
| Error | Outline `color.danger.solid`; message in `color.danger.text` with icon under the group |

A checkbox has no loading state; it changes a form, not the server.

## Tokens

- Colour: `color.border.control`, `color.bg.base`, `color.accent.solid`, `color.label.on-accent`, `color.fill.tertiary`, `color.danger.solid`, `color.danger.text`.
- Shape: `radius.xs`; outline `border.control`.
- Text: label `type.body`; description and error `type.footnote`, description in `color.label.secondary`.
- Space: `space.12` box to label on touch, `space.8` on pointer; `space.12` between checkboxes on pointer; rows on touch.
- Motion: mark draws over `duration.instant`; fill `duration.instant` with `easing.standard`.

## Behaviour

- Press the box or the label. Space toggles. Tab moves between checkboxes; each is its own stop.
- Pressing a mixed parent turns every child on; pressing again turns every child off. The parent never returns to mixed by itself.
- The appearance always matches the real state. Never show a checked box for something that has not applied.
- In selection mode on touch, checkboxes appear at the leading edge of each row; on pointer they appear on hover and focus and stay while anything is selected. Shift extends a range.
- Consent is never pre-selected (see `../foundations/privacy-and-trust.md`).
- Right-to-left: the box sits at the inline start; the check mark itself does not mirror.
- Reduced motion: the mark appears without drawing.

## Accessibility

- Native `input type="checkbox"` with a `label`. Mixed sets `indeterminate` and is announced as "mixed" or "partially checked".
- A group is a `fieldset` with a `legend`.
- Selection uses the fill and the mark, never colour alone. A selected row also takes `color.accent.soft`.
- Increased contrast: the off outline uses the stronger `color.border.control`; the on state adds an outline in `color.label.primary`.
- At 200% text labels wrap; the box aligns with the first line.

## Content

- Labels are positive statements of what being checked means. Sentence case, no full stop.

| Good | Bad |
|---|---|
| "Notify people" | "Don't skip notifications" |
| "Allow download" | "Download permission setting" |
| "Select all" (parent) | "Toggle" |
| Legend: "Send me email about" | Six unlabelled checkboxes in a row |

Apple reference: Toggles, read 2026-11-11
