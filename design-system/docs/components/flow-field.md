# Flow field and code input

Status: Specified

Built in `@yahel/ui` as `FlowTextField`, `FlowPasswordField`, `CodeInput` and `UsernameHint`. Styles: `daylight.css`. See also `text-field.md`, whose rules apply unless changed here.

## Purpose

The flow field is the large text field of the account flows, one per step. The password variant can show and hide its value. The code input takes a one-time code. The username hint tells a password manager which account a password is for on steps that show no email field.

## Anatomy

- **Label.** Always visible, above.
- **Field.** `flow.field` high; the value; for passwords a "Show" or "Hide" text control inside the trailing edge.
- **Error.** Under the field, icon and words.
- **Help.** Under the field; stays visible with an error.
- **Code input.** A label, then one box per character; under them a single real input covers the row.

## Variants and sizes

| Variant | Notes |
|---|---|
| Text | Any single-line value |
| Password | Show and hide control; hidden again on submit by the step |
| Code, digits | Six boxes; numeric keyboard |
| Code, letters and numbers | Six boxes; keeps the case typed |
| Username hint | Never visible |

Field `flow.field` high, radius `radius.field`. Code box `flow.code-box` high, up to `flow.code-box-max` wide; the row is up to `flow.code-row`. A code longer than the boxes (a backup code) uses the text field instead.

## States

| State | Treatment |
|---|---|
| Default | Outline `border.hairline` in `color.daylight.control-line` on `color.daylight.field` |
| Keyboard focus and editing | Outline `color.daylight.accent` doubled inward, and a `border.ring` halo in `color.daylight.ring` |
| Code, current box | The same focus treatment on the box the next character will fill, while the input has focus |
| Error | Outline `color.daylight.danger`; message with icon |
| Disabled | `opacity.disabled` |
| Hover, pressed, selected, loading | None |

### Checking and marks

| State | Treatment |
|---|---|
| Typing for the first time | Never an error |
| Left after typing, or submitted | Checked once; a problem shows |
| Being fixed | Checked on every key; the problem goes the moment the value is right |
| Valid | A ticked circle in `color.daylight.success` inside the field, only on fields with a format to get right (email, phone, password, address), never on names |
| Invalid | Border and a second inner hairline in `color.daylight.danger`, an alert icon inside the field, the label in the danger colour, and the message with the same icon beneath |
| Invalid, focused | The danger border stays; the ring is `color.daylight.danger-tint` |
| Disabled | Dashed border on `color.daylight.canvas`, value in `color.daylight.mute` |
| Refused by the server | The same as invalid, with the server's refusal in the flow's own words; focus moves to the field, and the message goes when the value is edited |
| With a better path | One link under the message ("Get a Yahel address instead") |

## Tokens

- Colour: `color.daylight.field`, `control-line`, `ink`, `mute` (help), `danger`, `accent`, `ring`, `link` (show control).
- Type: `type.flow-label` (label, show control), `type.flow-input` (value), `type.flow-note` (help, error), `type.flow-digit` in `font.display` with tabular numbers (code).
- Space and shape: `flow.field`, `flow.code-box`, `flow.code-box-max`, `flow.code-row`, `radius.field`, `border.hairline`, `border.ring`, `space.8`, `space.16`, `target.touch`.
- Motion: outline and halo change over `duration.field`.

## Behaviour

- The field outline meets 3:1 against the canvas and the field in all four themes. This is stronger than the drawing, which used 22% ink (about 1.6:1).
- A problem is found on submit, shown beside the field with focus moved to the field, and cleared on the next edit.
- Code: pasting fills every box and ignores spaces and anything past the last box; Backspace steps back one box; the browser may offer the code from a message (`one-time-code`).
- Paste is never blocked. Spell checking is off for addresses, codes and passwords.
- The show control never submits the form.
- Right-to-left: labels mirror; codes stay left to right.

## Accessibility

- Label, help and error are tied to the input; an invalid field sets `aria-invalid`.
- The code is one labelled text field to assistive technology, not six.
- The show control is a toggle button with a pressed state; its name contains its visible text.
- The username hint is a text input with `autocomplete="username"`, out of the tab order and hidden from assistive technology.
- At 200% text the field grows in height.

## Content

- Labels are nouns: "Email", "Password", "6-digit code".
- Errors say what to do: "Enter all 6 digits."

| Good | Bad |
|---|---|
| "At least 12 characters, with upper and lower case letters, a number and a symbol." | "Password must meet complexity requirements" |
| "That doesn't look like an email address." | "Invalid" |
