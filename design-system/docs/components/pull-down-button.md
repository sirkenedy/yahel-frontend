# Pull-down and pop-up button

Status: Specified

## Purpose
Buttons that open a menu. A **pull-down button** offers actions related to the button's purpose (New: document, sheet, folder; Sort). A **pop-up button** shows the current choice from a short, flat set of mutually exclusive options and lets the person change it (role: "Can view"). Use a segmented control for two to five always-visible options, a select with search for long lists, and plain buttons when there are only one or two actions.

## Anatomy
- **Button**: label or icon, with a trailing indicator. Pull-down: a single down chevron. Pop-up: a double chevron (up and down), and the label is the current value.
- **Menu**: see `menu.md`. A pop-up menu marks the current value with a check.
- **Introductory label** (pop-up, optional): text before the button that says what is being chosen.

## Variants and sizes

| Variant | Label | Menu contents |
|---|---|---|
| Pull-down | Fixed: names the action or group | Three or more actions; may include a submenu |
| More | Icon only (ellipsis) | Lower-priority actions for the current item |
| Split | A main action plus a separate chevron target | Variations of the main action |
| Pop-up | The current value | Mutually exclusive options; no actions, no submenus, no multiple selection |

Sizes and styles are those of `button.md`: `target.touch` on touch, `target.pointer` on pointer. Pop-up buttons use the grey or plain style; a filled pull-down is allowed only as the view's primary action. In a split button each half is a full target, separated by a hairline.

## States

| State | Appearance |
|---|---|
| Default, hover, pressed, keyboard focus, disabled | As `button.md` |
| Open | The button keeps its pressed appearance while its menu is open |
| Selected | Pop-up only: the button shows the chosen value; the menu shows a check beside it |
| Loading | Pop-up whose value is being saved: spinner in place of the indicator, the new value shown, cannot be opened again until done |
| Error | The value reverts and a message appears next to the button |
| Read-only | Pop-up the person may not change: plain text value without the indicator, and the reason nearby |

## Tokens
- Colour: `color.fill.secondary`, `color.fill.tertiary`, `color.fill.primary`, `color.label.primary`, `color.label.secondary` (indicator, introductory label), `color.accent.default`, `color.accent.solid`, `color.label.on-accent`, `color.separator.default` (split divider), `color.danger.text`.
- Type: `type.body` (button label, at its emphasised weight for pull-down; regular for a pop-up value), `type.subhead` (introductory label).
- Space and shape: `space.4` (label to indicator), `space.8`, `space.12`, `space.16`, `radius.md`, `radius.sm`, `icon.sm` (indicator), `icon.md`, `target.touch`, `target.pointer`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Motion and state: `duration.instant`, `duration.quick`, `easing.standard`, `opacity.pressed`, `opacity.disabled`. Menu tokens are listed in `menu.md`.
- Also used (sizes, selection, increased contrast): `color.separator.opaque`.

## Behaviour
- Press opens the menu from the button; choosing an item closes it. A pull-down then performs the action. A pop-up updates its label to the new value.
- On pointer, press, drag to an item and release also works.
- A pop-up always has a sensible default selected; it is never empty. The menu opens with the current value under the pointer or highlighted.
- A view's primary actions are not hidden in a pull-down. A More button holds only what does not earn a place in the toolbar.
- Destructive items sit last, in danger colours, and follow `feedback-and-status.md`: Undo where the action can be reversed, confirmation only where it cannot.
- A change made with a pop-up applies at once and can be undone or changed back. Where the change has wide effect (a role on a shared folder), it follows `sharing-and-collaboration.md`.
- Keyboard: Enter, Space or Down opens. In a pop-up, Up and Down may change the value without opening on pointer platforms.
- The button width holds the longest option where space allows, so the layout does not jump when the value changes.
- Right to left: the indicator moves to the left; the menu aligns to the button's right edge.

## Accessibility
- Pull-down: a `button` that exposes that it opens a menu and whether it is open. Pop-up: a native `select` where styling allows, otherwise a button with a listbox; the accessible name combines the introductory label and the value: "Access, Can view".
- The indicator is decorative. A More button is named for its target: "More actions for Budget.xlsx".
- A value change is announced once.
- Increased contrast: as `button.md`; the split divider uses `color.separator.opaque`.

## Content
- Pull-down label names the action or group. Good: "New", "Sort", "Add". Bad: "Options", "Actions", "Menu".
- Pop-up options are parallel and short. Good: "Can view", "Can comment", "Can edit". Bad: "Viewer", "Can add comments to the file", "Edit".
- People must be able to predict the options without opening. Good: "Sort by: Last changed". Bad: a bare "Last changed" with no label.
- Offer "Custom…" as the last option when occasional values are needed, rather than a long list.

Apple reference: Pull-down buttons; Pop-up buttons, read 2026-11-11
