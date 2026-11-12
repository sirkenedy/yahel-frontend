# Card

Status: Specified

## Purpose
A solid, raised container that groups related information and controls about one thing. Use a grouped list for rows of settings, a banner for view-level status and a sheet for a task. Do not use a card to wrap a whole view.

## Anatomy
- **Container.**
- **Header** (optional): title, optional supporting line, optional trailing control.
- **Body**: any content.
- **Footer** (optional): one or two actions, aligned to the trailing edge.
- **Media** (optional): image or thumbnail at the top, edge to edge.

## Variants and sizes

| Variant | Use |
|---|---|
| Static | Groups content; not interactive as a whole |
| Interactive | The whole card opens one item (a file, a meeting). It contains no other controls except a More button |
| Inner | A card inside a card or sheet. Flat, on `color.bg.sunken`, with a concentric radius |

Padding is `space.16` on touch and compact layouts and `space.20` on pointer in regular and wide. Cards size to their grid column; there is no fixed width. Keep a card small relative to its view.

## States

| State | Static | Interactive |
|---|---|---|
| Default | `color.bg.elevated`, `elevation.1` | Same |
| Hover | No change | `elevation.2` |
| Pressed | No change | `color.fill.tertiary` overlay; shadow returns to `elevation.1` |
| Keyboard focus | Not focusable | Focus ring around the card |
| Selected | Not applicable | `color.accent.soft` plus a check in the leading top corner |
| Disabled | Not applicable | Content at `opacity.disabled`, with the reason stated |
| Loading | Skeleton inside the card at its final size | Same; not interactive until loaded |
| Error | Message and "Try again" inside the card | Same |
| Dragged | Not applicable | `elevation.4` |

## Tokens
- Colour: `color.bg.elevated`, `color.bg.grouped` (the surface behind cards), `color.bg.sunken` (inner card), `color.label.primary`, `color.label.secondary`, `color.separator.default`, `color.fill.tertiary`, `color.accent.soft`, `color.accent.default`.
- Type: `type.headline` (title), `type.subhead` (supporting line), `type.body`, `type.footnote`.
- Space and shape: `space.8`, `space.12`, `space.16`, `space.20`, `space.24` (between cards), `radius.xl` (card), `radius.lg` (inner card, when the nesting rule gives no better value), `border.hairline`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.1`, `elevation.2`, `elevation.4`, `duration.instant`, `duration.quick`, `easing.standard`, `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `color.separator.opaque`, `border.control`.

## Behaviour
- Cards are solid. Never glass, and never a card with a shadow inside another card with a shadow.
- Nested shapes are concentric: inner radius is the card radius minus the padding. Media at the top takes the card's own radius on its outer corners.
- Use spacing and alignment to group inside a card before adding an inner card.
- An interactive card is one target. Secondary actions live in its More menu, which is also the context menu.
- In dark mode there is no shadow; the raised surface colour carries the level.
- Cards reflow by size class: one column in compact, two or more in regular and wide.
- Right to left: header, media position and footer actions mirror.
- Reduced motion: hover and press change without a transition in depth.

## Accessibility
- Static: a group labelled by its title; the title is a heading at the right level for the page.
- Interactive: a link or button whose accessible name is the title; the More button is a separate stop after it.
- The surface is not the only boundary in dark and increased-contrast themes: increased contrast adds a `border.hairline` outline in `color.separator.opaque`, and the selected outline uses `border.control` in `color.accent.default`.
- Holds at 200% text: the card grows; footers wrap under each other.

## Content
- Title: a short phrase that names the contents, sentence case, no ending punctuation.
- Good: "Storage", "Next meeting", "Shared with you". Bad: "Your Storage Overview:", "Card 1".
- Footer actions are verbs: "Manage storage". Bad: "More", "Click for details".
- For storage amounts and upgrade wording, follow `patterns/plans-and-upgrades.md`.

Apple reference: Boxes, read 2026-11-11 (nearest equivalent)
