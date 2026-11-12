# Web and file preview

Status: Specified

## Purpose
Opens a file or a link's content in place, without leaving the current view, so the person can check it and act on it. Use the owning app when the person wants to edit; use an image view for a single inline picture.

## Anatomy
- **Top bar**: close, type tile and file name, position ("3 of 12"), then the file actions.
- **Content area**: the rendered file or page, on a dimmed backdrop.
- **Previous and next** controls at the leading and trailing edges.
- **Page or zoom controls** (optional), floating at the bottom.
- **Details panel** (optional, wide only), at the trailing side.

## Variants and sizes

| Size class | Presentation |
|---|---|
| Compact | Full screen. Actions beyond the first two collapse into a More menu |
| Regular | Full screen with the full action row |
| Wide | Full window with margins; optional details panel |

Controls are icon buttons: `target.touch` on touch, `target.pointer` on pointer, with at least `space.8` between them. Supported content: images, PDF, the suite's own documents, common office formats, audio, video, text and safe web content.

## States

| State | Appearance |
|---|---|
| Default | Content fitted to the area |
| Loading | Skeleton in the shape of the page; the bar, name and actions are already usable. Over 10 seconds: determinate progress |
| Error | "Unable to preview this file" with "Try again" and "Download" |
| Unsupported type | Large type tile, the file name, "No preview for this file type" and "Download" |
| No access | Which account has access, and "Request access" or "Switch account" |
| Hover, pressed, keyboard focus, disabled | As for buttons. Previous is disabled at the first item and next at the last |
| Idle (media) | Controls fade; they return on any input |

## Tokens
- Colour: `color.scrim` (backdrop), `color.bg.base` (document content), `color.bg.elevated` (details panel), `color.label.primary`, `color.label.secondary`, `color.separator.default`, `material.regular`, `material.edge` (top bar), `material.clear`, `material.dim` (controls over media), `color.accent.default` (focus).
- Type: `type.headline` (file name), `type.footnote` (position, metadata), `type.body` (messages).
- Space and shape: `space.8`, `space.12`, `space.16`, `space.24`, `margin.compact`, `margin.regular`, `margin.wide`, `radius.full` (floating controls), `radius.lg` (details panel), `icon.md`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.3`, `z.sheet`, `blur.regular`, `blur.thin`, `duration.emphasized`, `easing.standard` (open), `duration.quick`, `easing.exit` (close), `duration.standard` (next and previous).
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`, `color.separator.opaque`.

## Behaviour
- Opens from the thumbnail or row the person chose and closes back to it. Focus returns to that item, with scroll position and selection restored.
- Next and previous move through the list the preview was opened from, in that list's order. Arrow keys and swipe do the same; when content is zoomed, they pan first.
- Actions are the standard file actions in the standard order from `files-and-storage.md`. Nothing is offered here that the file menu lacks.
- Each item has its own URL on web; Back closes the preview.
- Web content: back and forward appear only if the person can follow links inside the preview. "Open in browser" is always offered. The preview is not a browser.
- Escape or the close control exits. Swipe down closes on touch.
- Right to left: previous and next swap sides and arrow keys follow; page-turn direction follows the document, not the interface.
- Reduced motion: open, close and item changes cross-fade.

## Accessibility
- Role: dialog, labelled by the file name. Focus is trapped while open.
- Changing item announces the name and position: "Budget.xlsx, 3 of 12".
- Rendered text is real text where the format allows, so it can be selected and read aloud.
- Video and audio follow the captions requirement in `accessibility.md`.
- Reduced transparency: bars use `color.bg.elevated`. Increased contrast: the backdrop is opaque and bars gain a `color.separator.opaque` edge.

## Content
- Good: "No preview for this file type. Download to open it." Bad: "Unsupported MIME type".
- Good: "3 of 12". Bad: "Item 3/12 items".
- Good: "Open in Docs". Bad: "Launch editor".

Apple reference: Web views, read 2026-11-11 (partial equivalent; Apple's Quick Look guidance was not read)
