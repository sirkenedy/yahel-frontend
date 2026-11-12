# Badge and counter

Status: Specified

## Purpose

A badge marks that something needs the person's attention: unread mail, a mention, a failed send. A counter is a badge with a number. Badges are for attention only, never for promotion, "new feature" markers or decoration. For a status word on an item use a tag; for presence use the presence indicator.

## Anatomy

- **Host.** The tab, sidebar item, app icon or avatar the badge belongs to.
- **Dot or pill.** At the host's top trailing corner, or at the trailing end of a row.
- **Number.** Counter only.

## Variants and sizes

| Variant | Use |
|---|---|
| Dot | Something is new, and the amount does not matter or is unknown |
| Counter | How many items are unread or waiting |
| Inline counter | In a sidebar or list row, at the trailing end, without a filled pill |
| Problem | A failure on the host that needs action (a message that could not be sent) |

- Dot: `space.8` across.
- Counter: height is the text line plus `space.2` above and below; minimum width equals the height; grows sideways with digits.
- The badge is not a target. The host keeps its own target size.
- App-icon badges on native platforms are drawn by the system and show the unread count only.

## States

| State | Treatment |
|---|---|
| Hidden | Count is zero. The badge is removed, not shown as "0" |
| Shown | Dot or number |
| Over the cap | "99+" |
| Muted host | Dot instead of a number, in `color.label.tertiary` |
| Host selected | Badge unchanged; it keeps its contrast against the selected background |
| Host disabled | Badge takes `opacity.disabled` with the host |

A badge has no hover, pressed, focus, loading or error state of its own.

## Tokens

- Attention: `color.accent.solid` with `color.label.on-accent`.
- Problem: `color.danger.solid` with `color.label.on-accent`, plus an icon in place of the number.
- Inline counter: `color.label.secondary` text, emphasized weight when unread; no fill.
- Ring: `border.control` in the surface colour behind the host (`color.bg.base`, `color.bg.grouped` or `color.bg.elevated`) where the badge overlaps an icon or avatar.
- Shape: `radius.full`.
- Text: `type.caption-2` at the emphasized weight, tabular figures.
- Space: `space.4` horizontal padding in a counter.
- Motion: appears over `duration.quick` with `easing.spring`; number changes `duration.instant`; leaves over `duration.quick` with `easing.exit`.

## Behaviour

- The count is always current. It drops as soon as items are read, on every device.
- A badge is never the only signal. Whatever caused it is also in the list or notification it points to.
- One badge per host. Counts roll up: an app's badge is the sum of what its sections show.
- Nothing the person did themselves raises a badge.
- People control badges per app and per type in notification settings, and pausing notifications pauses badges.
- Each account context keeps its own count; the account switcher shows a badge for contexts other than the current one.
- Right-to-left: the badge sits at the top left of its host, or the left end of a row. Numerals follow the locale.
- Reduced motion: appears and leaves with a cross-fade.

## Accessibility

- The badge is part of the host's accessible name: "Inbox, 3 unread". It is not a separate element to assistive technology.
- A dot has words too: "Chat, new messages".
- Count changes are announced politely by the live region for the content (new mail), not by the badge.
- The problem badge has an icon as well as its colour.
- Increased contrast: the ring uses `color.label.primary`.
- At 200% text the counter grows with its text and may overlap less of the host; it never truncates.

## Content

| Good | Bad |
|---|---|
| "3" | "3 new!" |
| "99+" | "1,284" on a tab |
| "Inbox, 3 unread" (accessible name) | "3" read out with no context |
| No badge when nothing is waiting | A dot to advertise a feature |

Apple reference: Notifications, read 2026-11-11
