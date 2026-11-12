# Grid and collection

Status: Specified

## Purpose
Lays out an ordered set of image-led items in a regular grid: Drive's grid view, the app launcher, photo attachments, templates. Use a list or table when the items are mainly text.

## Anatomy
- **Grid container** with columns from the size class.
- **Cell**: media (thumbnail, type tile or app icon), title, optional metadata line, optional More button.
- **Selection control**: a checkbox at the leading top corner of the cell, shown in selection mode, on hover and on focus.
- **Section header** (optional): see `divider.md`.

## Variants and sizes

| Variant | Cell | Use |
|---|---|---|
| File grid | Thumbnail in a 4:3 frame, then file name and metadata | Drive, pickers |
| Icon grid | App icon or type tile, then a one-line label | App launcher, templates |
| Row | A single horizontally scrolling line of cells | "Suggested" and "Recent" strips |

Columns are fluid: cells share the available width within the size class's column grid (4, 8 or 12 columns), so the count changes with the window, not the device. Gaps are `space.12` in compact and `space.16` in regular and wide. Every cell is at least `target.touch` on touch; the More button and checkbox keep the full target size.

## States

| State | Appearance |
|---|---|
| Default | Media with the title in `color.label.primary` |
| Hover | `color.fill.tertiary` behind the cell; checkbox and More button appear |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring around the cell; checkbox and More button appear |
| Selected | `color.accent.soft` behind the cell, a ticked checkbox and a `border.control` outline in `color.accent.default` |
| Disabled | Cell at `opacity.disabled`, with the reason on hover, focus and in its accessible description |
| Loading | Skeleton cells at the final size |
| Error | Message and "Try again" in place of the grid; one failed thumbnail falls back to its type tile |
| Dragged | The cell lifts to `elevation.4` with a count when several are selected |
| Drop target (folder) | `color.accent.soft` with a `border.control` outline |

## Tokens
- Colour: `color.bg.base`, `color.label.primary`, `color.label.secondary`, `color.fill.tertiary`, `color.fill.secondary`, `color.accent.soft`, `color.accent.default`, `color.separator.default`.
- Type: `type.subhead` (file name), `type.caption-1` (metadata), `type.footnote` (icon grid label).
- Space and shape: `space.4`, `space.8` (cell padding, media to title), `space.12`, `space.16`, `space.24` (between sections), `radius.lg` (cell and thumbnail frame), `border.control`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.4`, `duration.instant`, `duration.standard`, `easing.standard` (insert, remove, reorder), `easing.spring` (drop), `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `target.touch`, `border.hairline`, `color.separator.opaque`.

## Behaviour
- Order is the same as the list view of the same content, and switching between list and grid keeps selection and scroll position. The choice is remembered per folder.
- The layout changes only in response to the person (resizing, switching view), never while they are reading.
- Tap or click opens. Selection follows `input.md`: long press or the checkbox enters selection mode on touch; Shift and Command or Control extend on pointer.
- Hover never reveals the only path to an action: the More button also shows on focus, and the same menu opens on long press and right-click.
- Inserting, removing and reordering animate so the change can be followed.
- Keyboard: arrow keys move in two dimensions, Home and End go to the first and last cell, Enter opens, Space selects. One Tab stop for the grid.
- Loading more follows `pagination.md`.
- Right to left: cells fill from the right; the checkbox and More button swap corners.
- Reduced motion: reorder and drop cross-fade; no lift animation.

## Accessibility
- Element: a list of items, or a grid role when arrow-key navigation is provided. Each cell is one stop named by its title, type and state: "Budget, spreadsheet, shared, selected".
- The More button is named with the item: "More actions for Budget".
- Titles wrap to two lines; the full name is available on hover, focus and to assistive technology.
- Holds at 200% text: the column count drops so titles stay readable.
- Increased contrast: thumbnail frames gain a `border.hairline` outline in `color.separator.opaque`; selection keeps its outline and check.

## Content
- Titles are the item's own name. Metadata is one fact: "Changed 12 Mar", "Lena Marsh".
- Good: "Changed 2 hours ago". Bad: "Last modification timestamp: 14:02:11".
- Section headers. Good: "Suggested", "Folders", "Files". Bad: "Your Stuff".

Apple reference: Collections, read 2026-11-11
