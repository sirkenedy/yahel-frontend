# Date and time pickers

Status: Specified

## Purpose

Date and time pickers set a day, a time, or a range, for events, reminders, scheduled send and expiry of shared links. People can always type or pick. Use a select for a fixed set of relative choices ("In 1 hour", "Tomorrow morning") and offer those first where they cover the common case.

## Anatomy

- **Label.** Required, above the field.
- **Field.** Shows the value in the locale's format and accepts typing. A calendar or clock icon button at the trailing end opens the picker.
- **Calendar.** Month title, previous and next controls, weekday header, day grid, "Today" shortcut.
- **Time list.** Scrollable list of times at a set interval.
- **Time zone.** Shown next to the time whenever people involved are in different zones, or the zone differs from the device.
- **Help or error text.** Under the field.

## Variants and sizes

| Variant | Use |
|---|---|
| Date | A single day |
| Time | A time of day; list in steps of 15 minutes by default, any minute by typing |
| Date and time | Two fields side by side on wide layouts, stacked on compact |
| Range | Start and end; the calendar shows the span |
| Inline calendar | Always visible, where the date is the main content (Calendar sidebar) |

- Field height: `target.touch` on touch, `target.pointer` on pointer.
- Day cells: `target.touch` square on touch; `target.pointer` square on pointer. Time rows the same heights.
- Regular and wide: the picker opens in a popover next to the field. Compact: in a half-height sheet with Cancel and Done.

## States

| State | Treatment |
|---|---|
| Field default, hover, focus, disabled, error | As `text-field.md` |
| Day default | `color.label.primary` |
| Day hover (pointer) | `color.fill.tertiary` circle |
| Day pressed | `opacity.pressed` |
| Day keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Today | Ring of `border.control` in `color.accent.default`, and "Today" in its accessible name |
| Selected | Fill `color.accent.solid`, numeral `color.label.on-accent` at the emphasized weight |
| In range | Band of `color.accent.soft` between the two selected ends |
| Outside the month | `color.label.tertiary` |
| Unavailable | `opacity.disabled`, not selectable, reason in help text |
| Loading | Busy or free markers show as skeletons; days stay selectable |

## Tokens

- Surfaces: popover and sheet tokens from `popover.md` and `sheet.md`.
- Colour: `color.accent.solid`, `color.accent.soft`, `color.accent.default`, `color.label.primary`, `color.label.tertiary`, `color.label.on-accent`, `color.fill.tertiary`, `color.danger.text`.
- Shape: day cells `radius.full`; range band ends `radius.full`.
- Text: month title `type.headline`; weekday header `type.caption-1` in `color.label.secondary`; numerals `type.body` with tabular figures; time zone `type.footnote`.
- Space: `space.16` padding; `space.4` between cells; `space.12` between calendar and time list.
- Motion: month change `duration.standard` with `easing.standard`; selection `duration.instant`.

## Behaviour

- Typing accepts the locale's formats and common shortcuts ("tomorrow", "9", "9:30"). The value is parsed when the field is left; an unreadable value keeps the text and shows an error.
- First day of week, 12- or 24-hour clock, numerals and date order come from the locale.
- Calendar keyboard: arrows move by day, Page Up and Page Down by month, Home and End to the ends of the week, Enter selects, Escape closes without change.
- Choosing a date in the popover applies and closes. In the sheet, Done applies.
- Range: the first press sets the start, the second sets the end; choosing an earlier day restarts. An end before the start is corrected by moving the end, with the change visible.
- Times are stored with their zone. Changing the zone states what the time becomes for the person.
- Right-to-left: the grid, the previous and next controls and the range direction mirror. Numerals follow the locale. Clock time is not mirrored.
- Reduced motion: months cross-fade.

## Accessibility

- The field is a labelled text input; the icon button is named "Choose date" or "Choose time".
- The calendar is `role="grid"` with the month as its name; each day's name is the full date ("Thursday 12 November 2026"), plus "today", "selected" or "unavailable".
- The month title is a live region, announced when the month changes.
- Today and selected differ by shape (ring versus fill), not colour alone.
- Increased contrast: today's ring and the range band gain a stronger outline in `color.label.primary`.
- At 200% text the calendar scrolls inside its layer; cells do not shrink below the target size.

## Content

| Good | Bad |
|---|---|
| "Starts", "Ends" | "Start date/time:" |
| "10:00 (Lagos, GMT+1)" | "10:00" for a meeting across time zones |
| "That date has passed. Choose today or later." | "Invalid date" |
| "Today" | "Reset" |

Apple reference: Pickers, read 2026-11-11
