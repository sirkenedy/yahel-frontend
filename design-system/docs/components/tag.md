# Tag

Status: Specified

## Purpose

A tag is a short, read-only word that states a property of the item it sits on: "Draft", "External", "Shared", "Overdue". It is not interactive. If it can be pressed or removed, it is a chip (see `token-field.md`). For counts use a badge.

## Anatomy

- **Container.**
- **Icon.** Optional in neutral and accent; required in success, warning and danger, so the tone is not carried by colour alone.
- **Text.** Required. One or two words.
- **Hue dot.** Label variant only: a dot in the label's chosen hue before the name.

## Variants and sizes

| Tone | Use | Example |
|---|---|---|
| Neutral | A plain property | "Draft", "Archived" |
| Accent | Something current or chosen | "Current plan", "New" |
| Success | A confirmed good state | "Verified", "Accepted" |
| Warning | Needs care | "External", "Expires soon" |
| Danger | A problem | "Overdue", "Suspended" |
| Label | A person's own label or calendar name, with its hue dot | "Travel" |

- One size per size class; height follows the text plus `space.2` above and below.
- A tag never wraps. Text longer than the space available truncates at the end, with the full text in a tooltip.

## States

A tag has one visual state. It does not respond to hover, press or focus, and is not disabled, loading or selected.

| Situation | Treatment |
|---|---|
| On a selected row | Unchanged; the tag keeps its own background |
| On a disabled item | Takes `opacity.disabled` with the item |
| Truncated | Full text in a tooltip on the host item's hover and focus |

## Tokens

| Tone | Background | Text and icon |
|---|---|---|
| Neutral | `color.fill.secondary` | `color.label.primary` |
| Accent | `color.accent.soft` | `color.accent.default` |
| Success | `color.success.soft` | `color.success.text` |
| Warning | `color.warning.soft` | `color.warning.text` |
| Danger | `color.danger.soft` | `color.danger.text` |
| Label | `color.fill.secondary` | `color.label.primary`; dot in the chosen `color.hue.*` |

- Shape: `radius.xs`.
- Text: `type.caption-1` at the emphasized weight. Icon `icon.sm`.
- Space: `space.8` horizontal padding; `space.4` icon or dot to text; `space.4` between tags.
- Motion: none. A tag that appears because a state changed fades in over `duration.quick`.

## Behaviour

- A tone means the same thing everywhere. "External" is always warning; "Draft" is always neutral.
- At most two tags on one item in a list. More than that belongs in the item's details.
- Tags sit after the item's name or at the trailing end of its row, in the same place for the same property in every app.
- The solid status colours are not used as tag backgrounds; white text on orange, yellow or green does not pass.
- Label hues identify, they do not signal status. A red label is not a danger tag: it keeps the neutral container.
- Right-to-left: icon or dot at the inline start.
- Reduced motion: no fade.

## Accessibility

- Plain text inside the item, read as part of it: "Brand refresh, draft, edited today".
- Icons are decorative; the word carries the meaning.
- A tag that appears while the person is on the item is announced through the item's own live region, if it has one.
- Increased contrast: a `border.hairline` outline in the tag's text colour.
- At 200% text the tag grows; in a tight row it moves under the name before it truncates.

## Content

- An adjective or noun, sentence case, no full stop. The same word for the same property everywhere.

| Good | Bad |
|---|---|
| "External" | "EXTERNAL USER" |
| "Draft" | "Not yet sent" |
| "Expires soon" | "Warning" |
| "View only" | "RO" |

Apple reference: none (no equivalent)
