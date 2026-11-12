# Illustration

Status: rules only. No artwork exists yet, and the brand identity is open question D-4 in `../decisions.md`. Sizes here are proposals until the first set is drawn and reviewed. Summary rules are in `imagery-and-branding.md`; this file is the detail.

## Where illustration is used

| Used | Not used |
|---|---|
| First-use empty states, to show what belongs here | "No results" and cleared states: words are enough |
| Onboarding and feature tips, where a picture explains faster than a sentence | Security prompts and security emails |
| Whole-view errors (offline, not found, no access) | Field errors, toasts, banners, dialogs |
| | Upgrade and storage prompts: facts only, no emotional pull |
| | Toolbars, lists, tables, settings, anywhere as filler |

An illustration earns its place by explaining. If the screen reads the same without it, leave it out. An illustration never replaces the sentence and the action of an empty state; see `../patterns/feedback-and-status.md`.

## Construction

- **Flat.** Solid shapes and even strokes. No gradients, no shadows, no textures, no 3D, no glass effects.
- **Same hand as the icons.** Round caps and joins, corners from the radius scale, and stroke weight that reads as the icon stroke at the drawn size. See `iconography.md`.
- **Simple.** One idea, a few shapes. If it needs a caption to be understood, redraw it.
- **Objects, not scenes.** The thing itself (an envelope, a folder, a calendar page) with at most one supporting element. No backgrounds, no horizon, no frames.
- **Drawn on a square grid** with clear space of one eighth of the size on every side, so illustrations align and centre the same way.
- **Vector only**, delivered as SVG. No bitmaps, no text baked in.
- **Still by default.** An animated illustration follows the motion rules in `depth-and-motion.md`: brief, no loop without a pause control, and a still frame under reduced motion that carries the same meaning.

## Palette

- Colours come from semantic tokens only: the `hue.*` roles, the label and fill greys, and the background roles. No primitives, no hex values.
- At most two hues in one illustration, plus greys. Greys do most of the work.
- In an app, the first hue is that app's identity hue. Suite-level screens use the accent hue sparingly or greys alone.
- Red, orange and green are reserved for meaning (danger, warning, success) and are not used decoratively. An error illustration does not need red; the words carry the error. See `color.md`.
- The accent marks what is interactive, so an illustration never uses it for something that looks pressable.
- No pure white and no pure black areas. Use the background and label roles so the drawing sits on any surface.

## Light and dark

- One drawing, coloured by tokens, so it changes with the theme and with increased contrast automatically.
- Check every illustration in all four themes. If a shape disappears against its surface, give it an outline in `separator.opaque` instead of making a second drawing.
- Draw a separate dark version only when token colouring cannot work, and keep the composition identical.
- No illustration has its own background panel that would glow in dark mode.

## Sizes

| Size | Square | Use |
|---|---|---|
| Small | 64 | Inline tips, compact empty states inside a card or panel |
| Medium | 120 | Empty states in compact width; sheets |
| Large | 200 | Empty and error states of a whole view in regular and wide; onboarding |

- One size per placement. Do not scale between these; draw for the size, with less detail when smaller.
- The illustration sits above the sentence, centred, with `space.24` between them. It never pushes the action below the fold in compact width; if it would, use the smaller size or none.
- Illustrations do not scale with text size. The text beside them does.

## What not to draw

- **Specific products or hardware.** No recognisable phones, laptops or other companies' interfaces or logos.
- **Our own interface.** No miniature screenshots; they date with every release and mislead when the real screen differs.
- **Text, letters or numbers.** They cannot be translated or read aloud.
- **Faces and bodies by default.** Where a person is needed, use a simple, non-gendered figure with no skin tone implied by a single colour, and vary figures across a set. No caricature, no stereotypes of role, age, culture or ability. See `inclusion-and-localization.md`.
- **Hand gestures, religious or national symbols, flags, maps with borders, money, food, animals as mascots.** Their meaning changes by culture.
- **Blame or alarm.** No broken, crying, burning or crashed objects. An error illustration is calm.
- **Rewards and pressure.** No confetti, trophies, treasure or locked doors around upgrades or limits.
- **Humour that needs explaining.**

## Direction

- Illustrations are not mirrored in right-to-left layouts. Draw them without a reading direction where possible.
- If an illustration's meaning depends on direction (a sequence, an arrow of progress), draw a right-to-left version instead of flipping the original.

## Accessibility

- Decorative illustrations are hidden from assistive technology. Almost all are decorative, because the sentence beside them says the same thing.
- A meaningful illustration has a text alternative that states its message, not its appearance.
- Shapes that carry meaning reach 3:1 against the surface in every theme. Meaning never rests on hue alone.
- Nothing flashes. Nothing moves when reduced motion is on.
- An illustration is never the only way to understand a state, and never a control.

## Process

- Every illustration is added as a set entry with its name, placement, size and the tokens it uses.
- A new illustration is reviewed in four themes, at its size, in a left-to-right and a right-to-left layout, before it ships.
- Reuse before drawing. One concept has one illustration across all apps.

Checked against Apple HIG: Images, Inclusion, Right to left, Dark Mode, Branding, 2026-11-11. Sizes and the list of excluded subjects are this system's own rules.
