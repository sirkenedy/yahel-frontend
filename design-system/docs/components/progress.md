# Progress bar and spinner

Status: Specified

## Purpose

A progress indicator shows that work is under way. A progress bar shows how far a task has got; a spinner shows only that something is happening. Use a skeleton while a layout's content loads, and no indicator at all for waits under a second. See the response times in `../patterns/feedback-and-status.md`.

## Anatomy

**Progress bar:** track, fill, optional label naming the task, optional value text, optional Cancel or Pause control.

**Spinner:** a rotating arc. Optional visible label only when it stands alone in a region; never beside a control that already says what is happening.

## Variants and sizes

| Variant | Use |
|---|---|
| Bar, determinate | Duration or amount is known: uploads, exports, imports |
| Bar, indeterminate | Unknown at first; switches to determinate as soon as the amount is known |
| Spinner | Short waits of 1 to 10 seconds, background refresh, inside a button or field |
| Circular, determinate | Small spaces where an amount is known (a file tile while uploading) |

- Bar: track height `space.4`; width fills its container.
- Spinner: `icon.sm` inside buttons and fields, `icon.md` inline, `icon.lg` standing alone in a region.
- A spinner never becomes a bar part-way through, or the reverse. An indeterminate bar may become determinate.
- Never a full-screen spinner.

## States

| State | Treatment |
|---|---|
| In progress | Fill or arc in `color.accent.solid` |
| Indeterminate | A segment of fill travels along the track |
| Paused | Fill in `color.label.tertiary`; value text says "Paused" |
| Stalled | Motion continues; after a set wait the label explains and offers "Try again" |
| Complete | Fill reaches the end, then the indicator is replaced by the result |
| Error | Fill in `color.danger.solid`, with an icon and message; "Try again" |
| Inside a disabled control | Spinner takes the control's label colour |

Hover, pressed, keyboard focus and selected apply only to the Cancel or Pause button, as Button.

## Tokens

- Colour: track `color.fill.primary` (bar) and `color.fill.secondary` (spinner's faint ring); fill `color.accent.solid`; `color.label.tertiary`; `color.danger.solid`; on a filled button the spinner uses `color.label.on-accent`.
- Shape: `radius.full`.
- Text: label `type.subhead`; value `type.footnote` in `color.label.secondary`, tabular figures.
- Space: `space.8` label to bar; `space.8` spinner to its label.
- Motion: fill advances over `duration.standard` with `easing.standard`.
- Token: `duration.loop` and `easing.linear` — the period and constant pace of spinner rotation and the indeterminate segment; neither exists.

## Behaviour

- Report progress honestly and evenly. Do not race to nearly done and then wait. Fill never moves backwards.
- Keep it moving. A still indicator reads as frozen.
- Same place every time: uploads in the upload panel, a document's save state by its title, a button's progress inside the button.
- The control that started the work shows the spinner and cannot be triggered twice.
- Over 10 seconds: determinate, running in the background, with a notification on completion. The person can keep working.
- Offer Cancel when stopping is safe, and Pause when stopping would lose work. Say so if cancelling discards progress.
- Right-to-left: the bar fills from the right. The spinner's direction does not change.
- Reduced motion: the spinner becomes a slow fade between two opacities; the indeterminate bar becomes a static, half-filled striped track with its label. Determinate fill still advances, without easing.

## Accessibility

- Bar: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a name ("Uploading 3 files"). Indeterminate omits the value.
- Spinner: the region it covers sets `aria-busy="true"`; the spinner has a text alternative that names the task. Decorative when a visible label already says it.
- Announce the start and the end politely, and milestones at most every quarter. Never every step.
- Error and paused states have words and an icon, not only a colour change.
- Increased contrast: the track gains a `border.hairline` outline in `color.border.control`.

## Content

- Name the task and, where known, the amount. "Loading" alone says nothing.
- Button progress labels use the action's present participle.

| Good | Bad |
|---|---|
| "Uploading 3 of 8 files" | "Loading..." |
| "Saving" (inside the button) | "Please wait" |
| "Exporting 'Q3 plan' as PDF" | "Processing" |
| "Upload paused. Offline." | A bar that stops with no words |

Apple reference: Progress indicators, Loading, read 2026-11-11
