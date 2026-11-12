# Storage meter

Status: Specified

## Purpose

The storage meter shows how much storage an account has used, what is using it, and how close it is to the limit, long before the limit matters. It is the one place the four storage states are shown. The rules, and the thresholds for each state, are defined in `../patterns/plans-and-upgrades.md`. For progress of a task use a progress bar.

## Anatomy

- **Title.** "Storage", with the account context where both personal and organisation storage could be meant.
- **Bar.** A track with one segment per app, in that app's hue.
- **Summary.** Used and total, in words and numerals.
- **State label.** Present in every state except normal.
- **Legend.** Each app's name and amount, as text. Required wherever the bar is segmented.
- **Actions.** "Get more storage" (tinted), and "Free up space" beside it from almost full onward.

## Variants and sizes

| Variant | Where | Parts |
|---|---|---|
| Compact | Foot of the Drive and Mail sidebars | Bar, summary, state label. The whole meter links to the full one |
| Full | Account settings | Everything, including legend and actions |

- Bar height: `space.8`. Segments are separated by `space.2`.
- Compact meter target: at least `target.touch` on touch, `target.pointer` on pointer.
- Organisation members see their organisation's meter without an upgrade action; see Behaviour.

## States

| State | Bar | Label and treatment |
|---|---|---|
| Normal | App hues | No label. Meter only |
| Getting full | Whole fill in `color.warning.solid` | "Getting full" with an icon, in `color.warning.text` |
| Almost full | Whole fill in `color.warning.solid` | "Almost full" with an icon; "Free up space" appears beside "Get more storage" |
| Full | Whole fill in `color.danger.solid` | "Full" and what is paused, with an icon, in `color.danger.text` |

Banners that accompany the last three states are specified in `banner.md` and the pattern.

| Interaction state | Treatment |
|---|---|
| Hover, pressed (compact, pointer) | `color.fill.tertiary` behind the meter; `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Loading | Skeleton bar and one text line. Never an empty bar, which reads as "nothing used" |
| Error | "Unable to load storage" with "Try again"; no bar |
| Disabled, selected | Do not apply |

## Tokens

- Segments: `app.mail`, `app.drive`, `app.docs`, `app.sheets`, `app.slides`, `app.chat`, `app.meet`, `app.calendar`. Track: `color.bg.sunken`.
- State: `color.warning.solid`, `color.warning.text`, `color.danger.solid`, `color.danger.text`.
- Shape: `radius.full`.
- Text: title `type.headline`; summary `type.subhead`; state label `type.footnote` at the emphasized weight; legend `type.footnote` in `color.label.secondary`. Tabular figures. Icon `icon.sm`.
- Space: `space.8` title to bar; `space.8` bar to summary; `space.12` between legend items; `space.16` before actions.
- Motion: fill changes over `duration.standard` with `easing.standard`.

## Behaviour

- From getting full onward, the segments merge into one fill in the state colour. The breakdown stays in the legend, so no information is lost.
- A segment too small to see is still listed in the legend with its amount.
- The meter updates after uploads and deletions without a reload. It never shows more than the track; at full the fill ends at the end.
- "Get more storage" is never the primary action of the view. Reaching the limit never blocks reading, downloading, exporting or deleting.
- Organisation storage: members see the state and "Contact your administrator", by name where policy allows. Only administrators see billing actions. A personal upgrade is never offered for organisation storage.
- Right-to-left: the bar fills from the right and segment order mirrors.
- Reduced motion: fill changes without animation.

## Accessibility

- The bar is `role="meter"` with a text value that reads as the summary and state: "<used> of <total> used. Almost full."
- The legend is a list in text. Colour is never the only way to tell apps or states apart: every state has a word and an icon.
- A change of state is announced once, politely.
- Increased contrast: segments are separated by `color.bg.base` gaps and the track gains a `border.hairline` outline in `color.border.control`.
- At twice the default text size the legend wraps to one item per line.

## Content

Amounts come from the account; the examples use placeholders. Facts and a path, never fear.

| Good | Bad |
|---|---|
| "<used> of <total> used" | "You're running out of space!" |
| "Almost full" | "Critical" |
| "Full. Uploads and incoming mail are paused." | "Upgrade now to keep your files" |
| "Free up space" / "Get more storage" | "Buy storage" as the only action |
| "Contact Ade Okafor to get more storage" (organisation member) | "Upgrade" for storage the person cannot buy |

Apple reference: Gauges, read 2026-11-11
