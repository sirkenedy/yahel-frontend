# Toolbar

Status: Specified

## Purpose
Holds the frequent actions for the content in view: reply, archive, share, format. It acts on content; it does not navigate between sections (that is the tab bar or sidebar). The bar that carries the title and Back is specified in `top-bar.md`; a toolbar's items may sit inside that bar or in a bar of their own.

## Anatomy
- **Groups** of items, three at most, separated by space or a vertical divider.
- **Items**: icon buttons, text buttons, pull-down buttons, toggles, a search field.
- **Primary action** (optional): one prominent button at the trailing end.
- **More menu** (when needed): at the trailing end, holding lower-priority and overflowed items.
- **Selection bar**: replaces the items with the count and bulk actions while items are selected.

## Variants and sizes

| Variant | Where | Surface |
|---|---|---|
| Top | Under or within the top bar, above the content it acts on | `material.regular` when content scrolls under it; otherwise the pane's own surface |
| Bottom | Compact width, at the bottom of a detail view. Never together with the tab bar | `material.thin`, floating |
| Editor | Formatting controls in Docs, Sheets, Slides and compose | Solid, attached to the editing area |
| Floating selection | Over a list or canvas while items are selected | `material.regular`, `elevation.2` |

Item size: `target.touch` on touch; `target.pointer` on pointer, `target.pointer-min` in the editor variant. Icons are `icon.md`. Items keep `space.8` between targets inside a group and `space.16` between groups.

## States

| State | Appearance |
|---|---|
| Default | Icons and labels in `color.label.primary`; monochrome |
| Hover | `color.fill.tertiary` behind the item |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring on the item |
| Selected (toggle on, such as Bold) | `color.accent.soft` behind the item, icon in `color.accent.default`, pressed state exposed |
| Disabled | `opacity.disabled`, with the reason in the tooltip. Items stay in place; they do not disappear |
| Loading | The item that started the action shows a spinner, as `button.md` |
| Error | The message appears as a toast or next to the content, not in the bar |
| Scrolled under | The scroll edge fade and blur appear under the bar |

## Tokens
- Colour: `material.regular`, `material.thin`, `material.edge`, `color.bg.base`, `color.bg.elevated` (solid fallback and editor variant), `color.label.primary`, `color.label.secondary`, `color.fill.tertiary`, `color.fill.secondary`, `color.accent.soft`, `color.accent.default`, `color.accent.solid`, `color.label.on-accent` (primary action), `color.separator.default`.
- Type: `type.body` at its emphasised weight (text buttons), `type.headline` (selection count).
- Space and shape: `space.4`, `space.8`, `space.12`, `space.16`, `radius.sm` (item hover), `radius.md` (primary action on touch), `radius.full` (floating bars), `icon.md`, `target.touch`, `target.pointer`, `target.pointer-min`, `margin.compact`, `margin.regular`, `margin.wide`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.2`, `blur.regular`, `blur.thin`, `z.bar`, `duration.instant`, `duration.quick`, `duration.standard`, `easing.standard`, `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `color.separator.opaque`.

## Behaviour
- Choose few items. Each must be clear without guessing: a familiar icon with a tooltip, or a short text label where no icon is clear (such as "Edit").
- Items are grouped by function and frequency. The same action sits in the same position in every app; Share is always in the same place.
- One primary action only, at the trailing end, in the filled style. Other items are monochrome; colour stays off glass.
- Text-labelled buttons are kept apart from each other and from icon buttons so they do not read as one control.
- As the bar narrows, items move into the More menu from the lowest priority up. Navigation, the primary action and More itself never overflow. The default layout at each size class does not overflow.
- Every toolbar action is also available by keyboard shortcut or menu.
- Custom shapes inside a floating bar are concentric with the bar's corners.
- Keyboard: one Tab stop; Left and Right move between items; Home and End jump.
- On pointer, people may customise the editor toolbar; the leading and trailing groups stay fixed.
- Right to left: order mirrors; the primary action sits at the left end. Icons that imply direction (reply, send, undo) mirror; icons without direction do not. See `inclusion-and-localization.md`.
- Reduced transparency: `color.bg.elevated` with the same edge. Reduced motion: overflow changes without animation.

## Accessibility
- Role: toolbar, labelled for its content ("Message actions"). Groups are exposed as groups.
- Every icon-only item has an accessible name and a tooltip that includes the shortcut.
- Toggle items expose their pressed state; selection is shown by fill and shape, not colour alone.
- The selection bar is announced when it appears: "3 selected".
- Increased contrast: the bar gains a `color.separator.opaque` edge; selected items gain an outline in `color.accent.default`.

## Content
- Tooltips and names are verbs, sentence case. Good: "Archive", "Reply all", "Share". Bad: "Archive This Message", "Box".
- Primary action. Good: "Send", "Done". Bad: "Submit", "OK".
- Selection bar. Good: "3 selected". Bad: "Items: 3".

Apple reference: Toolbars, read 2026-11-11
