# Notifications

Status: Specified

## Purpose

A notification tells someone that something happened elsewhere which they would want to know: a mention, a share, an invitation, a security event. This spec covers the three places one appears: a push notification from the operating system, the in-app notification list, and email. It does not cover feedback on the person's own action (toast), view-wide conditions (banner) or errors, which are never sent as notifications.

## Anatomy

Every notification, in every channel, carries the same four facts:

- **Who.** The person or system that acted, with avatar where the channel allows.
- **What.** The action and the item's name.
- **Where.** The app and the exact item it opens.
- **Context.** Personal, or the organisation's name.

Optional: a preview line, a time, and up to two actions.

## Variants and sizes

| Channel | Form | Limits |
|---|---|---|
| Push | The platform's own layout. Title is who; body is what | The system supplies app name and icon; do not repeat them |
| In-app list | A popover from the top bar on regular and wide; a full view in compact | Row at least `target.touch` on touch, `target.pointer` on pointer |
| Email | The transactional email template. Subject is who and what | One primary button; a plain-text version always |

| Urgency | Use |
|---|---|
| Time sensitive | Security events, a call starting now, an event about to start. Nothing else |
| Normal | Mentions, shares, invitations, replies |
| Quiet | Digests and summaries; no sound, no banner |

## States

In-app list rows:

| State | Treatment |
|---|---|
| Unread | Dot at the leading edge plus title at the emphasized weight |
| Read | No dot; regular weight |
| Hover (pointer) | `color.fill.tertiary`; row actions appear, and are also in the row's menu |
| Pressed | `opacity.pressed` |
| Keyboard focus | Ring `border.focus` in `color.accent.default`, offset `border.focus-offset` |
| Loading | Skeleton rows |
| Empty, error | "No notifications"; "Unable to load notifications" with "Try again" |
| Item no longer available | Row stays, dimmed to `color.label.tertiary`, and says the item was deleted or access was removed |

## Tokens

- List surface: popover tokens from `popover.md`; rows on `color.bg.elevated`; separators `border.hairline` in `color.separator.default`.
- Colour: unread dot `color.accent.solid`; title `color.label.primary`; preview and time `color.label.secondary`; context `color.label.secondary`.
- Text: title `type.subhead`; preview `type.footnote`; time and context `type.caption-1`.
- Space: `space.12` row padding; `space.12` avatar to text; `space.4` between lines.
- Motion: new row enters over `duration.standard` with `easing.standard`.

## Behaviour

- Opening a notification goes to the exact item, in the right account context, switching context if needed and saying so.
- One event, one notification. Never repeat it because it was not opened. Related events group by item or conversation.
- Nothing is sent for something the person did themselves, and none promote features or upgrades.
- While the app is in front, no push banner: the list and badge update instead.
- **Lock screen.** When the system hides previews, the text is generic: "New message", with no names or titles. People choose in settings how much detail a push shows.
- Push actions are short and safe: "Reply", "Accept", "Mark as read". Prefer non-destructive actions; never an action that only opens the app.
- The list groups by day, newest first, with "Mark all as read". A notification read on one device is read on all, and its badge clears.
- People set notifications per app and per type, per account context, with one place to pause everything. Each email says why it was sent and links straight to that setting.
- Storage notices follow `../patterns/plans-and-upgrades.md`: at most once per state.
- Right-to-left: rows mirror; names and file titles are isolated. Reduced motion: new rows appear without movement.

## Accessibility

- The list is a labelled region with a list of links or buttons. Each row's name reads who, what, where, context, time, and "unread".
- New notifications are announced politely, without moving focus. Time-sensitive ones may be assertive.
- Unread is a dot and a weight change, not colour alone.
- Email: real text, no text in images, a descriptive subject, one clearly named button, and readable without images.
- Increased contrast: the unread dot gains a ring in `color.label.primary`.

## Content

- Who, what, where, in one sentence. Sentence case. No instructions to "open the app".

| Good | Bad |
|---|---|
| "Lena shared 'Brand refresh' with you" | "You have a new notification" |
| "New sign-in to your account from Chrome on Windows, Lagos" | "Security alert!!!" |
| "New message" (previews hidden) | The full message on a locked screen |
| "You're receiving this because you're mentioned in 'Q3 plan'. Change notification settings." | "Unsubscribe" with no reason |

Apple reference: Notifications, Managing notifications, read 2026-11-11
