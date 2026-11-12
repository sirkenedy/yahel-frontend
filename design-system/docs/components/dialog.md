# Dialog

Status: Specified

## Purpose

A dialog stops the person for a decision that must be made now, usually before a loss that is permanent and unexpected. If the action can be reversed, do it and show a toast with Undo instead. If there is nothing to decide, use a banner or a toast. For a task with inputs, use a sheet. See `../patterns/modality.md`.

## Anatomy

- **Scrim.** Dims the view behind. Required.
- **Container.** Centred, solid surface.
- **Title.** The question. Required.
- **Body.** The consequence in one or two sentences. Optional; leave it out if it adds nothing.
- **Text field.** Optional, and only when input is needed to resolve the decision (for example typing a name to confirm).
- **Buttons.** One or two. Never three.

No close control in the corner: Cancel is the way out. No icon unless it identifies the item (a file tile, an avatar).

## Variants and sizes

| Variant | Use | Buttons |
|---|---|---|
| Confirm | A risky action that is not destructive ("Send to 240 people?") | Cancel, then the action as the primary button |
| Destructive confirm | Permanent, unexpected loss | Cancel (default), then the action in the danger style, never filled |
| Acknowledge | Critical information with no choice (session ended) | One button that names what happens next |

- Width: fluid inside `margin.compact` gutters in compact; a fixed maximum in regular and wide. Token: `size.layer-sm` — maximum width of dialogs, popovers and toasts.
- Buttons: `target.touch` high on touch, `target.pointer` on pointer. Side by side; stacked full width when a label would wrap or at 200% text.
- The dialog never scrolls at default text size. If the body needs scrolling, the content belongs in a sheet.

## States

The container has two states: open and closed. Buttons take every state from the Button spec.

| State | Treatment |
|---|---|
| Default | Cancel is the default button when the other is destructive; otherwise the primary action is |
| Hover, pressed, keyboard focus | As Button. Focus ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Disabled | The action button is disabled only while a required text field is empty |
| Loading | After the action is pressed and the server is slow: the button shows a spinner with a progress label, both buttons stop accepting input, the dialog stays open |
| Error | The dialog stays open; a message in `color.danger.text` with an icon appears under the body; the action can be tried again |

## Tokens

- Surface: `color.bg.elevated`, `radius.2xl`, `elevation.3`, `z.sheet`. Scrim: `color.scrim`.
- Text: title `type.headline` in `color.label.primary`; body `type.subhead` in `color.label.secondary`; error `type.footnote` in `color.danger.text`.
- Danger button: `color.danger.text` on `color.danger.soft`. Primary button: `color.label.on-accent` on `color.accent.solid`. Cancel: `color.label.primary` on `color.fill.secondary`.
- Space: `space.24` padding; `space.8` title to body; `space.24` body to buttons; `space.8` between buttons (`space.12` when stacked).
- Motion: enter `duration.standard` with `easing.standard`; exit `duration.quick` with `easing.exit`.

## Behaviour

- One at a time. A dialog never opens over another dialog. It may open over a sheet, and nothing opens over it.
- Opening moves focus to the default button (or the text field, if there is one). Focus is trapped. Closing returns focus to the control that opened it.
- Escape activates Cancel. Enter activates the default button. A destructive button is never activated by Enter unless it has focus.
- Pressing the scrim does nothing. A decision this important is not dismissed by a stray press.
- The background does not scroll.
- Button order: Cancel at the leading side, the action at the trailing side. Stacked: the action on top, Cancel at the bottom. Mirrors in right-to-left.
- Never shown at app start, and never for something the person just chose that can be undone.
- Motion: fades in and scales up slightly from the centre. Reduced motion: cross-fade only.

## Accessibility

- `role="alertdialog"` for destructive confirm and acknowledge, `role="dialog"` for confirm; `aria-modal="true"`; named by the title, described by the body.
- Content behind is inert and hidden from assistive technology.
- Increased contrast: the container gains a `border.hairline` edge in `color.separator.opaque`; the danger button gains a `border.control` outline in `color.danger.text`.
- Reduced transparency: no change; the surface is already solid.
- At 200% text the buttons stack and the container grows; nothing truncates.

## Content

- The title is a question that names the thing: "Delete 'Brand refresh' forever?" The body states the consequence, with people named: "People in Northwind Studio will lose access. This can't be undone."
- The action button repeats the verb from the title. The safe button is always "Cancel".

| Good | Bad |
|---|---|
| "Delete forever" / "Cancel" | "OK" / "Cancel" |
| "Remove Lena from 'Q3 plan'?" | "Are you sure?" |
| "Discard draft?" then "Discard" | "Warning!" then "Yes" |
| "Sign in again" (acknowledge) | "Dismiss" |

Apple reference: Alerts, Action sheets, read 2026-11-11
