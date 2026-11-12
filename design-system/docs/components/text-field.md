# Text field and text area

Status: Specified

## Purpose

A text field takes a short piece of typed input: a name, an address, a title. A text area takes several lines: a description, a message. Offer a picker, select or toggle instead whenever the answer can be chosen. Use the search field for search and the token field for lists of people or filters. See `../patterns/entering-data.md`.

## Anatomy

- **Label.** Required, always visible, above the field. "optional" follows the label when it applies.
- **Field.** Container with the typed value.
- **Placeholder.** Optional. An example only, never the label.
- **Leading icon, trailing control.** Optional: clear, show or hide password, a unit.
- **Help text.** Optional, under the field.
- **Error message.** Replaces help text; icon plus words.
- **Counter.** Optional, at the trailing end under the field, only when there is a limit.

## Variants and sizes

| Variant | Notes |
|---|---|
| Single line | Height `target.touch` on touch, `target.pointer` on pointer |
| Secure | Hides the value; has a show or hide control; paste and password managers always work |
| Text area | Starts at three lines, grows with content to a set maximum, then scrolls |
| In a list row | Label at the leading side, value at the trailing side; touch only |

Width suggests the expected length: a postcode field is short, an address field is full width. Fields stack in one column.

## States

| State | Treatment |
|---|---|
| Default | `border.control` outline in `color.border.control` |
| Hover (pointer) | Background `color.fill.tertiary` |
| Pressed | None; pressing places the cursor |
| Keyboard focus and editing | Focus ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Filled | Clear control appears while focused |
| Disabled | `opacity.disabled`; not focusable; a reason nearby |
| Read-only | No outline, background `color.bg.sunken`; focusable and selectable |
| Error | Outline `color.danger.solid`; message in `color.danger.text` with icon |
| Loading (checking) | Spinner at the trailing end; typing continues |
| Over the limit | Counter turns to `color.danger.text` and states the excess; input is not cut off |

## Tokens

- Surface: `color.bg.base`; on a grouped background `color.bg.elevated`. Shape: `radius.md` on touch, `radius.sm` on pointer.
- Text: label `type.subhead` at the emphasized weight in `color.label.primary`; value `type.body`; placeholder `color.label.tertiary`; help and counter `type.footnote` in `color.label.secondary`.
- Icons: `icon.md` in `color.label.secondary`.
- Space: `space.12` horizontal padding; `space.8` label to field; `space.4` field to help; `space.16` between fields; `space.8` icon to text.
- Motion: state changes `duration.instant`; error appears over `duration.quick` with `easing.standard`.

## Behaviour

- Validate when the person leaves the field, not on each keystroke. Clear the error as soon as it is fixed. Strict rules (passwords) are shown before typing and checked as the person types.
- Keep what was typed, always. Accept formats flexibly and tidy them afterwards.
- Set the input type, keyboard and autofill attributes for the content. Never block paste.
- Enter submits a single-field form; in a text area it adds a line. Tab moves on in reading order. Escape restores the previous value in inline editing.
- A truncated value shows in full in a tooltip and scrolls with the cursor.
- The clear control and password toggle are separate tab stops with their own names.
- Right-to-left: layout mirrors; fields for email, URL, code and numbers stay left-to-right.
- Reduced motion: the error appears without movement.

## Accessibility

- Native `input` or `textarea` with a `label`. Help and error are linked with `aria-describedby`; an invalid field sets `aria-invalid`.
- The error is announced when it appears. The counter announces only near and past the limit.
- Trailing controls keep the target minimum: `target.touch` on touch, `target.pointer-min` on pointer.
- Increased contrast: outline takes the stronger `color.border.control`; the error state adds an icon inside the field.
- At 200% text the label wraps; the field grows in height.

## Content

- Labels are nouns, sentence case, no colon. Placeholders are examples.
- Errors say what is wrong and how to fix it.

| Good | Bad |
|---|---|
| Label "Work email", placeholder "lena@northwind.example" | Placeholder "Enter your email" with no label |
| "That password is too short. Use at least 12 characters." | "Invalid input" |
| "Description (optional)" | "Description *" on every required field |
| "12 characters over the limit" | A field that silently stops accepting text |

Apple reference: Text fields, Text views, read 2026-11-11
