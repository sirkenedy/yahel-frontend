# Tooltip

Status: Specified

## Purpose

A tooltip names an icon-only control and shows its keyboard shortcut, or shows the full text of something truncated. It is a pointer and keyboard aid. It never holds the only copy of information or an action, because touch has no hover. For teaching a feature, use a tip (see `../patterns/onboarding-and-accounts.md`); for detail with controls, use a popover.

## Anatomy

- **Label.** Required. One short line.
- **Shortcut.** Optional, after the label.
- **Container.** No arrow.

## Variants and sizes

| Variant | Content | Use |
|---|---|---|
| Name | Control name, plus shortcut if one exists | Every icon-only control |
| Description | What the control does, when the visible label is not enough | Labelled controls; do not repeat the label |
| Full text | The untruncated string | Truncated file names, subjects, addresses |

- One size. Height follows the text. Width follows the text up to about 75 characters, then wraps.
- Pointer and keyboard only. On touch, the same name is the control's accessible name and appears in the long-press context menu where one exists.

## States

| State | Treatment |
|---|---|
| Hidden | Default |
| Visible on hover | After a short delay. Token: `duration.hover-delay` — the wait before a tooltip appears |
| Visible on keyboard focus | At once, no delay |
| Pressed | Hides when the control is activated |
| Disabled control | The tooltip still appears and gives the reason: "Only the owner can delete" |

A tooltip has no loading, error or selected state. When the control's state changes, the tooltip text changes with it ("Mute" becomes "Unmute").

## Tokens

- Surface: `material.thick` with `blur.thick` and a `border.hairline` edge in `material.edge`; fallback `color.bg.elevated-2`. `elevation.2`, `radius.sm`, `z.popover`.
- Text: `type.caption-1` in `color.label.primary`; shortcut in `color.label.secondary`, `font.mono` for key names.
- Space: `space.8` horizontal and `space.4` vertical padding; `space.8` between label and shortcut; `space.8` from the control.
- Motion: enter `duration.instant`; exit `duration.instant`.

## Behaviour

- Appears below the control by default, centred on it; flips to stay in the window. It never covers the control.
- Stays for as long as the pointer is over the control or the tooltip, or the control has focus. It does not time out.
- Escape hides it without moving focus. Moving to a neighbouring control shows that control's tooltip without the delay.
- One tooltip at a time. It describes only the control it belongs to.
- Not interactive: no links or buttons inside.
- Motion: fade only, in every setting.
- Right-to-left: text and shortcut order mirror; key names stay as printed on the keyboard.

## Accessibility

- `role="tooltip"`. For an icon-only control the name is the control's `aria-label`; the tooltip is the visible form of it and is not announced a second time. A description tooltip is linked with `aria-describedby`.
- The shortcut is exposed with `aria-keyshortcuts`.
- Hoverable, dismissible and persistent, as WCAG 1.4.13 requires.
- Reduced transparency: `color.bg.elevated-2` with the same edge.
- Increased contrast: edge becomes `color.separator.opaque`.

## Content

- Sentence case, no full stop. A verb or a noun, matching the name used everywhere else for that action.
- Platform shortcut symbols: Command on Apple platforms, Ctrl elsewhere.

| Good | Bad |
|---|---|
| "Archive" with shortcut "E" | "Click to archive this message" |
| "Unmute" (while muted) | "Mute/unmute" |
| "Only the owner can delete" | "Disabled" |
| "Sends when you're back online" (on a labelled "Send" button) | "Send" (repeats the label) |

Apple reference: Offering help, read 2026-11-11
