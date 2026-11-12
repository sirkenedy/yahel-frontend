# File tile and thumbnail

Status: Specified

## Purpose
Shows what kind of thing a file is, the same way in every app. The **type tile** marks the file type in the owning app's hue; the **thumbnail** shows a preview of the content. Use an avatar for people and organisations, and an app icon for apps.

## Anatomy
- **Type tile.** Rounded square in the app hue with one white glyph for the type (document, sheet, deck, folder, image, other).
- **Thumbnail.** Preview image of the first page or the picture, in a fixed-ratio frame.
- **Type badge** (thumbnail only): a small type tile at the bottom leading corner, so the type is still stated when a preview is shown.
- **Marker** (optional): shared, public link, or offline, at the trailing edge of the name, not on the tile.

## Variants and sizes

| Variant | Size | Use |
|---|---|---|
| Tile S | `space.20` | Inline attachments, breadcrumb, search suggestions |
| Tile M | `space.32` | Pointer list rows, table rows |
| Tile L | `space.40` | Touch list rows |
| Tile XL | `space.64` | Details panel, unsupported-type preview |
| Thumbnail | Fills the grid cell width; 4:3 frame | Grid view, attachment cards |

Tile radius is 25% of its size (a `space.40` tile has radius 10). The glyph is `icon.sm` in S and M, `icon.md` in L and `icon.lg` in XL. The thumbnail frame uses `radius.lg`; its type badge is a Tile S inset by `space.8`.

## States
The tile itself is not interactive; the row or grid cell that holds it is.

| State | Appearance |
|---|---|
| Default | Tile in the app hue, or the thumbnail image |
| Loading | Thumbnail frame shows a skeleton on `color.fill.secondary`; the type badge is already present |
| Error (no preview) | Thumbnail frame shows a centred Tile XL on `color.bg.sunken`; no error text |
| Hover, pressed, keyboard focus | Shown by the parent row or cell |
| Selected | Parent shows `color.accent.soft` and a check; the tile does not change colour |
| Disabled (no access, uploading) | Tile and thumbnail at `opacity.disabled`; the reason is on the row |
| Uploading | Progress shown on the row or cell, not drawn over the glyph |

## Tokens
- Colour: `app.docs`, `app.sheets`, `app.slides`, `app.drive` (folders), `app.mail`, `app.calendar`, `app.chat`, `app.meet`, `app.admin`; `color.hue.graphite` (unknown and other types); `color.label.on-accent` (glyph); `color.fill.secondary`, `color.bg.sunken`, `color.separator.default` (thumbnail frame outline).
- Space and shape: `space.20`, `space.32`, `space.40`, `space.64`, `space.8`, `radius.lg`, `icon.sm`, `icon.md`, `icon.lg`, `border.hairline`.
- Other: `opacity.disabled`, `duration.quick`, `easing.standard`.
- Also used (sizes, selection, increased contrast): `color.accent.soft`, `color.separator.opaque`, `color.label.primary`.

The white glyph on each app hue is a meaningful icon and must reach 3:1; add the pairs to `tokens/contrast-pairs.json` before Stable.

## Behaviour
- The same file shows the same tile in Drive, in a Mail attachment, in a picker and in search.
- The thumbnail keeps the image's aspect ratio and crops to fill from the top; documents show the top of the first page.
- The thumbnail fades in over the skeleton; the frame size never changes.
- Right to left: the type badge and markers move to the mirrored corner. Glyphs do not mirror, except ones that show reading direction.
- Reduced motion: no fade.

## Accessibility
- The tile is decorative when the row states the type in text. Otherwise its accessible name is the type: "Sheets spreadsheet", "Folder", "PDF".
- Hue is never the only signal: each type has a distinct glyph.
- A thumbnail's accessible name is the file name and type, not a description of the picture.
- Increased contrast: the thumbnail frame outline uses `color.separator.opaque`, and tiles keep their hue with a `border.hairline` outline in `color.label.primary`.

## Content
- Name the type in plain words. Good: "Spreadsheet", "PDF", "Folder". Bad: "application/pdf", "XLSX file object".
- Unknown types. Good: "File". Bad: "Unknown", "Unsupported binary".
- Markers use the shared vocabulary: "Shared", "Anyone with the link". Bad: "ACL: public".

Apple reference: none (no equivalent)
