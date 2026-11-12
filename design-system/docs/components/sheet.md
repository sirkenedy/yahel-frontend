# Sheet

Status: Specified

## Purpose

A sheet holds one self-contained task without leaving the current view: share, compose, create, pick, upgrade. Use a dialog for a yes-or-no decision, a popover for a few controls, and a full view when the task needs several levels of its own navigation.

## Anatomy

- **Scrim.** Required, except for a half-height sheet that leaves the view behind usable.
- **Container.**
- **Grabber.** Touch only, on any sheet that can be resized or swiped away.
- **Header.** Title (required), Cancel or close, and the confirming action on touch.
- **Body.** Scrolls inside the sheet.
- **Footer.** Pointer layouts only: Cancel and the confirming action.

## Variants and sizes

| Variant | Size class | Form |
|---|---|---|
| Half height | Compact | Rises from the bottom to about half the screen; can be dragged to full |
| Full height | Compact | Rises to just below the top safe area |
| Centred panel | Regular and wide | A panel in the middle of the window; height fits content up to the window minus `space.48` at top and bottom |

- Panel width: Token: `size.layer-md` (standard panel) and `size.layer-lg` (panels with two columns, such as plan comparison) — maximum widths for sheets as centred panels.
- Header controls: `target.touch` on touch; `target.pointer` on pointer.
- Choice lists that rise from the bottom in compact width (a long menu, a popover's content) use the half-height sheet. Keep such a list short enough not to scroll at default text size.

## States

| State | Treatment |
|---|---|
| Default | Open at its starting height |
| Dragging (touch) | Follows the finger; settles at half, full or closed |
| Keyboard focus | Ring on the focused control inside; the container never shows a ring |
| Loading | Body shows skeletons in the final layout; the header stays usable so Cancel always works |
| Submitting | The confirming button shows progress and cannot be pressed twice; Cancel stays enabled if the request can be stopped |
| Error | Message next to the field or item at fault; the sheet stays open with everything entered |
| Unsaved changes | Closing asks first with a dialog ("Discard draft?"), or keeps a draft |
| Disabled | A sheet is never disabled; individual controls are |

## Tokens

- Surface: `material.thick` with `blur.thick` and a `border.hairline` edge in `material.edge`; fallback `color.bg.elevated`. `elevation.3`, `z.sheet`, scrim `color.scrim`.
- Shape: `radius.2xl` on the top corners in compact, all corners for the centred panel.
- Text: title `type.headline`; body `type.body`; help `type.footnote` in `color.label.secondary`.
- Grabber: `color.label.quaternary`, `radius.full`, `space.4` high, centred `space.8` from the top.
- Space: `space.16` padding in compact, `space.24` in the panel; `space.12` between footer buttons.
- Motion: enter `duration.emphasized` with `easing.spring`; exit `duration.quick` with `easing.exit`.

## Behaviour

- One sheet at a time from the main view. A sheet may open one further layer (a picker or a confirming dialog) and no more. If a step inside leads to another sheet, the first closes.
- Buttons: on touch, Cancel at the leading edge of the header and the confirming action at the trailing edge. On pointer, both in the footer at the trailing corner, confirm last. One prominent button only. A "Done" button is always paired with Cancel or Back.
- Ways out: Cancel or close, Escape, pressing the scrim, and swiping down on touch. The last two apply only when nothing would be lost; otherwise they trigger the unsaved-changes check.
- Focus moves to the first field, or the title if there is none. Focus is trapped. Closing returns focus to the opener.
- The view behind does not scroll. A half-height sheet without a scrim leaves it interactive and is not modal.
- Rotating or resizing across size classes converts between sheet and panel without losing input or scroll position.
- Motion: rises from the bottom edge on touch; the panel fades and scales from the centre. Reduced motion: cross-fade, no overshoot.
- Right-to-left: header and footer order mirror.

## Accessibility

- `role="dialog"`, `aria-modal="true"` when a scrim is present; named by the title.
- The grabber is a button named "Resize" with expanded and collapsed states; height can also be changed from the keyboard.
- Reduced transparency: `color.bg.elevated` with the same edge.
- Increased contrast: edge becomes `color.separator.opaque`.
- At 200% text the header wraps the title to two lines before truncating; buttons never truncate their verb.

## Content

- The title names the task: "Share 'Brand refresh'", "New event".
- The confirming button names the result. "Continue" between steps, "Done" at the end.

| Good | Bad |
|---|---|
| "Send invite" | "Submit" |
| "Create event" | "OK" |
| "Cancel" | "Close without saving changes" |

Apple reference: Sheets, Action sheets, read 2026-11-11
