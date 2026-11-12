# Colour picker

Status: Specified

## Purpose

The colour picker assigns one of the system's hues to something the person owns: a label, a calendar, a folder. The palette is fixed so the result works in every theme. Free colour choice for document content (text, shapes, cell fill) is the custom variant. Colour chosen here is identity, never status; red from this palette does not mean danger.

## Anatomy

- **Well.** A swatch button showing the current colour, with its name.
- **Palette.** A grid of swatches, opened from the well or shown inline.
- **Swatch.** One hue, with a check when selected.
- **Colour name.** Shown beside the well and in each swatch's tooltip.
- **Custom entry.** Custom variant only: recent colours, a hex field, and the platform's own picker.

## Variants and sizes

| Variant | Use |
|---|---|
| Palette | Labels, calendars, folders. The twelve hues and graphite |
| Inline palette | Inside a create or edit sheet, always visible |
| Custom | Docs, Sheets and Slides content. Palette first, then custom entry |

- Swatch target: `target.touch` on touch, `target.pointer` on pointer. Visible swatch: `target.pointer` on touch, `target.pointer-min` on pointer.
- Regular and wide: the palette opens in a popover. Compact: in a half-height sheet, or inline.
- Native builds use the platform's colour picker for the custom variant.

## States

| State | Treatment |
|---|---|
| Default | Swatch filled with its hue |
| Hover (pointer) | Swatch scales slightly; tooltip shows the name |
| Pressed | `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Selected | Check in the centre plus an outer ring in `color.label.primary` |
| Disabled | `opacity.disabled`, with a reason (a calendar managed by someone else) |
| Mixed | Well shows a split swatch and the word "Mixed" |
| Error | Custom variant only: hex field error as in `text-field.md` |

No loading state.

## Tokens

- Hues: `color.hue.red`, `color.hue.orange`, `color.hue.yellow`, `color.hue.green`, `color.hue.mint`, `color.hue.teal`, `color.hue.cyan`, `color.hue.blue`, `color.hue.indigo`, `color.hue.purple`, `color.hue.pink`, `color.hue.brown`, `color.hue.graphite`.
- Check: `color.label.on-accent` on dark hues, `color.label.primary` on light ones; chosen per hue so the mark reaches 3:1.
- Shape: swatches `radius.full`; well `radius.sm`; swatch outline `border.hairline` in `color.separator.default`.
- Surface: popover tokens from `popover.md`.
- Text: name `type.body`; tooltip as `tooltip.md`.
- Space: `space.8` between swatches; `space.16` palette padding; `space.8` well to name.
- Motion: hover and selection `duration.instant`.

## Behaviour

- Choosing a swatch applies it at once and closes the popover. The inline palette stays open.
- The order of hues is fixed and follows the palette in `../foundations/color.md`. It does not reorder by use.
- Keyboard: the palette is one tab stop; arrows move through the grid, Enter or Space selects, Escape closes without change.
- A new item gets the next unused hue as a default, so two calendars do not start the same colour.
- The stored value is the hue's token name, not a raw colour, so the item follows theme changes.
- Wherever the chosen colour marks an item, the item's name is there too. Colour never identifies something by itself.
- Right-to-left: grid order mirrors.
- Reduced motion: no scaling on hover.

## Accessibility

- The well is a button named with the current colour: "Colour: Teal". The palette is `role="radiogroup"`; each swatch is `role="radio"` named by its colour.
- Names are plain colour words, translated, the same in every app.
- The selected swatch has a check and a ring, not only a different edge colour.
- Increased contrast: every swatch gains a `border.control` outline in `color.label.primary`.
- Hue pairs that are hard to tell apart are separated in the grid, and names are always available.

## Content

| Good | Bad |
|---|---|
| "Teal", "Graphite" | "Colour 6", "#0A9AA0" |
| Label "Calendar colour" | "Pick" |
| "Custom" | "More colours..." |

Apple reference: Color wells, read 2026-11-11
