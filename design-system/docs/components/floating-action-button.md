# Floating action button

Status: Specified

## Purpose
The one primary action of a screen in compact width: Compose in Mail, New in Drive and Docs, New event in Calendar. In regular and wide layouts the same action is the prominent button at the top of the sidebar, and the floating button is not shown. Do not use it for navigation, for secondary actions or for anything destructive.

## Anatomy
- **Container**: a filled, rounded shape floating above the content.
- **Icon.**
- **Label** (extended variant only), after the icon.
- **Menu** (optional): when the action has kinds (New: document, sheet, folder), the button opens a menu, as a pull-down button does.

## Variants and sizes

| Variant | Size | Use |
|---|---|---|
| Standard | `space.48` square, `icon.lg` | Default |
| Extended | `space.48` tall, icon and label, `space.16` padding | Root views where the icon alone may not be understood. Collapses to standard when the content scrolls |

The shape is `radius.lg` for the standard button and `radius.full` for the extended one. It sits at the trailing bottom corner, `margin.compact` from the edge and `space.16` above the tab bar, inside the safe area. One per screen.

## States

| State | Appearance |
|---|---|
| Default | `color.accent.solid` with the icon and label in `color.label.on-accent`, `elevation.2` |
| Hover (pointer in compact windows) | See the hover token gap in `button.md` |
| Pressed | Container at `opacity.pressed`; shadow unchanged |
| Keyboard focus | Focus ring that follows the container shape |
| Disabled | Not used. If the action is unavailable (read-only folder, offline with no drafts), the button stays and explains on press |
| Loading | Not used. The action opens its view at once and loading happens there |
| Open (menu variant) | Pressed appearance held; the menu rises from the button |
| Hidden | Behind any sheet, dialog or full-screen layer, in selection mode, and while the keyboard is up |

## Tokens
- Colour: `color.accent.solid`, `color.label.on-accent`, `color.accent.default` (focus ring).
- Type: `type.body` at its emphasised weight (extended label).
- Space and shape: `space.8` (icon to label), `space.16`, `space.48`, `margin.compact`, `radius.lg`, `radius.full`, `icon.lg`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.2`, `z.bar`, `duration.quick`, `easing.exit` (hide), `duration.standard`, `easing.spring` (show, extend and collapse), `opacity.pressed`.
- Also used (sizes, selection, increased contrast): `target.touch`, `border.control`.

## Behaviour
- It is a filled, solid control, not glass: it is the single coloured control allowed on the floating layer.
- It stays visible while the content scrolls. The extended variant collapses to the icon on scroll down and extends again at the top.
- It never covers the last row's controls: lists add bottom padding equal to the button height plus its offsets.
- It moves up with a toast or a bottom toolbar so nothing overlaps.
- The action opens from the button: the new view grows from it and returns to it when closed.
- The same action has the same shortcut on keyboard (the shared "new" shortcut in `input.md`).
- Right to left: it sits at the bottom left; the extended label follows the icon on its left.
- Reduced motion: show, hide, extend and collapse cross-fade; no growth from the button.

## Accessibility
- Element: `button`. Its accessible name is the action, whether or not a label shows: "Compose", "New".
- It is in the focus order after the main content and before the tab bar, and is reachable by a landmark or shortcut so keyboard users do not pass the whole list first.
- The target is larger than `target.touch`, and keeps `space.8` or more from the tab bar's targets.
- At the largest text sizes the extended label is dropped rather than truncated.
- Increased contrast: the increased-contrast accent, plus a `border.control` outline in `color.label.on-accent` inset from the edge so the shape stays clear over content.

## Content
- One verb, or verb and noun. Good: "Compose", "New", "New event", "Upload". Bad: "Create a new item", "+", "Add New".
- The label matches the sidebar's primary button in wide layouts, word for word.
- Menu items name the thing made: "Document", "Spreadsheet", "Folder". Bad: "Create new Docs document file".

Apple reference: none (no equivalent)
