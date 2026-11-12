# Website

The public website: the home page that lists every product, and pages such as About and Careers. Each product also gets its own page at its own address. Canvas: `canvas/project/website/`.

The website uses the same colour, shape and material tokens as the apps. It adds a display type scale, a few sizes and durations of its own (all tokens, listed below), and rules for movement tied to scrolling.

## Page anatomy

- A sticky top bar: the mark, Products (a menu of all nine with their addresses), a few section links, Sign in, and one filled button, "Create account". Under 860 the links and Sign in fold away and a "Menu" button takes their place; the mark and "Create account" stay.
- The phone menu is a sheet (`components/sheet.md`) that rises from the bottom and lists the same links, then Sign in. It is a modal dialog titled "Menu" with a "Close" button: focus moves in and is held, and Escape, Close, a press on the scrim, choosing a link, going Back, or widening the window past 860 all dismiss it. Focus returns to the Menu button. If the sheet cannot be fetched, a message beside the button says so and the next press tries again; the page stays as it was.
- A hero that says what Yahel is in one sentence, with one main action. A second action is a plain link.
- Sections answer a visitor's questions in order: what is in it, who it is for (yourself or your organisation), whether it is safe, what it costs.
- One main action per page, repeated. Never two filled buttons side by side.
- Facts that are not decided yet are written as marked placeholders, never invented.

## Display type

Tokens: `display.*` in `tokens/scale.json` (`--ws-display-<style>-size|line|weight|tracking`). Unlike the app type roles, these do not shrink on pointer devices.

| Style | Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Display XL | `display.xl` | 88 / 1.02, fluid from 40 | 700 | -0.035em | Page hero |
| Display L | `display.l` | 56 / 1.06, fluid from 32 | 700 | -0.03em | Section heading |
| Title | `display.title` | 34 / 1.12 | 700 | -0.02em | Card and panel heading |
| Heading | `display.heading` | 20 / 1.25 | 600 | -0.012em | Item heading inside a section |
| Lead | `display.lead` | 19 to 21 / 1.5 | 400 | 0 | Paragraph under a heading, secondary text colour |
| Body | `display.body` | 17 / 1.5 | 400 | 0 | Body text, at every width and on every device |
| Label | `display.label` | 15 / 1.34 | 500 | 0 | Bar links and buttons |
| Eyebrow | `display.eyebrow` | 13 / 1.4 | 600 | 0.06em, uppercase | Section label, accent colour |

Footer text uses the app role `type.footnote`.

## Layout

- Content width 1200 at most (`size.site-content`), with a 24 side gutter (`margin.regular`) at every width.
- 112 between sections (`space.112`; `space.72` and `space.88` inside heroes and bands). Cards use `radius.2xl` (28), bands `radius.3xl` (32).
- The main button is a pill, 52 tall (`size.site-cta`). Every target is at least 44.
- The top bar's layout height is 68 (`size.site-bar`); it never changes, so nothing below it moves.
- Grids collapse on their own (`auto-fit`), down to one column on a phone. The top bar's links fold away at 860 and below (`breakpoint.site-nav`), replaced by the Menu button.
- Focus and in-page link targets stop below the sticky bar (scroll padding of the bar's height plus `space.8`).
- On an inverse band the focus ring is `color.label.on-inverse`; the accent ring does not reach 3:1 there.
- With increased contrast every link in the bar, menu and footer is underlined, and the bar is solid at every scroll position.

## Motion

Durations and curves are tokens. Most are the existing ones (`duration.quick` 180, `duration.standard` 280, `duration.emphasized` 420, `easing.*`); the website adds `duration.reveal-move` (620), `duration.stagger` (70) and `size.reveal-rise` (28).

| Movement | Starts when | What changes | Timing |
|---|---|---|---|
| Reveal | 12% of the element is in view | Fades in and rises 28 (`size.reveal-rise`). Siblings follow 70 ms apart (`duration.stagger`) | 420 fade (`duration.emphasized`), 620 move (`duration.reveal-move`), standard |
| Icon pop | The hero loads | App icons scale from 0.86 with a small overshoot, in order | 620, spring |
| Hero window | The first 520 of scroll | Tilts from 6 degrees to flat, grows 0.94 to 1, drifts up slowly | Follows the scroll position |
| Top bar | Scrolled past 8 | Gains glass and a hairline. The glass draws up from 68 to 56 (`size.site-bar-compact`) and the bar's content rises 6 to stay centred in it, both by transform; the bar's layout height stays 68 | 280, standard |
| Page change | A link to another page of the site is followed | The old page fades out over the new one; the new page then arrives by its own reveal. The top bar holds still. Uses the browser's view transitions; where there are none, the new page simply appears | 180 (`duration.quick`), exit |
| Phone menu | Menu is pressed, under 860 | The sheet rises from the bottom edge; the scrim fades in. It leaves the way it came | In 420 spring; out 180 exit |
| Product switch | A product tab is pressed | Old panel fades out; new one fades in and rises 16 | Out 280 exit, in 420 to 620 |
| Press and hover | Pointer or touch | Buttons press to 0.97; cards and icons lift 4 on hover | 180 standard, 280 spring |

Limits:

- Each element moves once, on the way in. Nothing replays when scrolling back.
- Content is visible without scripts; motion is added on top.
- With reduced motion, everything becomes a 180 ms fade: no tilt, drift or scale. The top bar does not compact and its glass appears at once; the page change keeps its fade; the phone menu fades instead of rising.
- Printed, everything is shown whether or not it was scrolled to.
- Nothing loops, and nothing moves beside text being read.
- Only opacity and transform are animated.
