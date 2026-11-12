# Grouped list and row

Status: Specified

## Purpose
Presents items or settings as rows of text that are easy to scan, optionally in titled groups. Use a table when several attributes need their own sortable columns, and a grid when items are mainly images.

## Anatomy
- **Group**: optional section header, a container of rows, optional footer text.
- **Row**: leading item (icon tile, avatar, file tile or checkbox), title, optional subtitle, optional value, trailing accessory.
- **Trailing accessory**, one per row: chevron (opens a deeper view), toggle, check mark (chosen option), info button (more detail, no navigation) or a More button.
- **Separator** between rows, inset to align with the title.

## Variants and sizes

| Variant | Use |
|---|---|
| Inset grouped | Settings, details, forms. Rows sit in an `elevation.1` container on `color.bg.grouped` |
| Plain | Long content lists (mail, files, chat). Rows run edge to edge on `color.bg.base` |

| Row | Touch minimum height | Pointer minimum height |
|---|---|---|
| One line | `target.touch` | `target.pointer` |
| Two lines | `space.64` | `space.48` |

Rows grow with their text; heights are minimums. Leading icon tiles are `space.32` on touch and `space.24` on pointer, with radius at 25% of their size.

## States

| State | Appearance |
|---|---|
| Default | Title in `color.label.primary`, subtitle and value in `color.label.secondary` |
| Hover (pointer) | `color.fill.tertiary` behind the row, with `radius.sm` in plain lists |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring inside the row bounds |
| Selected (navigation) | `color.accent.soft`, held while the detail is shown, with the title at its emphasised weight |
| Selected (multi-select) | `color.accent.soft` plus a ticked checkbox |
| Chosen option | Check mark at the trailing edge; no fill |
| Disabled | Content at `opacity.disabled`; the reason is given in the subtitle or footer |
| Loading | Skeleton rows of the same height |
| Error | Message in place of the rows, with "Try again"; a failed row shows its error under the title in `color.danger.text` with an icon |
| Unread (mail, chat) | Title at its emphasised weight plus a dot; not weight alone |

## Tokens
- Colour: `color.bg.grouped`, `color.bg.elevated`, `color.bg.base`, `color.label.primary`, `color.label.secondary`, `color.label.tertiary` (chevron), `color.separator.default`, `color.fill.tertiary`, `color.fill.secondary`, `color.accent.soft`, `color.accent.default`, `color.danger.text`.
- Type: `type.body` (title), `type.headline` (emphasised title), `type.subhead` (subtitle), `type.footnote` (header, footer), `type.caption-1` (timestamps).
- Space and shape: `space.4`, `space.8`, `space.12` (leading item to title), `space.16` (row padding), `space.24` (between groups), `radius.xl` (group container), `radius.sm` (row highlight), `icon.sm`, `icon.md`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.1`, `duration.instant` (hover, press), `duration.standard`, `easing.standard` (insert, remove, reorder), `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`, `space.64`, `space.48`, `space.32`, `color.separator.opaque`, `border.control`.

## Behaviour
- The whole row is the target. A row has one main action; other actions are in its menu, and on touch also in swipe actions.
- A chevron means the row opens a deeper view. An info button only reveals detail. Do not use both for the same thing.
- Navigation lists keep the selected row highlighted. Option lists flash the press state, then show the check mark.
- Selection follows `input.md`: selection mode with checkboxes on touch; Shift and Command or Control on pointer and keyboard.
- Reordering by drag always has a Move action as an equivalent.
- Arrow keys move between rows, Enter opens, Space selects. Tab leaves the list.
- Long lists load more as described in `pagination.md` and keep scroll position on Back.
- Titles wrap to two lines before truncating. File names follow the truncation rule in `files-and-storage.md`.
- Right to left: leading and trailing swap; chevrons point the other way.

## Accessibility
- Element: a list of items, or a listbox when rows are selectable. Each row is one stop that reads title, subtitle, value and state.
- Section headers are headings. Footer text is associated with its group.
- Controls inside a row (toggle, More) are separately reachable and named with the row title: "More actions for Budget.xlsx".
- Holds at 200% text: the value moves under the title instead of truncating.
- Increased contrast: separators use `color.separator.opaque`; the selected row gains a `border.control` outline in `color.accent.default`.

## Content
- Titles are short nouns or names. Setting rows describe what happens when on.
- Good: "Show images from known senders". Bad: "Image settings (advanced)".
- Section headers. Good: "Signed-in devices". Bad: "DEVICES:" or "Manage Your Devices Here".
- Values are facts with units: "3 people", "On". Bad: "Enabled (default)".

Apple reference: Lists and tables, read 2026-11-11
