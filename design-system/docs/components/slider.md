# Slider

Status: Specified

## Purpose

A slider picks a value from a continuous or stepped range where the relative position matters more than the exact number: zoom, opacity, playback position. Use a stepper or a text field when the exact value matters, and a select for a few named levels. On native mobile, audio volume uses the platform's own volume control, not this slider.

## Anatomy

- **Label.** Required, visible or as an accessible name when icons at each end make the purpose clear.
- **Track.** The full range.
- **Fill.** From the minimum to the thumb.
- **Thumb.** The handle.
- **Tick marks.** Optional, for stepped ranges; labels under ticks where they help.
- **End icons or labels.** Optional (small and large, minimum and maximum).
- **Value.** Optional text or an editable field beside the slider.

## Variants and sizes

| Variant | Use |
|---|---|
| Continuous | Any value in the range |
| Stepped | Fixed stops, with tick marks |
| With field | A range wide enough that people need the exact number; the field and slider stay in step |
| Range | Two thumbs for a minimum and maximum |

- Horizontal only, except media scrubbers that follow platform convention.
- Target: the thumb's hit area is `target.touch` on touch and `target.pointer` on pointer, whatever its visible size.
- Token: `size.slider-thumb` (touch and pointer values) — the visible thumb diameter has no token.

## States

| State | Treatment |
|---|---|
| Default | Track `color.fill.primary`, fill `color.accent.solid`, thumb `color.bg.elevated` with `elevation.1` |
| Hover (pointer) | Thumb gains a halo of `color.accent.soft` |
| Pressed and dragging | Thumb grows slightly; the value shows above it |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset`, on the thumb |
| Disabled | `opacity.disabled`; fill becomes `color.label.quaternary` |
| Loading | Not used. If the range depends on data, show a skeleton in place of the slider |
| Error | Only on the paired field: message in `color.danger.text` with icon |

## Tokens

- Colour: `color.fill.primary`, `color.accent.solid`, `color.accent.soft`, `color.bg.elevated`, `color.label.quaternary`, tick `color.label.tertiary`.
- Shape: track and thumb `radius.full`; track height `space.4`; thumb outline `border.hairline` in `color.separator.default`; shadow `elevation.1`.
- Text: label `type.subhead`; value and tick labels `type.footnote` with tabular figures.
- Space: `space.12` between end icon and track; `space.8` track to tick labels.
- Motion: thumb settles to a stop over `duration.quick` with `easing.standard`; hover `duration.instant`.

## Behaviour

- Drag the thumb, or press the track to move the thumb there. The result is shown live as the value changes (the page zooms while dragging).
- Keyboard: Left and Down decrease, Right and Up increase by one step; Page Up and Page Down by a larger step; Home and End to the ends.
- Minimum is at the leading side and maximum at the trailing side.
- A stepped slider snaps to the nearest stop on release. A light haptic marks each stop on mobile.
- The change applies as it happens and is part of the undo history as one step per drag.
- Right-to-left: sliders that show an amount mirror, so the minimum is at the right. A media scrubber, which shows time, does not mirror.
- Reduced motion: the thumb moves without easing; no growth on press.

## Accessibility

- Native `input type="range"`, or `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and a readable `aria-valuetext` ("150%").
- A range slider has two thumbs, each named ("Minimum price", "Maximum price").
- A paired field gives a non-drag way to set an exact value.
- The fill and thumb position show the value; colour is not the only signal.
- Increased contrast: the track gains a `border.hairline` outline in `color.border.control`; the thumb outline becomes `color.label.primary`.

## Content

| Good | Bad |
|---|---|
| Label "Zoom", value "150%" | Label "Adjust" |
| End labels "Small" and "Large" | Unlabelled icons that look the same |
| Value text "2 of 5" for a stepped slider | "40" with no unit |

Apple reference: Sliders, read 2026-11-11
