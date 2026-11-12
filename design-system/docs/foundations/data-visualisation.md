# Data visualisation

Values: `tokens/chart.json`. CSS: `--ws-chart-categorical-1` to `-8`, `--ws-chart-sequential-1` to `-5`, `--ws-chart-diverging-negative|neutral|positive`, `--ws-chart-grid`, `--ws-chart-axis`.

Used in Sheets charts, Admin reports, storage breakdowns and any dashboard. Colour is chosen last; the form comes first.

## 1. Choose the form by the job

| The data's job | Use | Not |
|---|---|---|
| One headline number | A large figure with a label and a comparison | A chart |
| Compare amounts across categories | Bars, sorted | Pie with many slices |
| Change over time | Line; area only for a single series | Bars for long series |
| Part of a whole, few parts | One stacked bar, or a donut with at most 5 parts | 3D, exploded slices |
| Relationship between two measures | Scatter | Dual-axis chart |
| Progress to a limit | Meter | Gauge dial |

Never two y-axes. Two measures on different scales become two charts.

## 2. Assign colour by role

| Role | Rule | Tokens |
|---|---|---|
| Categorical (which series) | Use slots in fixed order: 1 blue, 2 amber, 3 purple, 4 green, 5 indigo, 6 orange, 7 cyan, 8 red. Never reorder, never skip, never generate a ninth; fold extras into "Other" | `chart.categorical.1-8` |
| Sequential (how much) | One hue, light to dark, five steps | `chart.sequential.1-5` |
| Diverging (above or below) | Two poles with a neutral grey midpoint | `chart.diverging.*` |
| Status | The system's success, warning and danger colours, always with an icon and label, never reused as "series 4" | `color.success|warning|danger.solid` |

- Colour follows the entity, not its rank. Filtering must not repaint the series that remain.
- The same entity has the same colour in every chart on a page.
- App-usage charts (storage by app) are the one exception to the slot order: they use the app hues from `tokens/apps.json`, with a text legend.

## 3. Validated limits

The palette was validated in light and dark for lightness, chroma, separation under red-green colour blindness, separation for normal vision, and contrast against the surface. Results are in `decisions.md`.

- **Bars, lines, stacked charts** (neighbours matter): all eight slots pass.
- **Scatter, bubble, maps, small multiples** (any two can touch): only slots 1, 2 and 8 (blue, amber, red) pass every pair. Cap at three series, or split into small multiples.
- Dark mode uses its own steps of the same hues. It is not an automatic inversion.
- Re-validate after any change to `tokens/chart.json`.

## 4. Marks

- Lines 2 px. Points at least 8 px, with a 2 px surface-colour ring where they overlap.
- Bars have a 4 px radius on the data end only and sit on the baseline. A 2 px surface-colour gap separates stacked segments and adjacent bars.
- Grid lines use `chart.grid` and are few. Axes use `chart.axis`. Both recede; data leads.
- Bar charts start at zero.

## 5. Text and labels

- All text uses label colours, never the series colour. A coloured mark beside the text carries identity.
- Two or more series always have a legend. Four or fewer are also labelled directly at the line end or on the bar.
- Do not print a value on every point. Label the latest, the highest, or the one the title is about.
- Titles state the finding where there is one ("Storage use doubled since March"), otherwise the measure and period.
- Numbers use tabular figures and the locale's formats.

## 6. Interaction

- Hovering or focusing a mark shows a tooltip with the exact value, series and period. Hit areas are larger than the mark.
- Line and area charts show a crosshair with all series values at that point.
- Every mark is reachable by keyboard. Filters sit in one row above the charts.

## 7. Accessibility

- Identity never depends on colour alone: legend, direct labels, and a texture option for print and forced-colour modes.
- Every chart has a table view of the same data and a text summary for screen readers.
- No motion beyond a single entrance; none under reduced motion.

## Do not

Pie charts with more than five slices, 3D, dual axes, rainbow scales, a hue at the midpoint of a diverging scale, truncated bar baselines, decorative gradients in fills.
