# Image view

Status: Specified

## Purpose
Displays one image, keeping its aspect ratio, with optional zoom. Use an icon for interface symbols, a file thumbnail for file previews in lists, and a button that contains an image when the image itself starts an action.

## Anatomy
- **Frame.** The box the image is fitted into.
- **Image.**
- **Placeholder.** Skeleton while loading; a glyph and one line when the image cannot load.
- **Caption** (optional), below the frame, never drawn over the image.
- **Zoom controls** (zoomable variant): zoom in, zoom out, fit.

## Variants and sizes

| Variant | Fit | Use |
|---|---|---|
| Inline | Fit inside the frame, never upscaled past natural size | Images in a mail body, a document or a chat message |
| Cover | Fill and crop from the centre | Cards and headers where the frame ratio is fixed |
| Zoomable | Fit, then pinch, scroll or button to zoom | Full preview |

Inline and cover frames use `radius.lg`; inside a padded card the radius is concentric (card radius minus padding). The zoomable variant is square-cornered at full screen. Zoom controls are icon buttons: `target.touch` on touch, `target.pointer` on pointer.

## States

| State | Appearance |
|---|---|
| Default | The image |
| Loading | Skeleton on `color.fill.secondary` at the final size, so nothing moves when the image arrives |
| Error | `color.bg.sunken`, a glyph in `color.label.secondary` and "Unable to load image" with "Try again" |
| Blocked (remote images off in Mail) | Same frame, with "Images are hidden" and "Show images" |
| Hover | No change unless the image opens a preview; then the cursor stays default and a tooltip names the action |
| Pressed (opens preview) | `opacity.pressed` |
| Keyboard focus | Focus ring on the frame when it is interactive or zoomable |
| Disabled | Not applicable |
| Selected (in an editor) | Focus-style outline in `color.accent.default` with resize handles |

## Tokens
- Colour: `color.fill.secondary`, `color.bg.sunken`, `color.label.secondary`, `color.accent.default`, `color.separator.default` (hairline around images on a matching background), `material.clear`, `material.dim`, `material.edge` (zoom controls over the image).
- Type: `type.footnote` (caption, error text).
- Space and shape: `space.8` (frame to caption), `space.12`, `radius.lg`, `radius.full` (zoom control group), `icon.md`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Motion and layering: `duration.quick` (fade-in), `duration.standard`, `easing.standard` (zoom to fit), `blur.thin`, `z.sticky` (zoom controls), `opacity.pressed`.
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`, `color.separator.opaque`, `color.bg.elevated`.

## Behaviour
- Space is reserved from the known dimensions before loading; the layout does not shift.
- Zoomable: pinch on touch; Control or Command with scroll, and `+`, `-`, `0` on keyboard; double tap or double click toggles fit and actual size; drag or arrow keys pan when zoomed.
- Zoom controls float on `material.clear` with the `material.dim` layer behind them when the image is bright, and fade when idle. They return on any input.
- Animated images do not loop without a pause control, and do not autoplay under reduced motion.
- Right to left: controls and caption alignment mirror; the image never mirrors.
- Reduced motion: zoom changes cross-fade instead of scaling.

## Accessibility
- Element: `img` with alternative text. Decorative images have empty alternative text. An interactive image is a `button` or link containing the image.
- Author-supplied alternative text is used as written; editors ask for it when an image is inserted.
- No text is baked into interface images. Text is not laid over an image unless a solid or dimmed layer keeps it at 4.5:1.
- Zoom state is announced: "Zoom 200%".
- Increased contrast: the hairline becomes `color.separator.opaque`, and zoom controls move from glass to `color.bg.elevated`.

## Content
- Alternative text says what the image shows, in one sentence. Good: "Bar chart of monthly sign-ups, rising from March". Bad: "image1.png", "Picture".
- Error. Good: "Unable to load image". Bad: "Oops, something broke!".
- Blocked. Good: "Images are hidden. Show images". Bad: "Remote content blocked for your protection!".

Apple reference: Image views, read 2026-11-11
