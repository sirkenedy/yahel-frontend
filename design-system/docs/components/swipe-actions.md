# Swipe actions

Status: Specified

## Purpose
Quick actions on a list row, revealed by swiping the row sideways on touch: archive, trash, mark as read, pin. They are a shortcut only. Every swipe action is also in the row's menu, so people who use a pointer, keyboard or assistive technology lose nothing.

## Anatomy
- **Row content**, which slides.
- **Action buttons** revealed behind it: icon and short label.
- **Leading set** (swipe towards the trailing edge) and **trailing set** (swipe towards the leading edge).

## Variants and sizes

| Set | Holds | Limit |
|---|---|---|
| Leading | One reversible, positive action (mark as read, pin) | 1 |
| Trailing | The most frequent actions; the destructive one is outermost | 3 |

Each action is at least `target.touch` wide plus `space.16` padding, and as tall as the row. Icons are `icon.lg`. Labels show when the row is two lines or taller; one-line rows show the icon alone, with the label as the accessible name. Swipe actions exist only on touch; on pointer the same actions appear as row buttons on hover and focus, and in the row menu.

## States

| State | Appearance |
|---|---|
| Default | Hidden; the row looks like any other |
| Revealed | The row rests open, showing the actions. Any touch elsewhere closes it |
| Pressed | The action at `opacity.pressed` |
| Armed (full swipe) | The outermost action grows to fill the revealed area; a light haptic marks the threshold |
| Keyboard focus | When opened by an assistive gesture, actions take the focus ring |
| Disabled | An unavailable action is left out, not dimmed |
| Loading | Not shown here. The action applies at once (optimistic) |
| Error | The row returns and a toast says what failed |
| Hover, selected | Not applicable. Swipe is off while the list is in selection mode |

| Action kind | Background | Icon and label |
|---|---|---|
| Neutral (mark as read, pin, move) | `color.fill.primary` on `color.bg.elevated` | `color.label.primary` |
| Primary (archive) | `color.accent.solid` | `color.label.on-accent` |
| Destructive (trash) | `color.danger.solid` | `color.label.on-accent` |

Orange, yellow and green solids are not used behind labels here; white text on them fails contrast.

## Tokens
- Colour: `color.fill.primary`, `color.bg.elevated`, `color.label.primary`, `color.accent.solid`, `color.danger.solid`, `color.label.on-accent`, `color.accent.default` (focus ring).
- Type: `type.caption-1` (action label).
- Space and shape: `space.4` (icon to label), `space.16`, `target.touch`, `icon.lg`, `border.focus`, `border.focus-offset`.
- Motion: `duration.standard`, `easing.spring` (settle open or closed), `duration.quick`, `easing.exit` (row leaving), `opacity.pressed`.
- Also used (sizes, selection, increased contrast): `border.control`, `color.border.control`.

## Behaviour
- The row follows the finger. Released past the first threshold it rests open; released before, it closes.
- A full, deliberate swipe performs the outermost action. For a destructive action this is the only one-gesture path; a short swipe needs a second tap on the button.
- Destructive swipe actions are always undoable: the row leaves and a toast offers Undo, as `feedback-and-status.md` requires. Nothing permanent is ever on a swipe.
- Only one row is open at a time. Scrolling closes it.
- A horizontal swipe that starts at the screen edge belongs to the system's back gesture; swipe actions do not respond there.
- The same action is on the same side in every app. Where people may choose their swipe actions (Mail), the setting names both sides.
- Right to left: the sets swap sides with the layout, so the leading set is revealed by swiping towards the left.
- Reduced motion: the row cross-fades out instead of sliding away; the follow-the-finger movement stays, since it is direct manipulation.

## Accessibility
- Each swipe action is exposed as a custom action on the row for screen readers and switch control, and listed in the row's More menu and context menu.
- Meaning is carried by icon and label, not background colour.
- After an action, focus moves to the next row and the result is announced: "Archived. Undo available."
- The Undo toast stays while focused and can be recalled.
- Increased contrast: neutral actions gain a `border.control` outline in `color.border.control`; solid actions use their increased-contrast values.

## Content
- One word where possible, a verb, the same word as the menu item. Good: "Archive", "Trash", "Read", "Unread", "Pin". Bad: "Delete this message", "Mark", "OK".
- Toggling actions name what will happen: "Unread" on a read message.
- Toast. Good: "Moved to Trash. Undo". Bad: "Success!".

Apple reference: none (no equivalent page; Lists and tables, read 2026-11-11, does not cover swipe actions)
