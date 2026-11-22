# Flow states

Status: Specified

Built in `@yahel/ui` as `FlowNotice` (with a `title`: the banner), `FlowToast`, `FlowConnectionBar`, `FlowSlowHint`, `FlowState`, `FlowReference` and `FlowStep.Resubmit`. Styles: `daylight.css`. Design source: `canvas/project/accounts/states/FeedbackStates.dc.html` and `screens/states/`. See also `flow-feedback.md` and `flow-field.md`.

## Purpose

Everything a sign-in or sign-up step has to tell that is not one field's problem: a failure about the whole step, a passing confirmation, a lost connection, a wait, and the cases where the person cannot continue at all. Pick the smallest that fits: a field message before a banner, a banner before a whole screen.

## Anatomy

- **Banner.** A tone icon, a title that says what happened, a body that says what is safe and what to do, and at most two actions written as verbs. Sits under the heading, above the form.
- **Toast.** One line in the past tense on an inverse surface at the bottom centre, with a close control and a thin bar that shows the time left.
- **Connection bar.** Full width above the header: the offline icon, "You're offline." in bold, and what is safe.
- **Slow hint.** A clock icon and one quiet line under the step.
- **Whole-screen state.** A large icon in a tinted circle, the heading, a lede, an optional note or reference, then one way forward and at most one alternative. It takes the step's place; the header and footer stay.
- **Reference.** A card titled "If you contact us, quote this" with labelled rows in a fixed-width face, and Copy beside a value worth copying.

## Variants and sizes

| Variant | Use |
|---|---|
| Banner, danger | A server error (with the reference), a code that no longer works, details refused, two or more field problems summed up |
| Banner, warning | Too many tries (with a countdown when the server says how long), something that will fail if nothing changes |
| Banner, offline | A step sent while the device had no connection |
| Banner, info | Confirm your email first, single sign-on |
| Banner, success | Something worked and the result stays on the page |
| Toast, success or info | A code was sent, the connection came back |
| State: locked, suspended, organisation paused, expired, error, maintenance | The six whole screens. Expired also words a session that ended and an invitation already used |

## States

| State | Treatment |
|---|---|
| Tones | danger: `color.daylight.danger` on `danger-tint`; warning and offline: `warning` on `warning-tint`; info: `link` on `tint`; success: `success` on `success-tint`. Each tone has its own icon |
| Banner | `radius.lg`, `space.16` padding, a hairline in `color.daylight.line`; under increased contrast the hairline is the tone's colour |
| Toast, entering | Rises over `duration.standard`; its bar empties over `duration.flow-toast` |
| Toast, hover or focus inside | The bar, and so the clock, pauses |
| Countdown | The link is muted with tabular numbers and says the time left; it is `aria-disabled`, not removed |
| State icon | `flow.success-mark` across, pops in like the success mark |
| Hover, pressed, focus | Those of the actions inside (`flow-actions.md`) |
| Disabled, selected | Not applicable |

## Tokens

- Colour: `color.daylight.danger-tint`, `warning-tint`, `success-tint`, `tint`, `danger`, `warning`, `success`, `link`, `ink`, `soft`, `mute`, `canvas`, `surface`, `line`.
- Type: `type.flow-label` (banner, toast, bar, hint), `type.flow-note` (reference), `font.mono` (reference values), `type.flow-display` (state heading).
- Space and shape: `radius.md`, `radius.lg`, `radius.xl`, `radius.full`, `flow.success-mark`, `size.layer-md`, `space.2` to `space.40`, `target.touch`, `elevation.3`, `z.toast`.
- Motion: `duration.flow-toast`, `duration.standard`, `duration.rise`, `easing.standard`, `easing.pop`, `easing.linear`.

## Behaviour

- Every message says what happened, what is safe, and one way forward or a time. Nothing the server wrote is shown; a reference is only ever an id.
- A banner's "Try again" makes the request again: for a step with a form it submits the form (`FlowStep.Resubmit`), so what was typed is used as it stands.
- A toast stays four seconds, pauses under the pointer or focus, and closes on its control. It is never the only place an error is told.
- The connection bar stays until the connection is back; a toast then says so.
- The slow hint appears after 1.2 seconds of waiting and leaves when the wait ends.
- A countdown ticks once a second and turns back into the action when it reaches nought.
- A whole-screen state always has a way out. "Try again" shows the step again.
- Reduced motion: no rise or pop; the toast's bar is hidden but still keeps its time.

## Accessibility

- Danger, warning and offline banners are alerts; info and success banners are statuses. Focus is not moved to a banner.
- A summary banner names the fields; focus goes to the first of them.
- The toast and the connection bar arrive inside live regions that are on the page from the start, so they are announced politely.
- The slow hint is a status.
- A whole-screen state moves focus to its heading and sets the page title to it.
- Colour is never alone: every tone has an icon and words. Icons are hidden from assistive technology.
- The close control and Copy are 44 px targets with accessible names.

## Content

| Good | Bad |
|---|---|
| "Something went wrong on our side. We couldn't finish this step. Nothing was lost. Reference req-7F3K2Q." | "Error 500: Internal Server Error" |
| "Too many tries. Try again in 0:24." | "Rate limit exceeded" |
| "New code sent. Older codes no longer work." | "Success!" |
| "Sign-in is paused for a while." | "Account locked" |
