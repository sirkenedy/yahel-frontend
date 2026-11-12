# Button

Status: Specified

## Purpose
Starts an action at once. Use a link to go somewhere, a toggle or checkbox to set a state, a pull-down button to choose among related actions, and a floating action button for the one primary action in compact width.

## Anatomy
- **Container** (not visible in the plain style).
- **Label**, **icon**, or both. With both, the icon leads.
- **Spinner** (loading only), in place of the icon.

Icon-only buttons are allowed for familiar actions and always have an accessible name and a tooltip.

## Variants and sizes
A button has a **role** (meaning) and a **style** (emphasis).

| Role | Meaning | Allowed styles |
|---|---|---|
| Normal | No special meaning | Grey, tinted, plain |
| Primary | The most likely choice; responds to Enter | Filled |
| Cancel | Leaves without acting; responds to Escape | Grey, plain |
| Destructive | Removes or destroys data | Tinted or plain in danger colours; never filled, never primary |

| Style | Background | Label |
|---|---|---|
| Filled | `color.accent.solid` | `color.label.on-accent` |
| Tinted | `color.accent.soft` | `color.accent.default` |
| Grey | `color.fill.secondary` | `color.label.primary` |
| Plain | none | `color.accent.default` |
| Destructive tinted | `color.danger.soft` | `color.danger.text` |
| Destructive plain | none | `color.danger.text` |

| Size | Height | Padding | Radius | Use |
|---|---|---|---|---|
| Touch | `target.touch` | `space.16` | `radius.md` | All touch layouts |
| Touch large | `space.48`, full width | `space.16` | `radius.md` | The main action of a sheet in compact |
| Pointer | `target.pointer` | `space.12` | `radius.sm` | Default on pointer |
| Pointer small | `target.pointer-min` | `space.8` | `radius.sm` | Dense toolbars and tables only |

Icon-only buttons are square at the same heights. On touch the target is never below `target.touch`, even when the visible shape is smaller. One or two prominent (filled) buttons per view. Buttons side by side are the same size; style, not size, marks the preferred one.

## States

| State | Appearance |
|---|---|
| Default | As the style table |
| Hover | Grey and plain: one fill step stronger (`color.fill.tertiary` behind plain, `color.fill.primary` for grey). Filled and tinted: see the token gap below |
| Pressed | Container at `opacity.pressed`, within 100 ms |
| Keyboard focus | Focus ring that follows the container shape |
| Disabled | `opacity.disabled`; not focusable by pointer, still reachable by keyboard so the reason can be read |
| Loading | Spinner replaces the icon or leads the label; width is held; the button cannot be triggered again |
| Error | The button returns to default; the message appears next to it, not inside it |
| Selected | Not a button state. A button that stays on is a toggle |

Token: `color.state.hover` — a hover overlay for filled and tinted containers. The `color.fill.*` steps work only on neutral surfaces.

## Tokens
- Colour: `color.accent.solid`, `color.accent.soft`, `color.accent.default`, `color.label.on-accent`, `color.label.primary`, `color.fill.primary`, `color.fill.secondary`, `color.fill.tertiary`, `color.danger.soft`, `color.danger.text`.
- Type: `type.body` at its emphasised weight (labels); `type.subhead` at its emphasised weight (pointer small).
- Space and shape: `space.8` (icon to label), `space.12`, `space.16`, `space.48`, `radius.md`, `radius.sm`, `icon.md`, `icon.sm` (pointer small), `target.touch`, `target.pointer`, `target.pointer-min`, `border.focus`, `border.focus-offset`.
- Motion and state: `duration.instant`, `easing.standard`, `opacity.pressed`, `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `border.control`, `color.border.control`.

## Behaviour
- Activates on release inside the target; moving off before release cancels.
- Enter activates the primary button of the current view or layer; Escape activates Cancel. Space and Enter activate the focused button.
- An action that takes over a second shows loading on the button that started it, following `feedback-and-status.md`.
- A disabled button states why, next to it or in a tooltip on hover and focus. Prefer leaving the button enabled and explaining on press when the reason is not obvious.
- Button order in sheets and dialogs follows `modality.md`.
- Over photos, video or coloured documents, buttons are monochrome on glass rather than accent-coloured.
- Labels do not wrap on pointer. On touch a full-width button may wrap to two lines at large text sizes, and grows in height.
- Right to left: icon and label swap sides; directional icons mirror.
- Reduced motion: state changes are immediate.

## Accessibility
- Element: native `button`; a link is used for navigation, even when styled as a button.
- Accessible name is the label. Icon-only buttons take the name of the action, not the icon.
- Loading is announced ("Sending") and the button is marked busy. Disabled buttons expose the reason as their description.
- Adjacent buttons keep at least `space.8` between targets.
- Increased contrast: grey and tinted buttons gain a `border.control` outline in `color.border.control`; filled buttons use the increased-contrast accent.

## Content
- A verb, or verb and noun, one to three words, sentence case. The confirming button repeats the verb from the title.
- Good: "Send", "Add people", "Delete forever", "Try again". Bad: "OK", "Yes", "Submit", "Click here".
- Loading. Good: "Sending". Bad: "Please wait…".
- A trailing ellipsis is used only when the button opens a further step that needs input: "Move…".
- Icon-only name. Good: "Archive". Bad: "Box icon button".

Apple reference: Buttons, read 2026-11-11
