# Avatar

Status: Specified

## Purpose
Identifies a person, an organisation or a group, and carries the account context by shape. Use a file tile for files and an app icon for apps; never use an avatar as decoration.

## Anatomy
- **Container.** Circle for a person, rounded square for an organisation.
- **Image**, or **initials** when there is no image (one or two letters), or a generic glyph when there is no name.
- **Marker** (optional): presence dot, or an external marker at the trailing bottom corner.
- **Stack** (group): up to three avatars overlapping, then a "+N" counter in the same shape and size.

## Variants and sizes

| Size | Dimension | Initials role | Use |
|---|---|---|---|
| XS | `space.20` | none (image or glyph only) | Inline in text, tokens |
| S | `space.24` | `type.caption-2` | Dense rows, presence stacks |
| M | `space.32` | `type.footnote` | List rows, the account control |
| L | `space.40` | `type.subhead` | Message headers, people lists |
| XL | `space.64` | `type.title-2` | Profile and account switcher header |

Sizes are the same on touch and pointer. An avatar that acts as a control (the account control) sits inside a button whose target is `target.touch` on touch and `target.pointer` on pointer.

Person: `radius.full`. Organisation: 25% of the size, as for icon tiles (an M organisation avatar has radius 8).

## States
A plain avatar is not interactive and has only default, loading and error states. Interactive states belong to the button that wraps it.

| State | Appearance |
|---|---|
| Default | Image, or initials on a hue |
| Loading | Skeleton in the final shape on `color.fill.secondary`; no spinner |
| Error (image failed) | Falls back to initials, silently |
| Hover, pressed (wrapped) | Button states; image at `opacity.pressed` when pressed |
| Keyboard focus (wrapped) | Focus ring follows the avatar shape |
| Disabled (wrapped) | `opacity.disabled` |
| Selected (wrapped, in pickers) | Check mark replaces the image on `color.accent.solid` |

## Tokens
- Colour: `color.hue.*` (initials background, assigned from the account ID so it is stable), `color.label.on-accent` (initials), `color.fill.secondary` (skeleton, "+N" counter), `color.label.secondary` (counter text), `color.bg.base` (ring between stacked avatars), `color.success.solid` (presence dot), `color.accent.solid`, `color.accent.default` (focus ring).
- Type: `type.caption-2`, `type.footnote`, `type.subhead`, `type.title-2`, each at its emphasised weight.
- Space and shape: `space.20`, `space.24`, `space.32`, `space.40`, `space.64`, `space.2` (stack ring), `space.8` (stack overlap), `radius.full`.
- Other: `border.focus`, `border.focus-offset`, `opacity.pressed`, `opacity.disabled`, `duration.quick`, `easing.standard` (image fade-in).
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`, `border.hairline`, `color.separator.opaque`.

Initials on a hue are a text-on-colour pair. Each hue used must be added to `tokens/contrast-pairs.json` and pass before this component is Stable; hues that fail are not used for initials.

## Behaviour
- The image fades in over the initials; the layout never shifts.
- Stacks overlap towards the leading edge and show at most three avatars plus the counter. Selecting the counter opens the full list.
- Right to left: stack order and marker corner mirror. Images and initials do not mirror.
- Reduced motion: the image appears without a fade.

## Accessibility
- Decorative next to a visible name: hidden from assistive technology. Alone: an image with the name as its accessible name, plus "organisation" for organisation avatars and "external" where the marker shows.
- Shape, not colour, separates people from organisations. The hue is never the only identifier; a name is always available next to the avatar or on hover and focus.
- A stack is announced as a list with a count: "4 people editing".
- Increased contrast: a `border.hairline` outline in `color.separator.opaque` surrounds the container, and the presence dot gains a `color.bg.base` ring.

## Content
- Initials: the first letter of the display name, plus the first letter of its last word when it has several, in the script the name is written in. Name order is never assumed. One letter for single-word names and organisations.
- Good: "LM" for Lena Marsh; "N" for Northwind Studio. Bad: "LEN", an emoji, or a role such as "AD" for admin.
- Counter: "+3", never "3 more" or "…".
- Accessible name: "Lena Marsh, external". Not "avatar" or "profile picture".

Apple reference: none (no equivalent)
