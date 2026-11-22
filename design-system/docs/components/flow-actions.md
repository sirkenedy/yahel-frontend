# Flow actions

Status: Specified

Built in `@yahel/ui` as `FlowButton` (actions) and `FlowLink` (navigation), with `FlowDivider`. Styles: `daylight.css`. See also `button.md`.

## Purpose

The actions of an account flow. Each screen has one primary action, always indigo, always first under the question. Anything that changes the address is a link; anything that does something is a button.

## Anatomy

- **Label.** Says what happens.
- **Arrow.** Trailing, on the primary action only.
- **Spinner.** Replaces the arrow while the action is running.
- **Leading icon.** Optional, on the field-height variant.
- **Divider.** A hairline each side of a short word ("or") between two ways of doing the same thing.

## Variants and sizes

| Variant | Use | Size |
|---|---|---|
| Primary | The one main action | `flow.action` high, pill |
| Quiet | The alternative beside it | `flow.action` high, pill, outlined |
| Field | A full-width alternative under a field ("Sign in with a passkey") | `flow.field` high, `radius.field` |
| Link | Text actions and navigation | `target.touch` high |
| Round | Icon-only control (theme) | `target.touch` square |
| Destructive | A small action that removes something | `target.touch` high, pill |

Under 600 px, actions stack and fill the width.

## States

| State | Treatment |
|---|---|
| Default | Primary: `color.daylight.accent` with `color.daylight.on-accent`. Quiet, field, round: `color.daylight.surface` with a hairline |
| Hover | Primary: `color.state.hover` over the accent. Outlined variants: hairline in `color.daylight.accent`. Link: underlined |
| Pressed | Scale to 0.98 |
| Keyboard focus | `border.focus-strong` ring in `color.daylight.accent`, offset `border.focus-offset` |
| Loading | The label says what is happening ("Signing in…"), a spinner replaces the arrow, further presses are ignored |
| Disabled | `opacity.disabled`; not pressable |
| Selected, error | Not applicable |

## Tokens

- Colour: `color.daylight.accent`, `on-accent`, `surface`, `line`, `line-strong`, `ink`, `link`, `danger`, `mute` (divider); `color.state.hover`.
- Type: `type.flow-action`; `type.flow-link` (link); `type.flow-note` (destructive, divider).
- Space and shape: `flow.action`, `flow.field`, `radius.full`, `radius.field`, `border.hairline`, `border.focus-strong`, `space.8`, `space.12`, `space.16`, `space.24`, `icon.sm`, `icon.md`, `target.touch`.
- Motion: `duration.field`, `easing.standard`; spinner `duration.spin`, linear.

## Behaviour

- A second press while an action is running does nothing, including one that arrives before the screen has updated.
- Leaving a step while its action is running does not disable the action on return.
- Links can be opened in a new tab; in-app links go through the router.
- Right-to-left: the arrow mirrors. Reduced motion: no press scale; the spinner slows.

## Accessibility

- Buttons are buttons and links are links. An icon-only control has an accessible name.
- While loading, the button's name is the loading label.
- Targets are at least `target.touch` on touch.
- With increased contrast, links are underlined.

## Content

- One primary action per screen. The label names the outcome: "Sign in", "Send code", "Save and sign in".
- Loading labels end with an ellipsis.

| Good | Bad |
|---|---|
| "Send code" | "Submit" |
| "Use my password instead" | "Click here" |
