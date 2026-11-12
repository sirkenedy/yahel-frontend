# Popover

Status: Specified

## Purpose

A popover shows a small amount of detail or a few controls next to the thing they belong to, without blocking the rest of the view: an event summary, a person's card, text formatting options. Use a menu for a list of actions, a sheet for a task, and a dialog for a warning. A popover never carries a warning, because it can be missed or closed by accident.

## Anatomy

- **Anchor.** The control or item that opened it. Stays visible.
- **Container.** With an arrow pointing at the anchor.
- **Title.** Optional.
- **Content.** Detail or controls.
- **Close or Done.** Optional; only when it makes clear whether changes are kept.

## Variants and sizes

| Variant | Use |
|---|---|
| Detail | Read-only summary with at most one or two actions |
| Controls | A few settings that apply as they change |

- Width fits content up to a fixed maximum. Token: `size.layer-sm` — maximum width of dialogs, popovers and toasts.
- Height fits content up to the space available; the content scrolls only as a last resort.
- Controls inside follow their own touch and pointer sizes.
- Compact width: a popover is not used. The same content appears in a half-height sheet.

## States

| State | Treatment |
|---|---|
| Closed, open | The anchor shows its selected state while the popover is open |
| Hover, pressed | Belong to the anchor and to controls inside, not the container |
| Keyboard focus | Ring on the focused control inside |
| Loading | Skeleton in the final layout; the container does not resize more than once |
| Error | Message inside the popover, with "Try again" when a retry can work |
| Disabled | The anchor is disabled with a reason; the popover does not open |

## Tokens

- Surface: `material.thick` with `blur.thick` and a `border.hairline` edge in `material.edge`; fallback `color.bg.elevated`. `elevation.2`, `radius.lg`, `z.popover`.
- Text: title `type.headline`; content `type.body` or `type.subhead`; metadata `type.footnote` in `color.label.secondary`.
- Space: `space.16` padding; `space.12` between items; `space.8` gap between anchor and arrow tip.
- Motion: enter `duration.quick` with `easing.standard`; exit `duration.quick` with `easing.exit`; resize `duration.standard`.

## Behaviour

- Opens on click, tap or Enter on the anchor. Never on hover alone.
- Position: the arrow points as directly as possible at the anchor. The popover does not cover the anchor or the content it describes. It flips to stay inside the window.
- One popover at a time. Opening another closes the first in the same press. Nothing opens over a popover except a menu belonging to a control inside it.
- Closes on outside press, Escape, or choosing an item. Changes made inside are always kept when it closes this way. Work is discarded only by an explicit Cancel.
- No scrim. The view behind stays visible and scrolls; the popover closes if its anchor scrolls out of view.
- Focus moves into the popover when it contains controls and returns to the anchor on close. Tab past the last control closes it and continues from the anchor.
- A size change (content loaded, section expanded) animates.
- Motion: grows from the anchor. Reduced motion: cross-fade.
- Right-to-left: placement preference and internal layout mirror.

## Accessibility

- Anchor has `aria-haspopup="dialog"` and `aria-expanded`. Container is `role="dialog"`, not modal, named by its title or by the anchor.
- A detail popover with no controls is announced on open and can be dismissed with Escape.
- Reduced transparency: `color.bg.elevated` with the same edge.
- Increased contrast: edge becomes `color.separator.opaque`; the arrow keeps the same edge.

## Content

- Short. If it needs a paragraph, link to the full view.
- A title names the thing, not the action: "Design review", not "Event details popover".

| Good | Bad |
|---|---|
| "Open in Calendar" | "Click here for more" |
| "Done" (after changing settings) | "Close" next to "Cancel" with no difference between them |

Apple reference: Popovers, read 2026-11-11
