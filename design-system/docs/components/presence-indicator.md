# Presence indicator

Status: Specified

## Purpose

The presence indicator shows what a person is doing right now: online, in a call, or editing this document. It always sits on or beside that person's avatar. It is not a badge (which counts things waiting for the viewer) and not a tag. See `../patterns/sharing-and-collaboration.md`.

## Anatomy

- **Avatar.** The host. A circle, since presence belongs to people; organisations have none.
- **Status mark.** A small shape at the avatar's bottom trailing corner, with a ring in the surface colour so it reads against the photo.
- **Editing ring.** Editing only: a ring around the avatar in that person's collaborator colour.
- **Name and status text.** In the tooltip on pointer, in the person's card, and always in the accessible name.

## Variants and sizes

| Status | Mark | Colour is backed by |
|---|---|---|
| Online | Filled dot | Shape: solid circle |
| In a call | Dot containing a call glyph | The glyph |
| Editing | Ring around the avatar, plus the person's name on their cursor and selection | The name label |
| Offline or unknown | No mark | Absence |

- Mark: `space.12` across on avatars in rows and stacks; `space.8` on the smallest avatars, where "in a call" drops its glyph and the status moves to text.
- The mark is not a target. The avatar keeps its own target (`target.touch` on touch, `target.pointer-min` on pointer) and opens the person's card.
- Avatar stack next to Share: up to a set number of faces, then "+3".

## States

| State | Treatment |
|---|---|
| Default | Mark as in the table |
| Hover, keyboard focus (on the avatar) | Tooltip or card with name and status in words; focus ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Pressed | Belongs to the avatar |
| Idle while editing | Ring fades to `color.label.tertiary` after a period without activity; the person stays in the stack |
| Loading | No mark until presence is known. Never guess "online" |
| Stale (viewer offline) | All marks are removed; presence is not shown from old data |
| Disabled, error, selected | Do not apply |

## Tokens

- Online: `color.success.solid`. In a call: `color.accent.solid` with glyph in `color.label.on-accent`.
- Editing ring and cursor label: the person's stable hue from `color.hue.*`; label text follows the contrast rules in `../foundations/color.md`.
- Ring around the mark: `border.control` in the surface behind the avatar (`color.bg.base`, `color.bg.grouped` or `color.bg.elevated`).
- Shape: `radius.full`. Editing ring width `border.focus`, offset `border.focus-offset`.
- Text: status `type.footnote` in `color.label.secondary`; cursor label `type.caption-1` at the emphasized weight.
- Motion: mark appears and leaves over `duration.quick` with `easing.standard`; avatars join the stack over `duration.standard`.

## Behaviour

- Presence updates live and without moving anything the viewer is using. No sound, no toast.
- Each person keeps the same collaborator colour for the whole session in a document. Colour is never the only identifier: the name is on the cursor and in the stack's tooltip.
- People in the stack are ordered by when they joined; the viewer is not shown to themselves.
- External people keep their "External" marker beside presence wherever they appear.
- Pressing an avatar in the stack moves the viewer to that person's position in the document.
- Presence never reveals what someone is doing in an item the viewer cannot open: "In a call", not which call.
- Right-to-left: the mark sits at the bottom left; the stack order mirrors.
- Reduced motion: marks change without fading; nothing pulses in any setting.

## Accessibility

- The avatar's accessible name includes the status in words: "Lena Moreau, in a call". The mark itself is hidden from assistive technology.
- Arrivals and departures in a document are announced politely and batched ("Lena and 2 others joined"), and can be turned off.
- Status is never colour alone: each has a distinct shape, glyph or label.
- Increased contrast: the ring around the mark uses `color.label.primary`; the editing ring thickens to `border.control` plus `border.focus`.
- At 200% text the stack shows fewer faces and a larger "+" count.

## Content

| Good | Bad |
|---|---|
| "Online" | "Active now!" |
| "In a call" | "Busy (Meet: Design review)" to someone not invited |
| "Editing" | "Typing..." in a document |
| "Lena and 2 others joined" | Three separate announcements |

Apple reference: none (no equivalent)
