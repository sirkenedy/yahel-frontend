# Flow feedback

Status: Specified

Built in `@yahel/ui` as `FlowNotice`, `FlowWaiting`, `SuccessMark` and `PasswordStrength`. Styles: `daylight.css`. See also `banner.md` and `../patterns/feedback-and-status.md`.

## Purpose

Short feedback inside one step of an account flow: a reassurance or confirmation, a failed request with the way forward, a wait the person cannot speed up, a small celebration, and a verdict on a new password.

## Anatomy

- **Notice.** An icon and one or two sentences.
- **Waiting card.** A spinner, a title ("Waiting for this device") and a line of what to do.
- **Success mark.** A tick in a tinted circle.
- **Password strength.** Four bars and a verdict in words with the length.

## Variants and sizes

| Variant | Use |
|---|---|
| Notice, info | Reassurance ("We will never ask for your password"), confirmation ("New code sent.") |
| Notice, danger | A failed request, above the fields |
| Waiting | The passkey prompt, creating an account |
| Success mark | `flow.success-mark` across |
| Strength | Scores 1 to 4: Too weak, Fair, Good, Strong |

## States

| State | Treatment |
|---|---|
| Info | `color.daylight.tint` background, icon in `color.daylight.link` |
| Danger | `color.daylight.surface` with a `border.control` outline in `color.daylight.danger` |
| Waiting | Spinner turning: `color.daylight.track` with one arc in `color.daylight.accent` |
| Success, entering | Pops from 0.6 scale over `duration.rise` with `easing.pop` |
| Strength 1 and 2 | Bars and verdict in `color.daylight.warning` |
| Strength 3 | `color.daylight.accent` bars, verdict in `color.daylight.link` |
| Strength 4 | `color.daylight.success` |
| Strength, nothing typed | Not shown |
| Hover, pressed, focus, disabled, selected | Not applicable; none of these is a control |

## Tokens

- Colour: `color.daylight.tint`, `surface`, `ink`, `mute`, `link`, `danger`, `warning`, `success`, `accent`, `track`, `line`.
- Type: `type.flow-label` (notice, waiting detail), `type.flow-lede` at semibold (waiting title), `type.flow-note` (verdict).
- Space and shape: `radius.md`, `radius.xl`, `radius.full`, `flow.spinner`, `flow.success-mark`, `flow.strength-bar`, `space.4` to `space.20`, `border.control`, `border.hairline`.
- Motion: `duration.spin` (linear), `duration.rise`, `easing.pop`.

## Behaviour

- A failure says what happened and what to do next, and never repeats what the server said.
- A failure belongs to the visit in which it happened: it is gone when the step is left and reopened.
- A closed passkey prompt is an info notice with two ways forward, not a failure.
- The strength verdict updates as the password is typed.
- Reduced motion: the success mark appears without the pop; the spinner slows.

## Accessibility

- Danger notices are alerts; info notices and the waiting card are statuses.
- The success mark is decorative; the heading beside it says what happened.
- Strength is always in words, never colour alone, and is announced politely.
- Icons are hidden from assistive technology.

## Content

| Good | Bad |
|---|---|
| "That email and password don't match. Check both and try again." | "User not found" |
| "Can't reach Yahel. Check your connection and try again." | "Network error 0" |
| "Strong · 22 characters" | A green bar with no words |
