# People picker

Status: Specified

## Purpose

The people picker chooses people, groups or addresses: mail recipients, event guests, people to share with, mentions. It is the same in every app. It builds on the token field (`token-field.md`) and adds identity: avatar, context and external status. Use a plain select for choosing from a handful of fixed roles.

## Anatomy

- **Label.** Required ("To", "Add people").
- **Field.** Holds person tokens and the text being typed.
- **Person token.** Avatar, name, optional external marker, remove control.
- **Suggestion list.** Rows with avatar, name, address, and context (personal, or the organisation's name).
- **External marker.** A word, "External", with an icon. Shown on tokens and rows for anyone outside the current organisation.
- **Notice.** A line under the field when the selection crosses a boundary.
- **Help or error text.**

## Variants and sizes

| Variant | Use |
|---|---|
| Multiple | Recipients, guests, sharing |
| Single | Owner, assignee; the token replaces the field's text |
| Inline mention | Opens at "@" inside text; the result is a mention, not a token |

- Field: minimum `target.touch` on touch, `target.pointer` on pointer; grows by wrapping.
- Suggestion rows: `target.touch` on touch; `target.pointer` on pointer.
- People are circles; organisations and groups are rounded squares, as in the Avatar spec.
- Compact: suggestions fill the width under the field; in sharing they sit in the sheet's body.

## States

| State | Treatment |
|---|---|
| Field default, hover, focus, disabled | As `text-field.md` |
| Suggestion hover, active (keyboard) | `color.fill.tertiary`; active row `color.fill.secondary` |
| Suggestion pressed | `opacity.pressed` |
| Token default, selected, focus | As `token-field.md` |
| External | Marker in `color.warning.text` on `color.warning.soft`, with the word |
| Unresolved address | Token outlined in `color.danger.solid` with an icon; message "Check this address" |
| Not allowed by policy | Row disabled with the reason: "Northwind Studio doesn't allow sharing outside the organisation" |
| Loading | Skeleton rows; typing continues; results never reorder under the pointer |
| No matches | "No one found. Enter a full email address." |

## Tokens

- Field and tokens: as `text-field.md` and `token-field.md`.
- List: `material.thick` with `blur.thick`, edge `material.edge`; fallback `color.bg.elevated`. `radius.lg`, `elevation.2`, `z.popover`.
- Colour: `color.fill.tertiary`, `color.fill.secondary`, `color.warning.text`, `color.warning.soft`, `color.danger.solid`, `color.danger.text`.
- Text: name `type.body`; address and context `type.footnote` in `color.label.secondary`; marker `type.caption-1` at the emphasized weight.
- Space: `space.12` row padding; `space.12` avatar to text; `space.4` between tokens.
- Motion: list `duration.quick` with `easing.standard`.

## Behaviour

- Search by name or address. Suggestions show recent and frequent people first, then the directory of the current context. People from another context are never suggested silently.
- Pasting several addresses makes one token each, split on commas, semicolons and line breaks.
- Enter, Tab or comma commits the active suggestion or a complete address. Backspace in an empty field selects the last token; again removes it.
- Arrows move through suggestions; Escape closes the list and keeps the text.
- Adding the first external person shows the notice at once, before anything is sent or shared: who is external and what they will be able to see.
- Mentions offer only people who can be given access, and offer to share when the person lacks it.
- A token's context menu has: copy address, view profile, remove.
- Right-to-left: tokens flow from the inline start; addresses stay left-to-right.
- Reduced motion: the list cross-fades; tokens appear without movement.

## Accessibility

- `role="combobox"` with a `role="listbox"`; each option's name is "Lena Moreau, lena@northwind.example, Northwind Studio, external" in that order.
- Tokens are a list; each is focusable, named with the person and status, and removable with Delete or Backspace.
- Adding and removing is announced: "Lena Moreau added. 3 people."
- External status is a word and an icon, never colour alone.
- Increased contrast: the external marker and error token gain a `border.control` outline in their text colour.

## Content

| Good | Bad |
|---|---|
| "Add people or groups" (placeholder example: "Name or email") | "Enter recipients here" |
| "Lena Moreau is outside Northwind Studio" | "Warning: external user detected" |
| "Check this address" | "Invalid" |
| "No one found. Enter a full email address." | "0 results" |

Apple reference: Token fields, read 2026-11-11
