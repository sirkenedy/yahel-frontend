# Banner

Status: Specified

## Purpose

A banner states a condition that affects the whole view and stays for as long as the condition holds: offline, read-only, storage almost full, viewing as someone else. Use a toast for the result of one action, a message next to the field for a field problem, and a dialog only when a decision is required.

## Anatomy

- **Icon.** Required. Carries the tone together with the words.
- **Message.** Required. One or two sentences.
- **Actions.** Optional. Two at most, as plain or tinted buttons.
- **Dismiss.** Optional. Only where the pattern allows the banner to be dismissed.

## Variants and sizes

| Tone | Use | Example |
|---|---|---|
| Neutral | A state to be aware of | Offline, read-only |
| Accent | Something new or available | A newer version of this document exists |
| Warning | Something will stop working soon | Storage almost full |
| Danger | Something has stopped | Storage full, sending paused |

- Full width of the view it describes, at the top, under the top bar. In a split view it sits in the pane it applies to.
- Height follows content; minimum `target.touch` on touch and `target.pointer` plus padding on pointer.
- Buttons inside: `target.touch` on touch, `target.pointer-min` on pointer.
- Compact: actions wrap under the message.

## States

| State | Treatment |
|---|---|
| Default | Shown while the condition holds |
| Action hover, pressed, focus, disabled, loading | As Button |
| Dismissed | Leaves the view; the condition stays visible elsewhere (the storage meter, the offline indicator) |
| Resolved | Leaves when the condition clears; no extra "back online" banner unless queued changes were sent |

The banner itself has no hover, pressed or selected state; it is not a button.

## Tokens

| Tone | Background | Text and icon |
|---|---|---|
| Neutral | `color.bg.sunken` | `color.label.primary`, icon `color.label.secondary` |
| Accent | `color.accent.soft` | `color.accent.default` |
| Warning | `color.warning.soft` | `color.warning.text` |
| Danger | `color.danger.soft` | `color.danger.text` |

- Shape: `radius.md` when inset in a pane; no radius when it spans the window edge to edge.
- Text: `type.subhead`; action labels at the emphasized weight. Icon `icon.md`.
- Space: `space.12` vertical and `space.16` horizontal padding; `space.12` icon to message; `space.8` between actions.
- Layer: `z.sticky`. No elevation.
- Motion: enter `duration.standard` with `easing.standard`; exit `duration.quick` with `easing.exit`.

## Behaviour

- One banner per view. If two conditions apply, show the more severe and fold the other into its message or its destination.
- Pushes content down; it never covers content. It stays pinned while the view scrolls.
- Does not take focus when it appears. It sits first in the reading and tab order of the view.
- No timer. A banner leaves only when dismissed or when the condition clears.
- Dismissal rules come from the pattern: "getting full" is dismissible and shown once; "almost full" and "full" persist. See `../patterns/plans-and-upgrades.md`.
- An upgrade action is never the only action; "Free up space" sits beside "Get more storage".
- Motion: height expands from the top. Reduced motion: cross-fade.
- Right-to-left: icon, message and actions mirror.

## Accessibility

- `role="status"` for neutral, accent and warning; `role="alert"` for danger. Announced once when it appears, not on every visit to the view.
- The icon is decorative when the words carry the meaning; the tone is never colour alone.
- Increased contrast: a `border.control` outline in the tone's text colour.
- Reduced transparency: no change.
- At 200% text, actions stack under the message; nothing truncates.

## Content

- State the fact, then what the person can do. No blame, no urgency.
- Say exactly what has stopped and what still works.

| Good | Bad |
|---|---|
| "Offline. Changes are saved on this device." | "No internet connection detected!" |
| "Storage is full. Uploads and incoming mail are paused. Existing files are still available." | "You're out of space! Upgrade now." |
| "Free up space" / "Get more storage" | "Upgrade" as the only action |
| "View only. Ask Lena for edit access." | "Permission denied" |

Apple reference: none (no equivalent)
