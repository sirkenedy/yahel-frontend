# Sidebar

Status: Specified

## Purpose
App-level navigation in regular and wide layouts: the sections of one app and the person's top-level collections (folders, labels, calendars). In compact width the same destinations appear in the tab bar. Do not put actions that act on the current item here; those belong in the toolbar.

## Anatomy
- **Primary action** at the top (Compose, New, Upload): one prominent button.
- **Destinations**: icon and label, in the same order as the tab bar.
- **Groups** (optional): a short group label with a disclosure control, containing second-level items.
- **Counter** (optional) at the trailing edge of an item.
- **Storage meter** (Drive and Mail only) at the foot, as `patterns/plans-and-upgrades.md` requires.
- **Hide control** in the top bar.

The account control and the app launcher live in the top bar, not in the sidebar.

## Variants and sizes

| Variant | When | Notes |
|---|---|---|
| Expanded | Wide, by default | Icons and labels |
| Collapsible | Regular | Shown by default; overlays content when the window is too narrow for both, and closes after a choice |
| Hidden | Chosen by the person | Never the default. The hide control and its shortcut bring it back |

Item height: `target.touch` on touch, `target.pointer` on pointer. Icons are `icon.md`. Second-level items indent by the icon width plus the gap.

Token: `size.sidebar` — the expanded width.

## States

| State | Appearance |
|---|---|
| Default | Label in `color.label.primary`, icon in `color.label.secondary` |
| Hover | `color.fill.tertiary`, `radius.sm` |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring inside the item |
| Selected | `color.accent.soft`, label at its emphasised weight, filled icon. Held for the current destination |
| Disabled | Destinations are never disabled or hidden; an empty section explains itself in the content area |
| Loading | Skeleton rows for person-made items only; fixed destinations render at once |
| Error | "Unable to load folders" with "Try again", in place of that group |
| Drop target | `color.accent.soft` with a `border.control` outline while a dragged item is over it |

## Tokens
- Colour: `material.regular`, `material.edge` (when content scrolls under it), `color.bg.grouped` (solid form), `color.label.primary`, `color.label.secondary`, `color.fill.tertiary`, `color.fill.secondary`, `color.accent.soft`, `color.accent.default`, `color.separator.default`, `color.scrim` (behind the overlay form).
- Type: `type.body` (items), `type.headline` (selected item), `type.footnote` (group labels), `type.caption-1` (counters).
- Space and shape: `space.4` (between items), `space.8`, `space.12` (icon to label, edge inset), `space.16`, `space.24` (between groups), `radius.sm`, `icon.md`, `border.hairline`, `border.control`, `border.focus`, `border.focus-offset`.
- Depth and motion: `blur.regular`, `elevation.2` (overlay form only), `z.bar`, `duration.standard`, `easing.standard` (show), `duration.quick`, `easing.exit` (hide).
- Also used (sizes, selection, increased contrast): `target.touch`, `target.pointer`, `color.bg.elevated`, `color.separator.opaque`.

## Behaviour
- At most two levels. A deeper hierarchy moves into the content list of a split view.
- The current destination stays highlighted. Choosing a destination never changes app.
- People can hide the sidebar, collapse groups and reorder their own collections; these choices are remembered per app.
- Nothing sits only at the bottom edge, where a short window hides it. The storage meter at the foot is also in account settings, and stays pinned while the destinations scroll.
- Keyboard: arrow keys move between items, Right and Left expand and collapse a group, Enter opens. One Tab stop for the whole sidebar.
- Items accept drops (move to folder, apply label); each drop has a menu equivalent and can be undone.
- Icons are monochrome. A fixed colour is used only where it carries meaning, such as a calendar's own colour.
- Right to left: the sidebar sits on the right; disclosure controls and indentation mirror.
- Reduced motion: show and hide cross-fade. Reduced transparency: `color.bg.elevated` with the same edge.

## Accessibility
- Element: `nav` labelled with the app name ("Mail navigation"), containing a list; groups are expandable items with their state announced.
- The selected item is marked as the current page. Selection is shown by fill, weight and filled icon, not colour alone.
- Counters are read with their meaning: "Inbox, 4 unread".
- Hiding the sidebar moves focus to the hide control, never loses it.
- Increased contrast: the selected item gains a `border.control` outline in `color.accent.default`, and the sidebar edge uses `color.separator.opaque`.

## Content
- Destination labels are one or two words, the same as the tab labels. Good: "Inbox", "Shared with me". Bad: "View your inbox".
- Group labels are short and omit needless words. Good: "Labels". Bad: "Your custom labels and categories".
- Primary action is a verb: "Compose", "New", "Upload".

Apple reference: Sidebars, read 2026-11-11
