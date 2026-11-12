# Account switcher

Status: Specified

## Purpose
Names the current account context on every screen and lets the person switch between their personal account and their organisations, add an account, manage the current one and sign out. It is the only place contexts are switched. It does not switch apps; that is the app launcher.

## Anatomy
- **Account control** (in the top bar's trailing corner): the current context's avatar, and its name where space allows.
- **Switcher panel**:
  - **Current account header**: avatar, name, address, "Managed by" line where it applies, and "Manage account".
  - **Account list**: one row per context, with avatar, name and address or organisation; a check marks the current one.
  - **Add another account.**
  - **Sign out**, naming the account; and "Sign out of all accounts" when there are several.

## Variants and sizes

| Size class | Control | Panel |
|---|---|---|
| Compact | Avatar only, in a `target.touch` button | Sheet from the bottom |
| Regular and wide | Avatar, plus the context name in wide | Popover anchored to the control |

Control avatar: `space.32`. Header avatar: `space.64`. Row avatars: `space.40` on touch, `space.32` on pointer. Rows are two-line list rows. A personal account is a circle and an organisation a rounded square, as `avatar.md` specifies.

## States

| State | Appearance |
|---|---|
| Default | Control shows the current context |
| Hover, pressed | Control and rows as `button.md` and `list.md` |
| Keyboard focus | Focus ring following the avatar shape on the control; inside the row bounds in the list |
| Open | Control holds its pressed appearance |
| Selected (current account) | Check mark at the row's trailing edge and "Current" in its accessible name; not colour alone |
| Disabled | An account that policy blocks on this device stays listed at `opacity.disabled` with the reason on the row |
| Signed out (session expired) | Row shows "Signed out" and selecting it starts sign-in for that account |
| Loading (switching) | The chosen row shows a spinner; the panel stays until the new context is ready |
| Error | "Unable to switch. Try again." on the row; the current context is unchanged |
| Attention | A badge on the control only when an account needs the person to act |

## Tokens
- Colour: `color.bg.elevated` (panel), `color.scrim` (sheet form), `color.label.primary`, `color.label.secondary`, `color.fill.tertiary`, `color.fill.secondary`, `color.separator.default`, `color.accent.default` (check mark, links, focus), `color.danger.text` (row errors), `color.danger.solid`, `color.label.on-accent` (badge).
- Type: `type.title-3` (header name), `type.body` (row name), `type.subhead` (address, organisation), `type.footnote` ("Managed by" line).
- Space and shape: `space.4`, `space.8`, `space.12`, `space.16`, `space.24`, `space.32`, `space.40`, `space.64`, `radius.lg` (popover), `radius.2xl` (sheet), `radius.sm` (row highlight), `radius.full`, `icon.md`, `target.touch`, `target.pointer`, `border.hairline`, `border.focus`, `border.focus-offset`.
- Depth and motion: `elevation.2` (popover), `elevation.3` (sheet), `z.popover`, `z.sheet`, `duration.quick`, `duration.emphasized`, `easing.standard`, `easing.spring`, `easing.exit`, `opacity.disabled`.
- Also used (sizes, selection, increased contrast): `border.control`.

## Behaviour
- The control sits in the same corner in every app and at every size, and always shows the current context.
- Switching is instant, keeps the current app and its section, and does not sign the person out of the other accounts.
- If the current item does not exist in the new context, the app opens at its root there and says so; content never moves between contexts by switching.
- The panel holds only account matters. No upgrade offers; storage and plans are reached through "Manage account" and follow `patterns/plans-and-upgrades.md`.
- "Add another account" starts sign-in as `onboarding-and-accounts.md` describes; the new context then appears in the list.
- Sign out always says which account. Signing out of the current account switches to the next one, or to the sign-in screen if none is left.
- Accounts are listed personal first, then organisations in the order the person joined; the order does not change with use.
- Keyboard: Enter or Space opens; arrow keys move between rows; Escape closes and returns focus to the control.
- Right to left: the control sits at the top left; rows mirror.
- Reduced motion: the panel cross-fades.

## Accessibility
- The control is a `button` that opens a dialog. Its accessible name states the context: "Account: Lena Marsh, Northwind Studio".
- Rows read name, address, kind and state: "Northwind Studio, lena@northwind.example, organisation, current".
- Shape distinguishes personal from organisation, and each row also says which in text.
- A context change is announced once the new context has loaded.
- Increased contrast: avatars gain an outline; the current row gains a `border.control` outline in `color.accent.default`.

## Content
- Context names. Good: "Personal", "Northwind Studio". Bad: "Default workspace", "Tenant 2".
- Managed line. Good: "Managed by Northwind Studio". Bad: "This is a corporate-managed profile".
- Actions. Good: "Add another account", "Manage account", "Sign out of lena@northwind.example". Bad: "Log out", "Switch user", "Account settings and more".

Apple reference: none (no equivalent)
