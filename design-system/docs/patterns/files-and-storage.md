# Files and storage

Applies to Drive and to every place a file appears: attachments, pickers, previews.

## File management

- Files look the same everywhere: a type tile in the owning app's hue, name, owner or context, and last-changed time.
- List and grid views are both available and the choice is remembered per folder.
- Standard actions in a standard order in every menu: Open, Share, Copy link, Download, Rename, Move, Star, Details, Trash.
- Rename happens in place. Names are never truncated in the middle of the extension; the full name is available on hover and to assistive technology.
- Location is always visible as a path that can be navigated.
- Sort and filter state is visible and easy to reset.
- Files in our own formats show no extension. Uploaded files keep theirs visible by default, and a view option hides them. Apple hides extensions by default; we deliberately do not, because the real type of a file someone else shared is a safety matter.
- Work is saved automatically. No file needs an explicit Save; see `entering-data.md`.

## Upload and download

- Upload by button, by drag and drop, and by paste. All three always work.
- Progress is per file and overall, continues in the background, survives navigation, and can be cancelled. Failures can be retried individually.
- Duplicates ask once: keep both or replace, with "apply to all".
- If an upload would exceed storage, say so before it starts, with what would fit. See `plans-and-upgrades.md`.

## Drag and drop

- Anything that looks movable can be dragged; valid targets highlight; invalid ones do not react.
- The dragged item lifts to elevation 4 and shows a count when several are selected.
- The drag image appears as soon as the item has moved a few pixels, is translucent so targets show through it, and stays until the drop.
- Move or copy is predictable. A drop into another folder of the same Drive moves. A drop into a different app or document (a file onto a mail draft, an image into a document) copies or attaches. The copy modifier forces a copy, and the drag image shows which will happen.
- Holding a dragged item over a folder, tab or sidebar entry opens it after a short pause. Lists scroll when the item nears an edge.
- An item dropped on an invalid target, or a drop that fails, returns visibly to where it came from.
- Dropped items stay selected in the destination. A drop that takes time shows a placeholder with progress where the item will land.
- Every drag has a non-drag equivalent (Move, Copy, Reorder buttons) for keyboard, touch and assistive technology.
- Dropping across contexts (personal to organisation) confirms, because access changes.
- Drops can be undone.

## Trash and recovery

- Deleting moves to Trash with an Undo toast. No confirmation.
- Trash states how long items are kept and who can restore them.
- "Delete forever" and "Empty trash" confirm, since they cannot be undone.
- Deleting something shared says who loses access.

## Preview

- Common types open in a preview without leaving the current view, with next and previous, and the same actions as the file menu.
- Unsupported types say so and offer download.
- On native builds, a type we cannot render opens in the platform's own preview before falling back to download.

## Printing and export

- Print and export produce a clean document: no interface chrome, sensible margins, page numbers, light theme regardless of the current one.
- Export formats are named plainly, and the person is told when an export may lose features.

Checked against Apple HIG: Drag and drop, File management, 2026-11-11.
