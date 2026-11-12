# Stepper

Status: Specified

## Purpose

A stepper raises or lowers a number in small fixed steps: copies to print, guests, font size, a reminder in minutes. Use a text field alone when values are large or arbitrary, a slider when relative position matters, and a select for a few named choices.

## Anatomy

- **Label.** Required.
- **Value.** Always visible, between or beside the buttons. Editable as a field unless the range is very small.
- **Decrease button.** Minus icon.
- **Increase button.** Plus icon.
- **Unit.** Optional, after the value.

## Variants and sizes

| Variant | Use |
|---|---|
| With field | Default. Buttons either side of an editable value |
| Buttons only | In a list row, where the row's value text shows the number |

- Buttons: `target.touch` square on touch; `target.pointer` high on pointer and never below `target.pointer-min` wide.
- The two buttons keep `space.8` between their targets, or share a container with a divider.
- The value field is wide enough for the largest value in the range.

## States

| State | Treatment |
|---|---|
| Default | Buttons `color.fill.secondary` with icons in `color.label.primary` |
| Hover (pointer) | `color.fill.primary` |
| Pressed | `opacity.pressed`; repeats while held |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| At a limit | That button takes `opacity.disabled`; the other stays active |
| Disabled | Whole control at `opacity.disabled`, with a reason nearby |
| Error | Field outline `color.danger.solid`; message in `color.danger.text` with icon, stating the allowed range |
| Mixed | The value shows "Mixed"; pressing a button applies the step to each item |

No loading state; the value changes locally at once.

## Tokens

- Colour: `color.fill.secondary`, `color.fill.primary`, `color.label.primary`, `color.separator.default`, `color.danger.solid`, `color.danger.text`.
- Shape: container `radius.md` on touch, `radius.sm` on pointer; divider `border.hairline`.
- Text: value `type.body` with tabular figures; label `type.subhead`; unit `color.label.secondary`. Icons `icon.md`.
- Space: `space.8` between buttons and value; `space.12` label to control.
- Motion: press feedback `duration.instant`.

## Behaviour

- Each press changes the value by one step. Pressing and holding repeats, speeding up after a moment.
- Shift with a press, or Page Up and Page Down, changes by a larger step.
- With focus in the field: Up and Down arrows step, Home and End go to the limits, typing sets the value directly. A typed value outside the range is kept and reported, not silently changed.
- The value stops at its limits; it does not wrap round.
- The buttons are not separate tab stops when the field is editable; the field is the stop and the arrows do the work. Buttons-only steppers have two tab stops.
- A light haptic on each step on mobile; a distinct one at a limit.
- Right-to-left: decrease stays at the inline start and increase at the inline end, so the pair mirrors with the layout. The numeral does not mirror.
- Reduced motion: no change; nothing moves.

## Accessibility

- The field is `role="spinbutton"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, named by the label.
- Buttons are named for what they change: "Decrease guests", "Increase guests".
- The new value is announced after each step, without repeating the label.
- A limit is shown by the disabled button and stated in help text, not by colour.
- Increased contrast: buttons gain a `border.control` outline in `color.border.control`.

## Content

| Good | Bad |
|---|---|
| Label "Copies", value "2" | Label "Number" |
| "Remind me 10 minutes before" | "10" with the unit left to guesswork |
| "Choose between 1 and 50" | "Out of range" |
| "Decrease guests" (accessible name) | "Minus" |

Apple reference: Steppers, read 2026-11-11
