# Account chip, account list and choices

Status: Specified

Built in `@yahel/ui` as `AccountChip`, `AccountList` (with `Account` and `Action`) and `ChoiceGroup` with `Choice`. Styles: `daylight.css`. See also `avatar.md`, `radio.md` and `account-switcher.md`.

## Purpose

The account chip shows which account a step is about. The account list is the chooser: the accounts known on this device, one row each, and a last row for anything else. Choices are a short list of large options where exactly one is picked, such as where to send a code.

## Anatomy

- **Chip.** A small avatar with the address's initial, then the address.
- **Account row.** Avatar, name, address, and a detail at the trailing end ("Personal", an organisation's name, "Signed out"). An optional control after the row ("Remove").
- **Action row.** An outlined plus and a label ("Use another account").
- **Choice.** An icon tile, a title, an optional second line, and a radio mark at the trailing end.

## Variants and sizes

| Variant | Notes |
|---|---|
| Person | Circular avatar with the name's initials, `flow.avatar` |
| Organisation | Rounded-square avatar with the domain's initial: shape, not colour alone |
| Chip | `target.touch` high, pill, avatar `flow.avatar-sm` |
| Choice | At least `flow.choice` high, `radius.xl` |

## States

| State | Treatment |
|---|---|
| Row, default | On `color.daylight.surface`, rows separated by `color.daylight.line` |
| Row, hover | `color.daylight.selected` |
| Row, keyboard focus | Ring inside the row |
| Row, disabled (remove mode) | Not pressable; the Remove control beside it is |
| Choice, default | Hairline in `color.daylight.line`; mark outlined in `color.daylight.control-line` |
| Choice, hover | Hairline in `color.daylight.accent` |
| Choice, selected | `color.daylight.selected` background, `border.focus` outline in `color.daylight.accent`, filled mark |
| Choice, keyboard focus | `border.focus-strong` ring around the card |
| Choice, disabled | `opacity.disabled` |
| Loading, error | Not applicable; shown by the step |

## Tokens

- Colour: `color.daylight.surface`, `line`, `line-strong`, `control-line`, `selected`, `tint`, `accent`, `on-accent`, `soft`, `canvas`, `ink`, `mute`.
- Type: `type.flow-lede` at semibold (name, choice title), `type.flow-label` (address, second line), `type.flow-note` (detail), `type.flow-link` (chip, action row).
- Space and shape: `flow.avatar`, `flow.avatar-sm`, `flow.choice`, `size.indicator`, `radius.xl`, `radius.md`, `radius.full`, `space.2` to `space.16`, `target.touch`.
- Motion: `duration.field`.

## Behaviour

- Pressing an account row continues as that account.
- In remove mode rows cannot be picked by mistake. After a removal, focus moves to the Remove control of the row that took its place, or to "Use another account" when none is left.
- Long addresses are cut with an ellipsis; the name wraps.
- Choices: arrow keys move the selection; the whole card is the hit target.
- Right-to-left: rows mirror; addresses stay left to right.

## Accessibility

- The list is a named list. A row's accessible name is its visible text with a hidden prefix ("Continue as"), so what is read contains what is seen.
- Avatars are decorative; the name and address carry the meaning.
- Choices are native radios in a named radio group.
- Addresses are marked not to be translated.

## Content

- The detail says what kind of account it is in a word or two.
- Destinations are masked: enough to recognise, not enough to learn.

| Good | Bad |
|---|---|
| "Text +234 ••• ••• ••42" | The full phone number |
| "Northwind Studio" | "Org account #4821" |
