# Table

Status: Specified

## Purpose
Shows items with several attributes in sortable columns, so values can be compared down a column: Admin lists, Drive's list view, audit logs. Use a list when one or two attributes are enough, and a grid for image-led items. In compact width a table becomes a list.

## Anatomy
- **Header row**: column headings, a sort indicator on the sorted column, a select-all checkbox when rows are selectable. Sticky.
- **Rows** of cells. The first data column names the item and is never hidden.
- **Selection bar** (when rows are selected): count and bulk actions, replacing the toolbar actions.
- **Footer** (optional): row count and pagination or load more.
- **Column resize handles** on pointer.

## Variants and sizes

| Density | Row minimum height | Use |
|---|---|---|
| Touch | `target.touch` | Touch layouts in regular and wide |
| Comfortable (pointer default) | `space.40` | General use |
| Dense (pointer) | `target.pointer` | Data-heavy Admin views; chosen by the person |

Header height equals the row height. Cell padding is `space.12` horizontally on pointer and `space.16` on touch. Checkboxes and row buttons keep the full target size even in dense rows.

## States

| State | Appearance |
|---|---|
| Default | Text in `color.label.primary`; secondary columns in `color.label.secondary` |
| Hover (row) | `color.fill.tertiary` |
| Hover (heading) | `color.fill.tertiary`; sort indicator previewed in `color.label.tertiary` |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring on the focused cell or row |
| Selected | `color.accent.soft` plus a ticked checkbox |
| Sorted column | Heading at its emphasised weight with an up or down arrow |
| Disabled row | Content at `opacity.disabled`, with the reason available on the row |
| Loading | Skeleton rows under a real header. Refreshing keeps the current rows visible |
| Error | Message and "Try again" in the body area; the header stays |
| Empty | Empty state in the body area; with filters on, it offers "Clear filters" |

## Tokens
- Colour: `color.bg.base`, `color.bg.elevated` (sticky header and selection bar), `color.label.primary`, `color.label.secondary`, `color.label.tertiary`, `color.separator.default`, `color.fill.tertiary`, `color.fill.secondary`, `color.accent.soft`, `color.accent.default`.
- Type: `type.footnote` at its emphasised weight (headings), `type.body` (cells), `type.subhead` (secondary cells), `font.mono` (identifiers); tabular figures for numbers.
- Space and shape: `space.8`, `space.12`, `space.16`, `space.40`, `radius.sm` (row hover in inset tables), `icon.sm` (sort arrow), `border.hairline`, `border.control`, `border.focus`, `border.focus-offset`.
- Depth and motion: `z.sticky`, `elevation.2` (selection bar), `duration.instant`, `duration.standard`, `easing.standard` (row insert and remove), `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`, `color.separator.opaque`.

## Behaviour
- Selecting a heading sorts by that column; selecting it again reverses the order. One sorted column at a time. Sort and filter state is visible, easy to reset and remembered per view.
- Columns can be resized on pointer and, where offered, shown, hidden and reordered from a column menu. The name column stays.
- Rows are separated by hairlines. Alternating row backgrounds are not used; hover and focus track the row instead.
- Text aligns to the leading edge; numbers align to the trailing edge with their heading.
- Truncated cells show the full value on hover and focus. File names follow `files-and-storage.md`.
- Wide tables scroll sideways inside their container with the name column pinned; the page does not scroll sideways.
- Hierarchical data uses disclosure controls in the first column only.
- Keyboard: arrow keys move by cell, Space selects the row, Enter opens it, Shift with arrows extends selection, Command or Control A selects all loaded rows.
- "Select all" states its scope: the loaded rows, with an explicit option for everything that matches.
- Right to left: column order, alignment and the pinned column mirror. Sort arrows do not.

## Accessibility
- Element: a native `table` with header cells; a grid role only when cells are interactive. Sortable headings are buttons that expose the sort direction.
- Sorting, selecting and loading more are announced: "Sorted by Last changed, newest first", "3 selected".
- Row checkboxes are named by the row: "Select Lena Marsh".
- Holds at 200% text: rows grow in height; columns are not squeezed below legibility.
- Increased contrast: rules use `color.separator.opaque`; selected rows gain a `border.control` leading edge in `color.accent.default`.

## Content
- Headings are nouns or short noun phrases in sentence case, with no ending punctuation. Good: "Last changed", "Owner". Bad: "Last Changed:", "Sort by date".
- Cells are facts with units: "3 files", "12 Mar 2026". Empty values show a dash with the accessible name "None".
- Selection bar. Good: "3 selected". Bad: "3 item(s) currently selected".

Apple reference: Lists and tables; Outline views, read 2026-11-11
