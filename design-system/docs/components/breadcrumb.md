# Breadcrumb and path

Status: Specified

## Purpose
Shows where the current folder or item sits in a hierarchy, and lets the person move to any level above it: Drive locations, shared drives, Admin organisational units. It shows location, not history; Back handles history. Do not use it for flat sections or for steps in a flow.

## Anatomy
- **Root**: the top location, with its icon ("My files", a shared drive, an organisation).
- **Ancestors**: each a control, in order.
- **Separators**: a chevron between levels; decorative.
- **Current location**: the last item; text, not a link. In Drive it may be a pull-down button with the folder's own actions.
- **Overflow control**: an ellipsis button that opens a menu of the hidden middle levels.

## Variants and sizes

| Variant | Where | Form |
|---|---|---|
| Path | Regular and wide; at the top of the content area, under the top bar | Full row; middle levels collapse into the overflow menu when space runs out |
| Compact path | Compact | The current location as the view title, with a pull-down listing every ancestor up to the root |
| Read-only path | Details panels, search results, move pickers | One line of text with a leading icon, in `color.label.secondary`; not interactive |

Items are `target.touch` tall on touch and `target.pointer-min` or taller on pointer, with `space.4` between an item and its separator. Item text is `type.body`; the read-only path is `type.footnote`.

## States

| State | Appearance |
|---|---|
| Default | Ancestors in `color.label.secondary`; current location in `color.label.primary` at its emphasised weight |
| Hover | Ancestor text in `color.label.primary` on `color.fill.tertiary`, `radius.sm` |
| Pressed | `color.fill.secondary` |
| Keyboard focus | Focus ring around the item |
| Disabled | A level the person cannot open is shown as plain text, not dimmed to illegibility, and named generically where its name is private |
| Loading | Known levels show at once; unknown ones show a skeleton of text height |
| Error | The path falls back to the root and the current name; the content area carries the message |
| Drop target | `color.accent.soft` with a `border.control` outline in `color.accent.default` while an item is dragged over an ancestor |
| Selected | Not applicable |

## Tokens
- Colour: `color.label.primary`, `color.label.secondary`, `color.label.tertiary` (separators), `color.fill.tertiary`, `color.fill.secondary`, `color.accent.soft`, `color.accent.default`.
- Type: `type.body`, its emphasised weight for the current location; `type.footnote` (read-only path).
- Space and shape: `space.4`, `space.8` (item padding, icon to text), `radius.sm`, `icon.sm` (separator, root icon), `target.touch`, `target.pointer-min`, `border.control`, `border.focus`, `border.focus-offset`.
- Motion: `duration.instant` (hover, press), `duration.quick`, `easing.standard` (levels collapsing into overflow).

## Behaviour
- Location is always visible wherever files are shown, as `files-and-storage.md` requires.
- Selecting an ancestor opens it and restores its scroll position.
- When the row is too narrow, levels collapse from the middle: the root and the current location stay, then the parent, then the rest. Long names truncate at the end and show in full on hover and focus.
- The path sits in the content area, not inside the toolbar's action groups, and scrolls with the content header unless the view pins it.
- Ancestors accept drops, to move items up the hierarchy. Move in the item menu is the equivalent.
- A shared item opened from a link shows only the levels the person can access; the path starts at "Shared with me" rather than revealing a private parent.
- The root names the account context where both personal and organisation locations can appear.
- Keyboard: each item is a Tab stop; Enter opens; the overflow and pull-down follow `menu.md`.
- Right to left: order runs from the right; chevrons point left.

## Accessibility
- Element: `nav` labelled "Location", containing an ordered list of links. The current location is marked as the current page.
- Separators are hidden from assistive technology.
- The overflow button is named "Show 3 more levels" and exposes its menu state.
- The compact pull-down's name includes the location: "Budgets, change location".
- Holds at 200% text: more levels collapse; nothing wraps to a second line.
- Increased contrast: ancestors use `color.label.primary` and are underlined, so links are not marked by colour alone.

## Content
- Each level shows the folder's own name, unchanged. Root names are fixed. Good: "My files", "Shared with me", "Northwind Studio". Bad: "Root", "Home /", "~/".
- Overflow name. Good: "Show 3 more levels". Bad: "…".
- Hidden level. Good: "Private folder". Bad: "Access denied (403)".

Apple reference: Path controls, read 2026-11-11
