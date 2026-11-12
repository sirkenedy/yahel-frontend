# Website

The public website: the home page that lists every product, and pages such as About and Careers. Each product also gets its own page at its own address. Canvas: `canvas/project/website/`.

The website uses the same colour, shape, material and motion tokens as the apps. It adds a display type scale and rules for movement tied to scrolling.

## Page anatomy

- A sticky top bar: the mark, Products (a menu of all nine with their addresses), a few section links, Sign in, and one filled button, "Create account".
- A hero that says what Yahel is in one sentence, with one main action. A second action is a plain link.
- Sections answer a visitor's questions in order: what is in it, who it is for (yourself or your organisation), whether it is safe, what it costs.
- One main action per page, repeated. Never two filled buttons side by side.
- Facts that are not decided yet are written as marked placeholders, never invented.

## Display type

| Style | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| Display XL | 88 / 1.02, fluid from 40 | 700 | -0.035em | Page hero |
| Display L | 56 / 1.06, fluid from 32 | 700 | -0.03em | Section heading |
| Title | 34 / 1.12 | 700 | -0.02em | Card and panel heading |
| Lead | 19 to 21 / 1.5 | 400 | 0 | Paragraph under a heading, secondary text colour |
| Eyebrow | 13 | 600 | 0.06em, uppercase | Section label, accent colour |

Body text stays at 17.

## Layout

- Content width 1200 at most, with a 24 side gutter at every width.
- 112 between sections. Cards and bands use radius 28 to 32.
- The main button is a pill, 52 tall. Every target is at least 44.
- Grids collapse on their own (`auto-fit`), down to one column on a phone. The top bar's links fold away under 860.

## Motion

Durations and curves are the existing tokens (`duration.*`, `easing.*`).

| Movement | Starts when | What changes | Timing |
|---|---|---|---|
| Reveal | 12% of the element is in view | Fades in and rises 28. Siblings follow 70 ms apart | 420 fade, 620 move, standard |
| Icon pop | The hero loads | App icons scale from 0.86 with a small overshoot, in order | 620, spring |
| Hero window | The first 520 of scroll | Tilts from 6 degrees to flat, grows 0.94 to 1, drifts up slowly | Follows the scroll position |
| Top bar | Scrolled past 8 | Gains glass and a hairline; height 68 to 56 | 280, standard |
| Product switch | A product tab is pressed | Old panel fades out; new one fades in and rises 16 | Out 280 exit, in 420 to 620 |
| Press and hover | Pointer or touch | Buttons press to 0.97; cards and icons lift 4 on hover | 180 standard, 280 spring |

Limits:

- Each element moves once, on the way in. Nothing replays when scrolling back.
- Content is visible without scripts; motion is added on top.
- With reduced motion, everything becomes a 180 ms fade: no tilt, drift or scale.
- Nothing loops, and nothing moves beside text being read.
- Only opacity and transform are animated.
