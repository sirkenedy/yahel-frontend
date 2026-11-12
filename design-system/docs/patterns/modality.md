# Modality

A modal layer interrupts. Use one only when the interruption helps.

## Which layer

| Layer | Use for | Elevation |
|---|---|---|
| Menu | A short list of actions on one thing | 2 |
| Popover | Small, non-blocking detail or a few controls; closes on outside click | 2 |
| Sheet | A self-contained task: share, compose, create, pick | 3 |
| Dialog | A decision that must be made now, usually confirming something risky | 3 |
| Full-screen | Deep or immersive tasks: editing, presenting, a call | 0, replaces the view |

In compact width, popovers and menus with many items become sheets rising from the bottom.

## Rules

- Prefer inline. If the task can happen in place (rename, quick reply, filter), do not open a layer.
- **One at a time.** Never stack a dialog on a dialog. A sheet may open one further layer (a picker or a confirmation) and no more.
- **A title that names the task.**
- **An obvious way out** in a consistent place: a Cancel or close control, Escape on keyboard, swipe down on touch when nothing would be lost.
- **Protect work.** If closing would lose input, ask first, or keep it as a draft.
- **Short.** A sheet holds one task. If it needs its own navigation with several levels, it should be a full view.
- **Focus** moves into the layer, is trapped while it is open, and returns to the control that opened it.
- A scrim (`color.scrim`) dims the view behind sheets and dialogs; the background does not scroll.

## Dialogs

- Only for critical, actionable decisions. Information that needs no decision is a banner or toast.
- Title is the question; body states the consequence in one or two sentences; two buttons at most.
- The button label repeats the verb: "Remove", "Delete forever", never "OK" or "Yes".
- The destructive button uses the danger style and is never the default; Cancel is the default and is activated by Escape.
- Prefer undo over a dialog whenever the action can be reversed.

## Buttons in sheets

Cancel at the leading edge of the header, the confirming action at the trailing edge, on touch. On pointer layouts both sit at the bottom trailing corner, confirm last. One prominent button only.
