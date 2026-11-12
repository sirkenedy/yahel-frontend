# File picker and drop zone

Status: Specified

## Purpose

The file picker chooses existing files from Drive or the device: attaching to mail, inserting into a document, adding to an event. The drop zone receives files dragged in. Both are the same in every app. Upload always works three ways: button, drag and drop, and paste. See `../patterns/files-and-storage.md`.

## Anatomy

**Picker** (in a sheet):

- Title naming the task, and the current context (personal, or the organisation's name).
- Source tabs: Recent, Drive locations, This device.
- Search field, path, and a list or grid of file tiles.
- Selection count, Cancel, and the confirming button.

**Drop zone:**

- Region with a dashed outline, an icon, one sentence, and a button that opens the picker.
- Per-file progress rows once files are added.

## Variants and sizes

| Variant | Use |
|---|---|
| Picker, single | One file (a profile photo) |
| Picker, multiple | Several files; checkboxes on rows |
| Drop zone, inline | A visible region in a form or empty folder |
| Drop zone, whole view | Appears over a view only while files are dragged across it |

- Picker: full-height sheet in compact, centred panel otherwise (sizes in `sheet.md`).
- Rows: `target.touch` on touch, `target.pointer` on pointer. Inline drop zone: at least `target.touch` high on every platform, and its button is a standard button.

## States

| State | Treatment |
|---|---|
| Drop zone default | Dashed `border.control` outline in `color.border.control` on `color.bg.sunken` |
| Hover (pointer, no drag) | Only the button reacts |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset`, on the button |
| Drag over, valid | Background `color.accent.soft`, outline `color.accent.default`, sentence changes to "Drop to upload" |
| Drag over, invalid | No reaction; on drop, a message says why |
| Uploading | Progress row per file and overall; each can be cancelled |
| Error | Row icon and message in `color.danger.text`; "Try again" on that file |
| Disabled | `opacity.disabled` with the reason (view only, storage full) |
| Picker row selected | `color.accent.soft` plus a checked checkbox |
| Picker loading | Skeleton rows in the final layout |
| Picker empty | Empty state: "No files here" |

## Tokens

- Colour: `color.bg.sunken`, `color.border.control`, `color.accent.soft`, `color.accent.default`, `color.danger.text`, `color.label.secondary`.
- Shape: drop zone `radius.lg`; rows `radius.sm`; outline `border.control`.
- Picker surface: sheet tokens from `sheet.md`. Dragged item: `elevation.4`.
- Text: sentence `type.body` in `color.label.secondary`; file name `type.body`; metadata `type.footnote`. Icon `icon.lg`.
- Space: `space.24` drop zone padding; `space.12` icon to sentence; `space.8` between progress rows.
- Motion: drag-over change `duration.instant`; rows enter over `duration.quick` with `easing.standard`.

## Behaviour

- The picker opens in the current context with recent items first. Files from another context carry a marker, and choosing one that changes who has access confirms first.
- Only file types the task accepts can be chosen; others are shown dimmed with the reason.
- Keyboard: arrows move, Space selects, Enter opens a folder or confirms, Escape cancels. Shift and Command or Control extend the selection.
- The confirming button is disabled until something is selected, and names the action and count.
- Dropping starts the upload at once. It continues in the background and survives navigation. A drop can be undone.
- Before an upload that would exceed storage, say so and what would fit. See `../patterns/plans-and-upgrades.md`.
- Duplicates ask once: keep both or replace, with "Apply to all".
- Right-to-left: layout mirrors; file names are isolated so extensions stay in place.
- Reduced motion: no lift animation; highlight changes without transition.

## Accessibility

- The drop zone is never the only way: its button is a real button named "Choose files". Paste works when the region or its view has focus.
- Picker: `role="dialog"` named by its title; the file list is a `listbox` or `grid` with multi-selection state.
- Progress rows are `role="progressbar"` with the file name; completion and failure are announced politely, once per batch.
- Valid drag-over changes the words and outline, not just the colour.
- Increased contrast: dashed outline in `color.label.primary`.

## Content

| Good | Bad |
|---|---|
| "Drag files here, or choose files" | "Drag and drop" with no button |
| "Attach 3 files" | "OK" |
| "'Budget.xlsx' is too large to attach. Share a link instead." | "Upload failed" |
| "Choose from Drive" | "Browse..." |

Apple reference: File management, Drag and drop, read 2026-11-11
