# Flow parts for creating an account

Status: Specified

Built in `@yahel/ui` as `AccountAvatar` (see `flow-shell.md`), `FlowSelect`, `FlowCheckbox`, `FlowSuggestions`, `FlowCallout`, `FlowFacts`, `FlowLinkCard`, `BrandMoment`, and as additions to `FlowTextField` (`suffix`, `success`, `isSensitive`), `FlowStep` (`Row`, `Note`, `NoteLink`, `Links align`), `FlowButton` (`chip`), `Receipt` (`label`, row `action`) and `FlowShell` (`isPrivate`). Styles: `daylight.css`. Design source: `canvas/project/accounts/screens/personal/`. The rules of `flow-field.md`, `flow-step.md`, `flow-actions.md`, `flow-feedback.md` and `flow-shell.md` apply unless changed here.

## Purpose

Creating an account asks for more than signing in does: a date, a choice from a long list, an address to be checked, a review of every answer. These parts cover that without adding a second look. Use them only in account flows.

## Anatomy

- **Row.** Fields that belong on one line: a pair, a date (day, month, year in the order the locale writes them) or a short field beside a long one. A date row is one named group.
- **Select.** Label above; a field-sized control showing the chosen option and a chevron. It is the platform's select.
- **Field suffix and good news.** Fixed text inside the field after the value ("@yahel.com"); under the field a tick and a line of good news ("Available.").
- **Suggestions.** A short label ("Also free") and a row of chips, each of which fills the field.
- **Checkbox.** A box and its label on one line; the whole line is the target.
- **Callout.** A card with an icon tile, one fact in bold and a line under it.
- **Facts.** A card listing ticked lines, each led by a few bold words.
- **Link card.** A card that is a link: icon tile, title, a line under it and an arrow.
- **Receipt with actions.** The account as answered, one line per answer; at the end of each line a way to change it. Named by a heading, or by a label when no heading is drawn.
- **Note.** Small print under the fields. A link inside it (`NoteLink`) opens in a new tab and says so to assistive technology, so reading the terms does not lose what has been answered. A note straight after checkboxes lines up with their labels.
- **Finishing mark.** The brand's emblem in rings of light, above the last heading.
- **Private details.** A control in the header that blurs fields marked as personal.

## Variants and sizes

| Part | Size |
|---|---|
| Row, pair | Two equal columns; one column under 600 px |
| Row, date | Month twice the width of day and year, in any order |
| Row, phone | Two to three |
| Select | `flow.field` high, radius `radius.field` |
| Chip | `target.touch` high, `radius.full` |
| Checkbox box | `size.indicator-pointer` square, `radius.xs`; the line is `target.touch` high on touch and `target.pointer` with a mouse |
| Receipt line | At least `flow.choice` high; label column `space.40` twice |
| Finishing mark | `flow.success-mark` plus `space.8`, with rings `space.12` and `space.24` out |

## States

| State | Treatment |
|---|---|
| Select, focus and error | As the flow field |
| Field with good news | Tick and words in `color.daylight.success`; an error replaces it |
| Chip, hover | Outline `color.daylight.accent` |
| Checkbox, checked | Box filled `color.daylight.accent` with a tick in `color.daylight.on-accent` |
| Checkbox, keyboard focus | `border.focus-strong` ring around the line |
| Link card, hover | Outline `color.daylight.accent` |
| Private details on | Fields marked personal are blurred by `blur.thin` unless focused; the header control shows as pressed |
| Loading, disabled | Not used by these parts; the step's button carries progress |

## Tokens

- Colour: `color.daylight.surface`, `field`, `control-line`, `line`, `line-strong`, `ink`, `soft`, `mute`, `accent`, `on-accent`, `link`, `success`, `tint`, `ring`.
- Type: `type.flow-label` (checkbox, callout and fact lines), `type.flow-note` (suggestions, good news, notes), `type.flow-link` (receipt value).
- Space and shape: `space.2` to `space.40`, `radius.xs`, `radius.xl`, `radius.full`, `radius.field`, `border.hairline`, `border.control`, `border.focus`, `icon.sm`, `size.indicator-pointer`, `flow.choice`, `flow.success-mark`, `target.touch`, `blur.thin`.
- Motion: the finishing mark pops with `duration.rise` and `easing.pop`; off under reduced motion.

## Behaviour

- A select opens the platform's own list: type-ahead on a computer, the picker on a phone. The designs draw a custom list with a search box; the platform's is used because it works with every assistive technology and adds no weight.
- Good news is announced politely when it appears. A field that may come to have some keeps the announcing region ready.
- A chip fills the field; it does not submit the step.
- A checkbox is off unless the person turns it on.
- A receipt line's action takes the person to that question and back.
- Private details: the blur is a courtesy for screen shares, not protection. A focused field is always readable.
- Right-to-left: rows, cards and the receipt mirror; the link card's arrow flips.

## Accessibility

- A date row is a group with a name ("Date of birth"); each part has its own label and the browser's `bday-day`, `bday-month` and `bday-year` hints.
- The select is a native control; its error is tied to it and it sets `aria-invalid`.
- Suggestions are a named group of buttons.
- The checkbox is a native checkbox whose input covers its line, so the target is at least `target.touch` high.
- A receipt without a heading has an accessible name. A value hidden behind dots is announced as "Hidden", not as a row of dots.
- The private-details control is a button with a pressed state, named for what it will do.
- The finishing mark is decoration.

## Content

- Suggestion labels are two words at most: "Also free".
- Callout titles state a fact: "Your password still works".
- Facts lead with who or what: "They can see", "They can't see", "We'll ask first".

| Good | Bad |
|---|---|
| "Available. It's yours if you want it." | "Username OK" |
| "That address is taken. Try one of these." | "amara@yahel.com belongs to another user" |
