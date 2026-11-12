# Segmented control

Status: Specified

## Purpose

A segmented control switches between two to five closely related views or values of one thing: Day, Week, Month; List, Grid. The change applies at once. Use in-page tabs for the main sections of a page, radio buttons when options need descriptions, a select for more than five, and buttons for actions. Segments never perform actions.

## Anatomy

- **Track.** The container.
- **Segments.** Two to five, equal width.
- **Selected segment.** A raised pill that slides between positions.
- **Label or icon.** One kind per control, never mixed.
- **Group label.** Optional, when the purpose is not clear from the segments.

## Variants and sizes

| Variant | Use |
|---|---|
| Text | Default |
| Icon | Familiar pairs only (list and grid); each segment has a tooltip and an accessible name |

| Size | Height | Use |
|---|---|---|
| Touch | `target.touch` | Touch layouts |
| Pointer | `target.pointer` | Pointer layouts |
| Pointer, compact | `target.pointer-min` | Inside toolbars |

Width: fits content in a toolbar; full width at the top of a compact view. Segments share the width equally.

## States

| State | Treatment |
|---|---|
| Default | Label in `color.label.secondary` on the track |
| Selected | Pill in `color.bg.elevated` with `elevation.1`; label `color.label.primary` at the emphasized weight |
| Hover (pointer) | Unselected segment gains `color.fill.tertiary` |
| Pressed | Segment at `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset`, on the focused segment |
| Disabled | Whole control at `opacity.disabled`. Avoid disabling a single segment; remove it or explain why |
| Loading | The selection moves at once; the view below shows its own skeleton |

No error and no mixed state. One segment is always selected.

## Tokens

- Colour: track `color.fill.tertiary`; pill `color.bg.elevated`; `color.label.primary`, `color.label.secondary`.
- Shape: track `radius.md` on touch, `radius.sm` on pointer; pill is concentric (track radius minus `space.2`). Pill shadow `elevation.1`.
- Text: `type.subhead` on touch, `type.footnote` on compact pointer. Icons `icon.md`.
- Space: `space.2` track padding; `space.12` horizontal padding in a segment.
- Motion: pill slides over `duration.quick` with `easing.spring`.

## Behaviour

- Press a segment to select it. On touch, the pill can also be dragged.
- One tab stop. Arrow keys move and select; Home and End jump to the ends.
- The selection is remembered per view where the pattern says so (list or grid per folder).
- All segments stay visible. If labels do not fit at 200% text or in translation, the control becomes a select; segments never scroll or truncate.
- Keep other focusable controls at least `space.8` away.
- Right-to-left: segment order mirrors; arrow keys follow visual direction.
- Reduced motion: the pill cross-fades between positions.

## Accessibility

- Switching a view: `role="tablist"` with `role="tab"` segments and `aria-selected`, each controlling its panel. Choosing a value: `role="radiogroup"` with `role="radio"` and `aria-checked`.
- Named by the group label or an `aria-label` ("View").
- Selection is a shape and weight change as well as a surface change.
- Increased contrast: the pill gains a `border.control` outline in `color.label.primary`; the track gains a `border.hairline` outline in `color.separator.opaque`.
- Reduced transparency: no change.

## Content

- Nouns or short noun phrases, one or two words, similar in length, sentence case.

| Good | Bad |
|---|---|
| "Day" / "Week" / "Month" | "Day view" / "Wk" / "Show the month" |
| "List" / "Grid" | "Change layout" (an action) |
| "All" / "Unread" / "Starred" | "All" / "Mark as read" |

Apple reference: Segmented controls, read 2026-11-11
