# Radio

Status: Specified

## Purpose

A radio group picks exactly one option from a short set where seeing every option matters: a sharing role, a notification level. Use a segmented control for two to five short options that switch a view, a select when the list is long or space is short, and a checkbox or toggle for a single on-or-off choice.

## Anatomy

- **Group label.** Required.
- **Button.** Circle; filled centre when selected.
- **Label.** Required, at the trailing side.
- **Description.** Optional, under the label. Useful for roles ("Can view: read and download").
- **Error message.** Under the group.

## Variants and sizes

| Layout | Use |
|---|---|
| Vertical | Default. One option per line |
| Horizontal | Two or three short labels on wide layouts only, evenly spaced |
| List rows (touch) | Each option is a row; a check at the trailing end marks the selection |

- Target: the button plus its label, at least `target.touch` high on touch and `target.pointer-min` on pointer.
- Token: `size.indicator` (touch and pointer values) — shared with the checkbox box.
- Two to five options. More than that becomes a select.

## States

| State | Treatment |
|---|---|
| Unselected | `border.control` outline in `color.border.control`; background `color.bg.base` |
| Selected | Ring in `color.accent.solid` with a centre in `color.bg.base` |
| Hover (pointer) | Halo of `color.fill.tertiary` |
| Pressed | Button at `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Disabled | `opacity.disabled` on that option, with the reason in its description |
| Error | Message in `color.danger.text` with icon under the group; shown only when nothing is selected on submit |

No mixed and no loading state. If a set of items has different values, show that in the group label or use a select with "Mixed".

## Tokens

- Colour: `color.border.control`, `color.bg.base`, `color.accent.solid`, `color.fill.tertiary`, `color.danger.text`.
- Shape: `radius.full`; outline `border.control`.
- Text: group label `type.subhead` at the emphasized weight; option `type.body`; description `type.footnote` in `color.label.secondary`.
- Space: `space.12` button to label on touch, `space.8` on pointer; `space.12` between options; `space.24` between horizontal options.
- Motion: centre scales in over `duration.instant` with `easing.standard`.

## Behaviour

- One option is selected by default, the safest or most common. A group starts empty only when any default would be a guess about the person.
- Selecting one clears the others. A selection cannot be cleared back to nothing.
- The whole group is one tab stop. Arrow keys move and select; Space selects the focused option.
- The choice applies with the form's confirming button, or at once in settings that save automatically.
- Options keep a stable order; do not reorder by popularity.
- Right-to-left: buttons sit at the inline start; horizontal order mirrors.
- Reduced motion: the centre appears without scaling.

## Accessibility

- Native `input type="radio"` sharing a `name`, inside a `fieldset` with a `legend`. List-row layout uses `role="radiogroup"` and `role="radio"`.
- Selection is a shape change (filled centre or check), not colour alone.
- Increased contrast: stronger outline; selected ring in the increased-contrast accent.
- At 200% text, horizontal groups become vertical.

## Content

- Group label names the decision. Options are parallel in form.

| Good | Bad |
|---|---|
| "Can view" / "Can comment" / "Can edit" | "Viewer" / "Allow comments" / "Editing" |
| "Notify me about": "All messages", "Mentions only", "Nothing" | "Option 1", "Option 2" |
| "Mentions only" with "Direct messages still notify" underneath | A tooltip as the only explanation |

Apple reference: Toggles, read 2026-11-11
