# Toggle

Status: Specified

## Purpose

A toggle turns one setting on or off, and the change takes effect at once. Use a checkbox when the choice applies only after a confirming button, or when several items are picked from a list. Use radio buttons or a segmented control for more than two options. Outside a list or form row, use a button with a selected state (bold, mute) instead of a switch.

## Anatomy

- **Track.** Pill that shows the state.
- **Thumb.** Circle that slides to the trailing side when on.
- **Label.** Required. In the row, at the leading side.
- **Description.** Optional, under the label.

## Variants and sizes

| Size | Use | Target |
|---|---|---|
| Regular | Touch rows | The whole row, at least `target.touch` high |
| Compact | Pointer rows and dense forms | The row, at least `target.pointer` high |

- Token: `size.switch-width` and `size.switch-height` (regular and compact values) — the track has no dimension tokens. The thumb is the track height minus `space.2` on each side.
- One switch per row. The switch sits at the trailing end.

## States

| State | Treatment |
|---|---|
| Off | Track `color.fill.primary`; thumb at the leading side |
| On | Track `color.accent.solid`; thumb at the trailing side |
| Hover (pointer) | Row background `color.fill.tertiary` |
| Pressed | Thumb widens slightly toward the other side; track at `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default` around the track, offset `border.focus-offset` |
| Disabled | `opacity.disabled`. A setting locked by an administrator shows a lock icon and "Managed by Northwind Studio" |
| Loading | The thumb moves at once (optimistic); a spinner replaces the thumb's centre if the server takes over a second |
| Error | The thumb returns; a message appears under the row: "Couldn't turn on. Try again." |

There is no mixed state. A setting with children that differ uses a checkbox.

## Tokens

- Colour: `color.fill.primary`, `color.accent.solid`, thumb `color.label.on-accent`, off-state outline `color.border.control` at `border.control` in increased contrast.
- Shape: `radius.full`. Thumb shadow `elevation.1`.
- Text: label `type.body`; description `type.footnote` in `color.label.secondary`.
- Space: `space.12` between label and switch; `space.2` thumb inset.
- Motion: thumb travel `duration.quick` with `easing.spring`; colour `duration.quick` with `easing.standard`.

## Behaviour

- Press anywhere on the row, or drag the thumb. Space toggles when focused. Enter does not submit anything.
- The effect is immediate. If turning it on needs a permission or a confirmation, ask first and move the thumb only when granted.
- The label never changes with the state. It describes what happens when the toggle is on.
- A light haptic on change on mobile, subject to system settings.
- Right-to-left: the switch moves to the other end of the row and the on position is at the inline end.
- Reduced motion: the thumb changes position with a cross-fade and no overshoot.

## Accessibility

- `input type="checkbox"` with `role="switch"`, named by the label, described by the description. State is announced as on or off.
- The state does not rely on colour: the thumb position changes, and increased contrast adds on and off marks inside the track and an outline on the off track.
- The row is one target; the label and switch are not separate tab stops.
- A locked toggle stays focusable so the reason can be read.
- At 200% text the label wraps beside the switch; the switch does not shrink.

## Content

- Name the thing being turned on. No "Enable", no questions, no negatives.

| Good | Bad |
|---|---|
| "Desktop notifications" | "Enable desktop notifications?" |
| "Show profile photo to people outside Northwind Studio" | "Don't hide profile photo" |
| "Managed by Northwind Studio" | A greyed switch with no reason |

Apple reference: Toggles, read 2026-11-11
