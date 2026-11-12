# Input

People use this product by touch, pointer, keyboard and assistive technology, often switching within a session. Every action must be reachable by each.

## Keyboard

- Everything is operable by keyboard alone: Tab moves between controls, arrows move within a group (tabs, lists, menus, grids), Enter and Space activate, Escape closes the top layer.
- Focus is always visible: a 2 px ring in `accent.default`, offset 2 px (`border.focus`, `border.focus-offset`). Shown for keyboard focus, not on pointer press.
- Focus order follows reading order. Opening a layer moves focus into it; closing returns focus to the control that opened it.
- **Shortcuts.** Shared actions use the same shortcut in every app (search, compose or new, undo, redo, select all, open shortcuts list). Platform conventions apply: Command on Apple platforms, Control elsewhere. Single-key shortcuts can be turned off. A shortcut list opens with `?`.
- Never override the browser's or operating system's own shortcuts.

## Pointer

- Hover shows that something is interactive; it never reveals the only path to an action. Anything that appears on hover also appears on focus and has a touch equivalent.
- Hover feedback within 100 ms. Tooltips on icon-only controls after a short delay, with the shortcut if there is one.
- Right-click opens a context menu containing the same actions available elsewhere.
- Cursor changes only where it carries meaning: text, resize, drag.
- A drag starts after a few pixels of movement, not on press, so a click never moves anything. Holding the platform's copy modifier at the moment of the drop (Option on Apple platforms, Control elsewhere) copies instead of moving.

## Touch and gestures

- Targets at least 44 by 44.
- Standard gestures keep standard meanings: tap to activate, long press for the context menu, swipe a row for its quick actions, pull to refresh, pinch to zoom content.
- Every gesture has a visible alternative. Swipe actions are also in the row's menu.
- Never take over system edge gestures (back, home, app switcher).
- Never redefine the platform's undo gestures (three-finger swipe on iOS and iPadOS, shake on iPhone).
- Destructive swipe actions require a full deliberate swipe or a second tap, and can be undone.

## Selection

- One item: tap or click. Many: checkboxes appear in a selection mode on touch; Shift and Command or Control extend selection on pointer and keyboard.
- Selected state uses `accent.soft` plus a check or shape change, not colour alone.
- A selection bar states the count and the available bulk actions.

## Text entry

- Use the right keyboard and input type (email, number, URL) and enable autofill.
- Never block paste, including in password and code fields.
- Respect the platform's dictation, autocorrect and handwriting input.

## Assistive technology

- Screen readers: correct role, name and state on every control; headings structure each screen; changes are announced politely.
- Switch control and voice control: every action has a visible, speakable label.
- See `accessibility.md` for the full requirements.

Checked against Apple HIG: Undo and redo, Drag and drop (input rules only), 2026-11-11.
