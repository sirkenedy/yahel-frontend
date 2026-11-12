# Toast

Status: Specified

## Purpose

A toast confirms the result of an action the person just took and offers a way back: "Moved to Trash" with Undo. It is the reason most actions need no confirmation dialog. Use a message next to the field for a field problem, a banner for a condition affecting the whole view, and a dialog when a decision is needed first. See `../patterns/feedback-and-status.md`.

## Anatomy

- **Message.** Required. One line where possible, two at most.
- **Action.** Optional. One button, usually "Undo".
- **Close.** Shown when the toast has an action or reports a failure.
- **Icon.** Only on a failure toast, with the message; never colour alone.

## Variants and sizes

| Variant | Use |
|---|---|
| Confirmation | The action succeeded. No action button |
| Undo | The action succeeded and can be reversed |
| Failure | A background action failed and nothing on screen represents it. Has "Try again" |

- Width follows the message up to a maximum. Token: `size.layer-sm` — maximum width of dialogs, popovers and toasts.
- Action button: `target.touch` high on touch; `target.pointer` on pointer.
- Compact: bottom centre, above the tab bar and safe area. Regular and wide: bottom, at the leading edge of the content pane.

## States

| State | Treatment |
|---|---|
| Entering, visible, leaving | See Behaviour |
| Hover or keyboard focus within | The timer pauses for as long as it lasts |
| Action hover, pressed, focus | As Button |
| Action in progress | The button shows a spinner; the toast stays until the result is known |
| Action failed | The message is replaced: "Couldn't undo. Try again." |

A toast is never disabled and has no selected state.

## Tokens

- Surface: Token: `color.bg.inverse` and `color.label.on-inverse` — the review canvas draws the toast as a dark surface with light text in both themes, and no semantic role exists for that. `radius.lg`, `elevation.2`, `z.toast`.
- Action button fill: `color.fill.secondary`. Failure icon: `color.danger.solid`.
- Text: `type.body`; action label at the emphasized weight.
- Space: `space.16` leading padding, `space.8` around the action, `space.12` between message and action, `space.16` from the window edge or bar.
- Motion: enter `duration.standard` with `easing.spring`; exit `duration.quick` with `easing.exit`.
- Token: `duration.toast` — minimum time a toast stays (the 5-second rule in `feedback-and-status.md`).

## Behaviour

- Stays for at least the minimum time; longer for longer messages. The timer pauses on hover and focus, while a screen reader is reading it, and while the window is in the background.
- **Recall.** The action never depends on catching the toast. After it leaves, the same undo is available from the standard Undo shortcut and the Edit or overflow menu ("Undo move to Trash") for as long as it is still possible. A failure toast leaves its message on the item or in the notification list.
- One toast at a time. A new one replaces the current one; the replaced action stays in the undo history.
- Never covers the primary action, a floating action button or the keyboard. It does not take focus and does not block anything behind it.
- Swipe sideways or down to dismiss on touch; Close or Escape (when focused) on keyboard.
- The toast sits next in the tab order after the control that caused it, so one Tab reaches Undo.
- Motion: rises from the bottom edge. Reduced motion: cross-fade.
- Right-to-left: message and action order mirror; the wide-layout position moves to the other side.

## Accessibility

- `role="status"` (polite) for confirmation and undo; `role="alert"` for failure. The action is a real button, announced with the message: "Moved to Trash. Undo, button."
- Meets the timing requirement by pause and recall, not by a longer timer alone.
- Increased contrast: a `border.hairline` edge in `color.separator.opaque`.
- Reduced transparency: no change; the surface is solid.
- At 200% text the action moves under the message.

## Content

- Past tense, names the thing when it helps, no full stop on a single phrase. Counts as numerals.
- The action is one word where possible.

| Good | Bad |
|---|---|
| "Moved to Trash" + "Undo" | "Success! Your file has been deleted." |
| "3 conversations archived" + "Undo" | "Archived" + "Click to undo" |
| "Couldn't send. Check your connection." + "Try again" | "Error 503" |

Apple reference: none (no equivalent)
