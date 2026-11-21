# Flow shell, progress and receipt

Status: Specified

Built in `@yahel/ui` as `FlowShell`, `BrandMark`, `FlowProgress`, `Receipt` and `DemoMarker`. Styles: `daylight.css`. Design source: `canvas/project/accounts/`.

## Purpose

The flow shell is the page frame of every sign-in and sign-up screen ("Daylight"): one question in the middle of a quiet page, the brand above it and the data-location promise below. Progress says how far along a multi-step flow is and how much is left. The receipt shows the account forming as questions are answered, so nothing at the end is a surprise. Use these only for account flows; product apps use the top bar and their own layouts.

## Anatomy

- **Skip link.** First in the page; jumps to the question.
- **Header.** Brand mark (a link to the start of sign-in) at the leading side; at the trailing side an optional prompt and link ("New to Yahel? Create an account") and the theme control.
- **Question column.** One `FlowStep` (see `flow-step.md`).
- **Summary.** Optional, beside the question on wide screens: the receipt.
- **Footer.** A lock icon and the data-location line; language, Help, Privacy, Terms.
- **Progress.** "03 / 07 · About 90 sec" and one pip per step, above the question in multi-step flows.
- **Receipt.** A title and rows of label and value; each row is done, current or upcoming.
- **Demo label.** A small fixed label shown only while the app is serving stand-in data.

## Variants and sizes

| Part | Size |
|---|---|
| Question column | Up to `flow.column`; the wrap is `flow.wrap` |
| Summary | `flow.summary`; hidden under 900 px |
| Gutters | `flow.gutter` wide, `flow.gutter-compact` under 600 px |
| Brand mark | `flow.brand` wide; drawn as outlines so it never waits for a font |
| Progress pip | `flow.pip` by `space.4` |

Under 600 px the header prompt is hidden (the link stays), the footer stacks, and the question starts at the top instead of the middle.

## States

| State | Treatment |
|---|---|
| Default | Canvas `color.daylight.canvas`, text `color.daylight.ink` |
| Footer link, hover | `color.daylight.ink`, underlined |
| Keyboard focus | `border.focus-strong` ring in `color.daylight.accent` |
| Receipt row, current | Value in `color.daylight.link` |
| Receipt row, upcoming | Value in `color.daylight.mute`, medium weight |
| Progress pip, done | `color.daylight.accent`; others `color.daylight.track` |
| Loading, error, selected, disabled | Not applicable to the frame; they belong to the step |

## Tokens

- Colour: `color.daylight.canvas`, `ink`, `soft`, `mute`, `surface`, `line`, `accent`, `link`, `track`, `mark-pale`, `mark-left`, `mark-right`, `wordmark`; `elevation.daylight` (receipt).
- Type: `font.text`; `type.flow-lede` (page), `type.flow-label` (prompt), `type.flow-note` (footer, progress), `type.flow-action` (receipt title), `type.flow-link` (receipt value).
- Space and shape: `flow.gutter`, `flow.gutter-compact`, `flow.column`, `flow.wrap`, `flow.summary`, `flow.brand`, `flow.pip`, `space.4` to `space.64`, `radius.xl`, `radius.full`, `target.touch`.
- Layering and motion: `z.toast` (skip link, demo label); receipt rows rise with `duration.rise` and `easing.standard`.

## Behaviour

- The brand link and every in-app link go through the router: the page does not reload and the flow is not lost.
- The page title names the current step.
- The browser's `theme-color` is the canvas token in force, so it follows the system theme and the in-page switch.
- The theme control switches between light and dark for the visit; it follows the system until used.
- The demo label is fixed at the bottom; the footer leaves room for it. It cannot be dismissed.
- Right-to-left: the layout mirrors. Reduced motion: receipt rows appear without movement.

## Accessibility

- Landmarks: `banner`, `main`, `contentinfo`, and `complementary` for the summary, which has a name.
- The brand mark is an image named with the product name; its link is named for where it leads.
- Progress is text; the pips are decorative.
- The receipt is a description list under a level-two heading.
- The demo label is a `note`.
- At 200% text the footer wraps and nothing scrolls sideways.

## Content

- The data-location line is said once, plainly: "Your data stays in Africa."
- Progress counts are two digits and are followed by the step's name or the time left.

| Good | Bad |
|---|---|
| "03 / 07 · About 90 sec" | "Step 3" |
| Receipt: "Address · Choosing now" | A summary that only appears on the last screen |
