# Colour

Values: `tokens/primitive.json`, `tokens/semantic.light.json`, `tokens/semantic.dark.json`, the increased-contrast overrides `tokens/semantic.light.hc.json` and `tokens/semantic.dark.hc.json`, and `tokens/apps.json`. CSS: `--ws-color-*`, `--ws-app-*`.

## Structure

1. **Primitives** (`palette.*`): a cool grey ramp and twelve hues (red, orange, yellow, green, mint, teal, cyan, blue, indigo, purple, pink, brown), each with a light-mode and a dark-mode value. Never referenced by product code.
2. **Semantic roles** (`color.*`): what product code uses. Every role has a light and a dark value; the build fails if one is missing.
3. **Increased contrast**: overrides for the roles that need to get stronger when the reader asks for more contrast (`prefers-contrast: more`, or `data-contrast="more"`). Four themes in total: light, dark, and increased contrast of each.
4. **App hues** (`app.*`): one identity colour per app, the same in both themes.

## Roles

| Group | Tokens | Use |
|---|---|---|
| Background | `bg.base`, `bg.grouped`, `bg.elevated`, `bg.elevated-2`, `bg.sunken` | `base` for content panes; `grouped` behind cards and inset lists; `elevated` for cards, menus, sheets; `elevated-2` for a layer on top of an elevated one (visible in dark); `sunken` for wells and tracks. |
| Label | `label.primary` to `label.quaternary`, `label.on-accent` | Primary for titles and body, secondary for supporting text, tertiary for captions and placeholders. Quaternary is for disabled and decorative marks only; it is not a text colour. |
| Separator | `separator.default`, `separator.opaque` | Hairlines. Use `opaque` where a translucent line would stack. |
| Fill | `fill.primary` to `fill.tertiary` | Translucent control backgrounds: search fields, grey buttons, segmented tracks. |
| Accent | `accent.default`, `accent.solid`, `accent.soft` | `default` for tinted text and icons; `solid` behind white text; `soft` for tinted buttons and selection. |
| Status | `success.*`, `warning.*`, `danger.*` each with `text`, `solid`, `soft` | `text` on a surface or on its own `soft`; `solid` for meters and icons. |
| Hue | `hue.*` | Labels, calendars, avatars, charts. Not for text on white unless the pair is added to `contrast-pairs.json` and passes. |

## Rules

- **Contrast is enforced.** Each pair in `tokens/contrast-pairs.json` must reach 4.5:1 (3:1 for control borders) in light and dark, and 7:1 (4.5:1 for borders) in the two increased-contrast themes, or the build fails. Add a pair whenever a new text-on-surface combination is introduced. This is stricter than Apple, which allows 3:1 for text of 18 pt and above.
- **A colour means one thing.** Red is danger, green is success, orange is warning, the accent is interactive. Do not reuse them for decoration or for a second meaning in the same view.
- **Emphasis by background.** The primary action is a filled button. Do not colour the labels of several controls, and keep to one or two filled buttons per view.
- **Chrome over colourful content is monochrome.** Bars floating over photos, video or coloured documents use label colours, not the accent.
- **Tertiary label is not used on `bg.sunken`** in light mode (it falls just short of 4.5:1).
- **Colour is never the only signal.** Status has an icon or a word, selection has a shape change, links in body text are underlined or sit apart.
- **Dark mode is not inverted light mode.** Base is near-black, raised surfaces step lighter, hues are brighter, and filled buttons use a deeper `accent.solid` so white text still passes.
- **App hues are a tested set.** The nine were chosen together so that every pair stays distinguishable, including under red-green colour blindness, and so a white glyph reaches 3:1 on each. Do not change one in isolation: run `node design-system/scripts/decision-tests.mjs` on the whole set. Mail is a lighter sky blue, deliberately apart from the accent.
- **Avatars** use only the `avatar.*` colours (blue, indigo, purple, pink, red, teal, brown, graphite), on which white initials reach 4.5:1. The build checks this. Orange, yellow, green, mint and cyan are not used behind white text.
- **Placeholders inside filled fields** (search) use `label.secondary`; tertiary does not reliably reach 4.5:1 on a fill.
- **Hover and pressed** on coloured controls are overlays: `color.state.hover` and `color.state.pressed`. The toast and other inverted surfaces use `color.bg.inverse` with `color.label.on-inverse`.
- **Toggles and unread badges use the accent**, not green or red, so that green always means success and red always means danger.
- **Chart colours** are a separate, validated palette. See `data-visualisation.md`.
- **App hue is identity, not theme.** It colours the app icon, file-type tiles and small markers. Interactive elements in every app use the shared accent.
- Orange, yellow and green solids are for fills and icons. White text on them does not pass AA; use the `text`/`soft` pair instead.
