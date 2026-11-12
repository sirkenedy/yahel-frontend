# Split view

Status: Specified

## Purpose
Shows two or three levels of the hierarchy side by side: sidebar, content list and detail. Selecting in one pane fills the next. Use a sheet for a short task and a preview for a quick look at a file; do not open a new window for supplementary detail.

## Anatomy
- **Sidebar pane** (optional): see `sidebar.md`.
- **List pane**: the content list.
- **Detail pane**: the selected item.
- **Dividers** between panes; draggable on pointer.
- **Inspector pane** (optional, wide only): details at the trailing side, hideable.

## Variants and sizes

| Size class | Layout |
|---|---|
| Compact | One pane at a time. Selecting pushes the detail; Back returns to the list |
| Regular | List and detail. The sidebar is collapsible and may overlay |
| Wide | Sidebar, list and detail together; optional inspector |

By default the list takes about one third of the space left after the sidebar and the detail two thirds. Dividers are `border.hairline` wide with a grab area of `space.8` on pointer.

Token: `size.pane-min` — minimum pane width. Resizing needs a floor so a pane never shrinks until its divider seems to vanish.

## States

| State | Appearance |
|---|---|
| Default | Panes on `color.bg.base`, separated by a hairline |
| Hover (divider) | Divider thickens to `border.control` in `color.label.tertiary`; resize cursor |
| Pressed, dragging (divider) | Divider in `color.accent.default` |
| Keyboard focus (divider) | Focus ring along the divider |
| Disabled | A divider at its limit stops; it is not dimmed |
| Selected | The selected row in every pane that leads to the detail stays highlighted |
| Nothing selected | Detail shows an empty state: one line and, where useful, one action |
| Loading | Each pane shows its own skeleton; the list stays usable while the detail loads |
| Error | The message sits in the pane that failed; other panes keep working |

## Tokens
- Colour: `color.bg.base`, `color.bg.grouped` (list pane where rows are cards), `color.separator.default`, `color.label.tertiary`, `color.accent.default`, `color.accent.soft` (selection), `color.scrim` (behind an overlaid sidebar).
- Type: none of its own; panes use their content's roles.
- Space and layout: `space.8` (divider grab area), `margin.compact`, `margin.regular`, `margin.wide` (pane content margins), `breakpoint.regular`, `breakpoint.wide`, `border.hairline`, `border.control`, `border.focus`, `border.focus-offset`.
- Depth and motion: `z.base`, `z.bar` (overlaid sidebar), `duration.standard`, `easing.standard` (pane show, hide and resize snap), `duration.emphasized` (push in compact).
- Also used (sizes, selection, increased contrast): `color.separator.opaque`.

## Behaviour
- Layout follows the size class of the window, not the device.
- Going from wide to compact keeps the person's place: with an item open they see the detail, with Back leading to the list. Going back to wide restores both panes and the selection.
- On opening, the detail shows the most relevant item or an empty state; it never opens an arbitrary item that would be marked as read.
- Panes can be resized by dragging on pointer, within minimum and maximum widths; double click resets. Widths are remembered per app.
- The inspector and sidebar can be hidden; each has a toolbar button and a shortcut to bring it back.
- Items can be dragged between panes (a message onto a folder). Every drag has a Move equivalent.
- Each pane scrolls on its own. The view has one title and one toolbar; each pane does not get its own heading bar.
- Keyboard: F6 or the platform equivalent moves focus between panes; arrow keys resize a focused divider.
- Right to left: pane order mirrors, with the sidebar on the right.
- Reduced motion: push and pane changes cross-fade.

## Accessibility
- Each pane is a labelled region ("Message list", "Message"). Dividers are separators with a value, operable by keyboard.
- Selecting a row does not move focus to the detail unless the person opens it (Enter); screen reader users are told the detail changed.
- In compact, Back is the first control in the detail and returns focus to the row that was opened.
- Holds at 200% text: when panes can no longer fit their minimum, the layout drops to the next smaller arrangement instead of clipping.
- Increased contrast: dividers use `color.separator.opaque`.

## Content
- Empty detail. Good: "Select a message to read it". Bad: "Nothing here", "No item selected (0)".
- Pane labels for assistive technology name the content: "Files", "Details". Bad: "Left pane", "Column 2".
- Show and hide controls state the result: "Hide sidebar", "Show details".

Apple reference: Split views, read 2026-11-11
