# Chart

Status: Specified

## Purpose

Shows data as bars, lines, a donut or a meter. Rules for choosing a form and assigning colour are in `../foundations/data-visualisation.md`; this file specifies the component. If the message is one number, use a figure with a label, not a chart.

## Anatomy

1. Title, and an optional one-line subtitle with the period or unit.
2. Legend (required for two or more series).
3. Plot: marks, baseline, grid, axes with labels.
4. Direct labels (four series or fewer).
5. Tooltip, on hover and focus.
6. "View as table" control.

## Variants and sizes

| Variant | Use | Series limit |
|---|---|---|
| Bar (vertical, horizontal, stacked) | Compare amounts | 8, then "Other" |
| Line | Change over time | 8, then "Other" |
| Area | One series over time | 1 |
| Donut | Few parts of a whole | 5 |
| Scatter | Relationship of two measures | 3 |
| Meter | Progress to a limit; see `storage-meter.md` | 1 |
| Sparkline | Trend inside a row or tile; no axes, no legend | 1 |

Charts are fluid in width with a minimum plot height of 160. In compact width, legends move below the plot and long category labels switch the chart to horizontal bars.

## States

| State | Appearance |
|---|---|
| Loading | Skeleton of the plot area with title in place |
| Empty | Axes drawn, one line of text: what will appear and when |
| Error | Message in the plot area with "Try again" |
| Hover or focus on a mark | Mark at full strength, others at reduced strength; tooltip shown |
| Series hidden via legend | Legend item muted with a strike; colour assignments do not change |

## Tokens

- Series: `chart.categorical.1` to `chart.categorical.8`, in order. Sequential: `chart.sequential.1` to `.5`. Diverging: `chart.diverging.negative`, `.neutral`, `.positive`.
- Grid `chart.grid`; axes `chart.axis`.
- Text: title `type.headline`, labels and legend `type.caption-1`, values in tooltip `type.footnote` with emphasized weight. Colours `color.label.primary` and `color.label.secondary`.
- Surface `color.bg.elevated`; tooltip on `color.bg.elevated-2` at `elevation.2`, `radius.sm`, stacking `z.popover`.
- Gaps between segments use the surface colour at `space.2`. Bar end radius `space.4`.
- Dimming of unfocused marks `opacity.disabled`. Tooltip fade `duration.instant`.

## Behaviour

- Pointer: hover shows the tooltip; a line or area chart shows a vertical crosshair with every series at that position.
- Touch: tap a mark to show its tooltip; tap elsewhere to dismiss.
- Keyboard: Tab enters the plot; arrow keys move between marks; Escape leaves. The legend items are toggle buttons.
- Legend toggles hide a series without reassigning colours.
- Right to left: category order and legend mirror; a time axis still runs left to right, as does any numeric axis.
- Reduced motion: no entrance animation.

## Accessibility

- The chart has a text alternative stating the finding, or the measure, period and range.
- "View as table" shows the same data in a real table.
- Identity is never colour alone: legend plus direct labels; a texture option for print and forced colours.
- Marks and axis text meet 3:1 against the surface; all text meets 4.5:1.
- Tooltips are reachable by keyboard and announced.

## Content

| Do | Don't |
|---|---|
| "Storage use doubled since March" | "Storage chart" |
| "Messages sent per week" | "Data" |
| Axis label "GB used" | "Value" |
| Legend "Drive", "Mail", "Docs" | "Series 1", "Series 2" |

Apple reference: Charting data, read 2026-11-11. The Charts component page was not read.
