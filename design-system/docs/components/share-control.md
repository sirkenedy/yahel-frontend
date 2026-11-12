# Share control

Status: Specified

## Purpose
The single entry point to sharing for any shareable item: a file, folder, calendar, document or recording. It shows at a glance whether the item is shared and opens the share view described in `sharing-and-collaboration.md`. It is not a general "send to another app" control; on native platforms that is a separate "Send a copy" item, which opens the system share sheet.

## Anatomy
- **Button**: the share icon, with the label "Share" where space allows.
- **Access marker** (optional): a small marker on the button when the item is shared, and a distinct one when a public link exists.
- **Presence stack** (editors): avatars of people in the item now, immediately before the button.
- **Share view** (opened): access summary, people with access, add people, role pop-up, link settings, Done.

## Variants and sizes

| Variant | Where | Form |
|---|---|---|
| Toolbar, labelled | Editors and detail views in regular and wide | Tinted button with icon and label |
| Toolbar, icon | Compact width, dense toolbars | Icon button |
| Menu item | Row and context menus: second in the standard order, after Open | Menu item with the same icon |

Sizes follow `button.md`: `target.touch` on touch, `target.pointer` on pointer. The share view is a sheet in compact and a centred panel in regular and wide.

## States

| State | Appearance |
|---|---|
| Default (not shared) | Button with no marker |
| Shared | Marker shown; tooltip and accessible name carry the summary |
| Public link | Distinct marker, by shape and not colour alone |
| Hover, pressed, keyboard focus | As `button.md` |
| Disabled | Only when the person may not share. The button stays, at `opacity.disabled`, and the reason is stated: who can share, or which policy prevents it |
| Loading | The share view opens at once; the people list shows skeleton rows. Role changes show progress on the pop-up that changed |
| Error | In the share view, next to the field or person it concerns. Typed names and messages are kept |
| Open | Button holds its pressed appearance while the share view is open |

## Tokens
- Colour: `color.accent.soft`, `color.accent.default`, `color.label.primary`, `color.label.secondary`, `color.fill.tertiary`, `color.fill.secondary`, `color.bg.elevated` (share view), `color.scrim`, `color.separator.default`, `color.warning.soft`, `color.warning.text` (boundary notice), `color.danger.text`.
- Type: `type.body` at its emphasised weight (button label), `type.title-3` (share view title), `type.body` (access summary, names), `type.subhead` (addresses), `type.footnote` (notices).
- Space and shape: `space.4`, `space.8`, `space.12`, `space.16`, `space.24`, `radius.md`, `radius.sm`, `radius.2xl` (share view), `icon.md`, `icon.sm` (marker), `target.touch`, `target.pointer`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.3`, `z.sheet`, `duration.emphasized`, `easing.spring` (open), `duration.quick`, `easing.exit` (close), `opacity.disabled`, `opacity.pressed`.
- Also used (sizes, selection, increased contrast): `border.control`.

## Behaviour
- Same icon, same label and same position in every app: in the trailing group of the toolbar, before the primary action and the More menu. Presence avatars sit next to it.
- There is one way in. No second button or menu item opens a different sharing flow for the same item.
- The share view answers, in order: who has access now, who to add, what they can do. The access summary in words is the first line.
- Defaults are least access: new people can view; links are restricted.
- Crossing a boundary (someone outside the organisation, a public link) shows a notice with an icon and the person's external status before confirming. It is not a second dialog; it appears inside the share view.
- Changes apply when confirmed and say so. Removing access takes effect at once. Closing with an unsent invitation asks first or keeps it.
- Keyboard: Enter or Space on the button opens the share view; Escape closes it; focus returns to the button.
- Right to left: the presence stack and button order mirror. The share icon itself does not mirror.
- Reduced motion: the share view cross-fades in.

## Accessibility
- Element: `button` that opens a dialog. Accessible name is "Share" plus the summary: "Share. Only invited people can edit."
- The marker is never the only signal of access; the summary is always available in words.
- The share view is a dialog labelled by its title, with focus trapped and returned.
- Role changes and removals are announced: "Lena Marsh can now edit".
- External people are labelled in text, not only by a marker.
- Increased contrast: as `button.md`; the boundary notice gains a `border.control` outline in `color.warning.text`.

## Content
- Button: "Share". Bad: "Collaborate", "Invite", "Permissions".
- Share view title names the item: "Share 'Brand refresh'".
- Access summary. Good: "Only you", "Only invited people can edit", "Anyone at Northwind Studio with the link can view". Bad: "Restricted", "ACL: 3 principals".
- Boundary notice. Good: "Dana Okoro is outside Northwind Studio." Bad: "Warning! External user!".
- Disabled reason. Good: "Only the owner can share this folder". Bad: "Action not permitted".

Apple reference: Activity views, read 2026-11-11
