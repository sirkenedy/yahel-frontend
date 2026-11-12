# Iconography

Status: decided. Interface icons are **Phosphor 2.1.1** (MIT), vendored in `assets/icons/` under our own names in three weights: regular, bold and fill. Decision D-2 in `../decisions.md` records the comparison. App icons are in `assets/app-icons/`, the mark in `assets/logo/`.

## Interface icons

- One family, stroke style, drawn on a 24 grid with 2 units of padding.
- Each icon expresses one idea with a familiar metaphor and as little detail as possible. The whole family shares one size, level of detail, stroke weight and perspective.
- Centre by eye, not by geometry. An asymmetric glyph (download, play) carries its optical correction as padding inside the 24 box, so components can centre the box.
- Stroke weight tracks the text beside it: about 1.75 at Regular, heavier next to Semibold.
- Round caps and joins; corner radii consistent with the radius scale.
- Icons take the colour of their label (`currentColor`). A filled variant marks the selected state in tab bars.
- Icon-only buttons always have an accessible name.
- Human figures are gender-neutral. No metaphor that depends on one culture or language.
- No letters or words in an icon unless the letter is the meaning (text formatting); such icons are localised.
- Where one drawing does not read on both light and dark surfaces, draw a variant for each.
- Delivered as vectors.
- No drawings of specific hardware products, Apple's or anyone else's. They date quickly and may infringe.
- SF Symbols are not used outside native Apple builds (licence). On iOS, a native build may map our icon names to the nearest SF Symbol, at the weight and scale of the text beside it. A symbol is animated only to show a change of state, never for decoration.

## App icons

- A rounded-square tile in the app's hue (`tokens/apps.json`) with a single white glyph.
- Tile radius is 25% of its size on web and Android; iOS applies its own mask.
- The glyph describes the object (envelope, folder, calendar page), not a letter.
- The same design on every platform, so one app is never mistaken for two.
- No photographs, no copies of interface components, no words.
- No baked-in effects: no highlights, shadows, bevels or glows. On iOS the system adds its own. Supply square, unmasked layers (a background and the glyph, with clearly defined edges) and keep the glyph centred so masking never clips it.
- The iOS dark, clear and tinted appearances keep the same glyph and composition as the default icon. Nothing is swapped in or out.
- The same tile, smaller, marks file types and sources inside other apps (a Drive tile on a mail attachment).

## File and context markers

- File-type tiles use the owning app's hue: Docs indigo, Sheets green, Slides orange, folders Drive teal.
- People are circular avatars; organisations are rounded-square avatars.

Checked against Apple HIG: Icons, App icons, SF Symbols, Dark Mode (icons only), 2026-11-11.
