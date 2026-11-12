# Menu and context menu

Status: Specified

## Purpose
A short list of actions or options on one thing, shown on request. A **menu** opens from a visible control. A **context menu** opens on the item itself by right-click, long press or the keyboard menu key. Use a select for choosing a value in a form, and a sheet when the choice needs explanation.

## Anatomy
- **Surface.**
- **Items**: label, optional leading icon, optional shortcut or check mark, optional submenu chevron at the trailing edge.
- **Separators** between groups.
- **Title** (optional): only when it clarifies the effect, such as "3 messages".
- **Preview** (context menu on touch, optional): a compact copy of the item above the menu.

## Variants and sizes

| Variant | Opens from | Notes |
|---|---|---|
| Menu | A button, pull-down button or More button | May show shortcuts and unavailable items |
| Context menu | The item | Only actions relevant to that item, also available elsewhere |
| Submenu | A menu item | One level only; about five items at most |

Item height: `target.touch` on touch, `target.pointer` on pointer. Width fits the longest label within sensible limits; labels do not wrap on pointer. In compact width a menu with many items becomes a sheet from the bottom, as `modality.md` describes.

## States

| State | Appearance |
|---|---|
| Default | Label in `color.label.primary`, icon in `color.label.secondary` |
| Hover or keyboard highlight | `color.fill.secondary` behind the item, `radius.md`. Pointer and keyboard share one highlight |
| Pressed | `color.fill.primary` |
| Keyboard focus | The highlight; the ring is not drawn inside menus |
| Selected (toggled or chosen) | Check mark at the leading edge |
| Disabled | Menu: label at `opacity.disabled`, still listed. Context menu: the item is left out |
| Destructive | Label and icon in `color.danger.text` |
| Loading | Items that depend on a request show a skeleton row; the menu opens at once |
| Error | "Unable to load" as an unavailable row; other items work |

## Tokens
- Colour: `material.thick`, `material.edge`, `color.bg.elevated` (solid fallback), `color.label.primary`, `color.label.secondary` (icons, shortcuts, title), `color.fill.secondary`, `color.fill.primary`, `color.separator.default`, `color.danger.text`, `color.scrim` (sheet form, and behind a touch context menu).
- Type: `type.body` (items), `type.footnote` (title, shortcuts).
- Space and shape: `space.4` (surface padding, separator margin), `space.8`, `space.12` (item padding, icon to label), `radius.lg` (surface), `radius.md` (highlight), `icon.md`, `icon.sm` (check, chevron), `target.touch`, `target.pointer`, `border.hairline`.
- Depth and motion: `elevation.2`, `blur.thick`, `z.popover`, `duration.quick`, `easing.standard` (open), `easing.exit` (close), `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `color.separator.opaque`.

The highlight radius is concentric with the surface: `radius.lg` minus `space.4` of padding gives 12, which is `radius.md`. `color.danger.text` on `material.thick` is a new text-on-surface pair and must be added to `tokens/contrast-pairs.json` before Stable.

## Behaviour
- Opens next to the control or at the pointer, growing from that point, and stays inside the window. Closes on choice, outside press or Escape; focus returns to the opener.
- Order: most-used first, related items grouped, no more than about three groups in a context menu. Destructive items go last, after a separator.
- File actions always use the standard order in `files-and-storage.md`.
- Icons: all items in a group have one, or none do. The same action has the same icon everywhere.
- Every context-menu action is also reachable in the main interface (toolbar, row menu). The row's More button opens the same menu.
- Shortcuts are shown in menus opened from a control, not in context menus.
- Destructive items follow `feedback-and-status.md`: act and offer Undo; confirm only when the loss is permanent and unexpected.
- An item does not offer both a context menu and the text edit menu.
- Keyboard: Up and Down move, Home and End jump, typing a letter moves to the next match, Enter or Space chooses, Right opens a submenu and Left closes it, Escape closes the menu.
- Right to left: icons lead on the right, chevrons and submenus open to the left.
- Reduced motion: fade only. Reduced transparency: `color.bg.elevated`.

## Accessibility
- Roles: menu and menu items; checkable items expose their state; the opener exposes that it has a menu and whether it is open.
- Focus moves to the first item on open and is held in the menu until it closes.
- Long press has an equivalent: the More button and the keyboard menu key or Shift F10.
- Destructive items are marked by position and wording as well as colour.
- Increased contrast: the surface gains a `border.hairline` edge in `color.separator.opaque`, and the highlight gains an outline.

## Content
- Verbs or verb phrases, sentence case, no articles. Good: "Copy link", "Move to…", "Mark as unread". Bad: "Link", "Copy The Link", "Move the file to a folder".
- A trailing ellipsis only when the item needs more input before it acts.
- Toggled items name what will happen: "Hide sidebar", then "Show sidebar". Or use a check mark with a stable label: "Show sidebar".
- Submenu labels predict their contents: "Sort by".
- Title. Good: "3 messages". Bad: "Actions menu".

Apple reference: Menus; Context menus, read 2026-11-11
