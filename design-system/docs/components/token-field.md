# Token and chip field

Status: Specified

## Purpose

A token field turns typed text into tokens: discrete items that can be selected, moved and removed as a unit. Mail recipients, search filters and labels on a file use it. A chip is the same shape used alone, outside a field, as a filter or a suggestion. For people, use the people picker, which adds identity on top of this spec. For read-only status, use a tag.

## Anatomy

- **Label.** Required.
- **Field.** Holds tokens and the text being typed; wraps to more lines as needed.
- **Token.** Optional leading icon or avatar, text, remove control.
- **Suggestion list.** Optional, under the field.
- **Overflow count.** "+3" when a field that is not focused is collapsed to one line.
- **Help or error text.**

## Variants and sizes

| Variant | Behaviour |
|---|---|
| Input token | Inside a field; removable |
| Filter chip | Stands alone; toggles on and off; shows a check when on |
| Suggestion chip | Stands alone; performs one action, then usually disappears |

- Token height: `target.pointer-min` on pointer. On touch the visible token is `target.pointer` high inside a row of `target.touch`; the remove control's hit area is `target.touch`.
- Standalone chips: `target.touch` high on touch, `target.pointer` on pointer.
- Field: minimum height as `text-field.md`.

## States

| State | Treatment |
|---|---|
| Token default | `color.fill.secondary` with `color.label.primary` text |
| Hover (pointer) | `color.fill.primary` |
| Pressed | `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Selected token | `color.accent.soft` with `color.accent.default` text and a `border.control` outline |
| Filter chip on | `color.accent.soft`, `color.accent.default` text, leading check |
| Error token | Outline `color.danger.solid`, icon, text unchanged; message under the field |
| Disabled | `opacity.disabled`; remove control hidden |
| Loading | A token being checked shows a small spinner in place of its icon |
| Field states | As `text-field.md` |

## Tokens

- Colour: `color.fill.secondary`, `color.fill.primary`, `color.accent.soft`, `color.accent.default`, `color.danger.solid`, `color.danger.text`, `color.label.primary`, `color.label.secondary`.
- Shape: tokens and chips `radius.full`; outline `border.control`.
- Text: `type.subhead` on touch, `type.footnote` on pointer. Icons `icon.sm`.
- Space: `space.8` horizontal padding; `space.4` between icon and text; `space.4` between tokens; `space.8` between standalone chips.
- Suggestion list: `material.thick` with `blur.thick`, `radius.lg`, `elevation.2`, `z.popover`; fallback `color.bg.elevated`.
- Motion: token appears over `duration.quick` with `easing.standard`; removal `duration.quick` with `easing.exit`.

## Behaviour

- Text becomes a token on comma, Enter, Tab, choosing a suggestion, or leaving the field. Pasted text is split into several tokens.
- Suggestions appear after a brief pause in typing, not on every keystroke.
- Backspace in empty text selects the last token; a second press removes it. Left and Right move through tokens; Delete removes the selected one. Removal can be undone with the standard shortcut.
- Double-click or Enter on a token turns it back into editable text.
- Tokens can be dragged to reorder or into another token field; Cut and Paste do the same from the keyboard.
- A context menu on a token offers copy, edit and remove, plus anything specific to the item.
- Filter chips apply at once; the result count updates and is announced.
- A long token truncates in the middle of its text with the full value in a tooltip; it never grows wider than the field.
- Right-to-left: tokens flow from the inline start; the remove control moves to the other side.
- Reduced motion: tokens appear and leave without movement.

## Accessibility

- The field is a labelled text input. Tokens are exposed as a list; each is focusable and named "Budget, label, press Delete to remove" in the platform's own phrasing.
- The remove control is a button named "Remove Budget".
- Filter chips are toggle buttons with `aria-pressed`; suggestion chips are buttons.
- Adding and removing is announced with the new count.
- Selected and on states have an outline or a check, not colour alone.
- Increased contrast: every token gains a `border.hairline` outline in `color.border.control`.

## Content

| Good | Bad |
|---|---|
| "Has attachment", "From Lena" | "attachment:true" |
| "Unread" (filter chip) | "Show unread only filter" |
| "Remove Budget" (accessible name) | "x" |
| "+3" | "..." |

Apple reference: Token fields, read 2026-11-11
