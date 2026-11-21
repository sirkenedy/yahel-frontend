# Flow step

Status: Specified

Built in `@yahel/ui` as `FlowStep` with the parts `Back`, `Intro`, `Heading`, `Lede`, `Form`, `Body`, `Actions`, `Links`. Styles: `daylight.css`.

## Purpose

A flow step is one question of an account flow. It asks one thing, offers one primary action, and shows the ways out that are not the main path. Use one step per screen; do not put two questions on one.

## Anatomy

- **Back link.** Optional, first. Leads to the step before.
- **Context.** Optional: progress, or the chip of the account the step is about (`flow-account.md`).
- **Intro.** The heading (the question) and an optional lede.
- **Failure.** Optional notice when the step's request failed (`flow-feedback.md`).
- **Form.** Wraps the body and the actions when the step has fields, so Enter submits.
- **Body.** The field, the choices or the status.
- **Actions.** The primary action first, then at most one quiet action.
- **Links.** Other ways forward: "Forgot password?", "Use a passkey".

## Variants and sizes

| Variant | Notes |
|---|---|
| Forward | Parts rise from `flow.rise` below |
| Back | Parts settle from `flow.rise` above |

Gap between parts `flow.section-gap`; inside the body `flow.body-gap`. Heading `type.flow-display`: 36 px with a pointer, 29 px on touch. Lede up to `flow.measure` wide.

## States

| State | Treatment |
|---|---|
| Entering | Each part fades and moves in over `duration.rise`, one `duration.stagger` after the last |
| Settled | No movement |
| Back link, hover | Underlined |
| Keyboard focus | Ring on links and controls; none on the heading, which is not a control |
| Loading | The primary action shows it (`flow-actions.md`); the step stays as it is |
| Error | A field error beside the field, or a failure notice above the body |
| Disabled, selected | Not applicable |

## Tokens

- Colour: `color.daylight.ink` (heading), `soft` (lede, back link), `accent` (focus ring).
- Type: `font.display` with optical sizing for the heading (`type.flow-display`); `type.flow-lede`; `type.flow-link`.
- Space: `flow.section-gap`, `flow.body-gap`, `flow.measure`, `space.8`, `space.12`, `space.16`, `space.24`, `target.touch`.
- Motion: `duration.rise`, `duration.stagger`, `easing.standard`, `flow.rise`.

## Behaviour

- When a step appears, focus moves into it: to the first field where a keyboard is likely (hover and a fine pointer), to the heading on touch screens so the keyboard does not cover the question.
- Enter in any field submits the step.
- Under 600 px the actions stack and fill the width.
- Reduced motion: no entrance animation.
- Right-to-left: the layout and the back arrow mirror.

## Accessibility

- The step is a region named by its heading, a level-one heading.
- The back link is a link; actions are buttons.
- Every text pair meets 4.5:1 in all four themes (token build).
- A scan must wait for the entrance to finish, or it measures half-transparent text.

## Content

- The heading is six words or fewer and ends with a full stop or a question mark.
- The lede says what happens and why, in one or two sentences.
- Every step that can be gone back from has a Back link. (The drawn boards omit it because they show a step opened directly.)

| Good | Bad |
|---|---|
| "Enter your password." | "Password entry" |
| "It takes under a minute." | "Please be patient while we process your request" |
