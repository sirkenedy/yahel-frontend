# Select and combo box

Status: Specified

## Purpose

A select picks one value from a closed list that is too long, or too rarely used, to show in full. A combo box does the same but also accepts a typed value that is not in the list. Use radio buttons or a segmented control when there are five options or fewer and room to show them, the people picker for people, and a menu for actions.

## Anatomy

- **Label.** Required, above the control.
- **Control.** Shows the current value, with a chevron at the trailing end. In a combo box this is a text field.
- **List.** Options in a menu surface. One is marked as selected.
- **Search field.** At the top of the list when the list is long.
- **Option.** Label, optional leading icon or avatar, optional secondary text.
- **Group heading and divider.** Optional.
- **Help or error text.** Under the control.

## Variants and sizes

| Variant | Use |
|---|---|
| Select | Closed list; the value is always one of the options |
| Searchable select | The list is longer than fits without scrolling; typing filters it |
| Combo box | Suggestions plus free entry (a font size, a meeting room) |
| Multiple | Several values; shown as tokens. See `token-field.md` |

- Control height: `target.touch` on touch, `target.pointer` on pointer. Option rows: `target.touch` on touch, `target.pointer-min` on pointer.
- The list is at least as wide as the control and no item is wider than the list.
- Compact: the list opens as a half-height sheet with the label as its title.

## States

| State | Treatment |
|---|---|
| Default | As text field: `border.control` in `color.border.control` |
| Hover (pointer) | Control `color.fill.tertiary`; option row `color.fill.tertiary` |
| Pressed | `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset`; in the list the active row takes `color.fill.secondary` |
| Open | Chevron turns; the control keeps its focus ring |
| Selected option | Check at the trailing end and `color.accent.soft` background |
| Disabled | `opacity.disabled`; a disabled option gives its reason as secondary text |
| Loading | Skeleton rows in the list; the control stays usable |
| Error | Outline `color.danger.solid`; message in `color.danger.text` with icon |
| No matches | "No matches" row; a combo box offers "Use '<typed text>'" |
| Mixed | Control shows "Mixed" in `color.label.secondary` when several edited items differ |

## Tokens

- Control: as `text-field.md` (`color.bg.base`, `radius.md` or `radius.sm`, `type.body`).
- List: `material.thick` with `blur.thick`, edge `material.edge` at `border.hairline`; fallback `color.bg.elevated`. `radius.lg`, `elevation.2`, `z.popover`. Row highlight `radius.sm`.
- Text: option `type.body`; secondary and group heading `type.footnote` in `color.label.secondary`. Icons `icon.md`.
- Space: `space.4` list padding; `space.12` row padding; `space.8` icon to label; `space.4` control to list.
- Motion: open `duration.quick` with `easing.standard`; close `duration.quick` with `easing.exit`.

## Behaviour

- A select starts with a meaningful default where one exists. Otherwise the control shows a prompt ("Choose a time zone") and the form reports it if left empty.
- Options are in a predictable order: alphabetical, numeric, or by nearness. Recently used values may sit in a group at the top.
- Keyboard: Enter, Space or Down opens. Arrows move, Enter chooses, Escape closes without change, typing jumps to a match. Home and End go to the ends.
- Choosing closes the list and returns focus to the control. In a combo box, leaving the field keeps what was typed.
- The list opens with the selected option in view. It flips above the control when there is no room below.
- Closing by outside press keeps the current value.
- Right-to-left: chevron and check sides mirror.
- Reduced motion: the list cross-fades.

## Accessibility

- Simple select: the native `select` where the platform's own list is acceptable. Otherwise `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant`, and a `role="listbox"` of `role="option"`.
- Named by the visible label. The result count is announced as the filter changes.
- Selection has a check, not colour alone.
- Reduced transparency: the list uses `color.bg.elevated`. Increased contrast: list edge `color.separator.opaque`.

## Content

- Label is a noun, sentence case, no colon. Options are parallel and short. The prompt starts with "Choose".

| Good | Bad |
|---|---|
| Label "Time zone", value "Lagos (GMT+1)" | Label "Select:" |
| "Choose a calendar" | "-- Please select --" |
| "No matches" | "0 results found for your query" |

Apple reference: Pop-up buttons, Combo boxes, Pickers, read 2026-11-11
